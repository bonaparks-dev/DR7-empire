/**
 * calculate-dynamic-price
 * =======================
 * Website Netlify function that reads revenue_config from Supabase
 * and returns a dynamic daily rate for a given vehicle + dates.
 *
 * When revenue management is disabled (or config missing), returns
 * { enabled: false } so the frontend falls back to hardcoded tables.
 *
 * The pricing engine logic mirrors the admin's revenuePricingEngine.ts
 * exactly — same formula, same bracket matching, same clamping.
 */

import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { getCorsOrigin } from './utils/cors'

// ─── Supabase ──────────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL or VITE_SUPABASE_URL environment variable is required')
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey || '',
  { db: { schema: 'public' }, auth: { persistSession: false } }
)

// ─── Pricing engine types (inline to avoid cross-project imports) ──────────

interface CoefficientRow {
  min_pct?: number
  max_pct?: number
  min_days?: number
  max_days?: number
  coeff: number
  label: string
}

interface SeasonRule {
  name: string
  start_date: string  // MM-DD
  end_date: string    // MM-DD
  coeff: number
  type: string
}

interface RevenueConfig {
  enabled: boolean
  mode: 'disabled' | 'suggestion' | 'auto_apply'
  base_prices: Record<string, number>
  min_prices: Record<string, number>
  max_prices: Record<string, number>
  occupation_coefficients: CoefficientRow[]
  advance_coefficients: CoefficientRow[]
  duration_coefficients: CoefficientRow[]
  season_rules: SeasonRule[]
}

// ─── Default coefficients (must match admin revenuePricingEngine.ts) ───────

const DEFAULT_OCCUPATION_COEFFICIENTS: CoefficientRow[] = [
  { min_pct: 0, max_pct: 40, coeff: 0.90, label: 'Bassa occupazione' },
  { min_pct: 40, max_pct: 70, coeff: 1.00, label: 'Occupazione normale' },
  { min_pct: 70, max_pct: 90, coeff: 1.15, label: 'Alta occupazione' },
  { min_pct: 90, max_pct: 101, coeff: 1.30, label: 'Occupazione critica' },
]

const DEFAULT_ADVANCE_COEFFICIENTS: CoefficientRow[] = [
  { min_days: 0, max_days: 2, coeff: 1.25, label: 'Last minute' },
  { min_days: 2, max_days: 7, coeff: 1.10, label: 'Prenotazione breve' },
  { min_days: 7, max_days: 30, coeff: 1.00, label: 'Anticipo standard' },
  { min_days: 30, max_days: 9999, coeff: 0.95, label: 'Prenotazione anticipata' },
]

const DEFAULT_DURATION_COEFFICIENTS: CoefficientRow[] = [
  { min_days: 1, max_days: 3, coeff: 1.00, label: 'Breve durata' },
  { min_days: 3, max_days: 7, coeff: 0.95, label: 'Settimanale' },
  { min_days: 7, max_days: 14, coeff: 0.90, label: 'Bi-settimanale' },
  { min_days: 14, max_days: 30, coeff: 0.85, label: 'Mensile' },
  { min_days: 30, max_days: 9999, coeff: 0.80, label: 'Lungo termine' },
]

// ─── Pricing engine (same logic as admin revenuePricingEngine.ts) ──────────

function matchBracket(
  brackets: CoefficientRow[],
  value: number,
  field: 'pct' | 'days'
): CoefficientRow | null {
  const minKey = field === 'pct' ? 'min_pct' : 'min_days'
  const maxKey = field === 'pct' ? 'max_pct' : 'max_days'

  for (const b of brackets) {
    const min = b[minKey] ?? 0
    const max = b[maxKey] ?? 9999
    if (value >= min && value < max) return b
  }
  return null
}

function matchSeason(
  rules: SeasonRule[],
  pickupDate: string,
  dropoffDate: string
): SeasonRule | null {
  const pickup = new Date(pickupDate)
  const pickupMM = String(pickup.getMonth() + 1).padStart(2, '0')
  const pickupDD = String(pickup.getDate()).padStart(2, '0')
  const pickupMMDD = `${pickupMM}-${pickupDD}`

  const dropoff = new Date(dropoffDate)
  const dropoffMM = String(dropoff.getMonth() + 1).padStart(2, '0')
  const dropoffDD = String(dropoff.getDate()).padStart(2, '0')
  const dropoffMMDD = `${dropoffMM}-${dropoffDD}`

  let best: SeasonRule | null = null
  for (const rule of rules) {
    if (!rule.start_date || !rule.end_date) continue
    const crosses = rule.start_date > rule.end_date

    let overlaps = false
    if (crosses) {
      overlaps = pickupMMDD >= rule.start_date || pickupMMDD <= rule.end_date ||
                 dropoffMMDD >= rule.start_date || dropoffMMDD <= rule.end_date
    } else {
      overlaps = (pickupMMDD >= rule.start_date && pickupMMDD <= rule.end_date) ||
                 (dropoffMMDD >= rule.start_date && dropoffMMDD <= rule.end_date) ||
                 (pickupMMDD <= rule.start_date && dropoffMMDD >= rule.end_date)
    }

    if (overlaps && (!best || rule.coeff > best.coeff)) {
      best = rule
    }
  }
  return best
}

function getDefaultConfig(): RevenueConfig {
  return {
    enabled: true,
    mode: 'auto_apply',
    base_prices: {},
    min_prices: {},
    max_prices: {},
    occupation_coefficients: DEFAULT_OCCUPATION_COEFFICIENTS,
    advance_coefficients: DEFAULT_ADVANCE_COEFFICIENTS,
    duration_coefficients: DEFAULT_DURATION_COEFFICIENTS,
    season_rules: [],
  }
}

function parseConfigFromDB(row: any): RevenueConfig {
  if (!row) return getDefaultConfig()

  const c = (row.config || {}) as Record<string, any>
  const validModes = ['disabled', 'suggestion', 'auto_apply']
  const rawMode = String(row.mode || 'auto_apply')
  let mode: RevenueConfig['mode']
  if (rawMode === 'auto' || rawMode === 'auto_with_approval') {
    mode = 'auto_apply'
  } else if (validModes.includes(rawMode)) {
    mode = rawMode as RevenueConfig['mode']
  } else {
    mode = 'auto_apply'
  }

  // Use defaults if coefficient arrays are empty/missing — never let them be []
  const occCoeffs = c.occupation_coefficients as CoefficientRow[] | undefined
  const advCoeffs = c.advance_coefficients as CoefficientRow[] | undefined
  const durCoeffs = c.duration_coefficients as CoefficientRow[] | undefined

  return {
    enabled: row.enabled ?? true,
    mode,
    base_prices: (c.base_prices as Record<string, number>) || {},
    min_prices: (c.min_prices as Record<string, number>) || {},
    max_prices: (c.max_prices as Record<string, number>) || {},
    occupation_coefficients: occCoeffs?.length ? occCoeffs : DEFAULT_OCCUPATION_COEFFICIENTS,
    advance_coefficients: advCoeffs?.length ? advCoeffs : DEFAULT_ADVANCE_COEFFICIENTS,
    duration_coefficients: durCoeffs?.length ? durCoeffs : DEFAULT_DURATION_COEFFICIENTS,
    season_rules: (c.season_rules as SeasonRule[]) || [],
  }
}

// ─── Handler ───────────────────────────────────────────────────────────────

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': getCorsOrigin(event.headers['origin']),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { vehicle_id, pickup_date, dropoff_date } = JSON.parse(event.body || '{}')

    if (!vehicle_id || !pickup_date || !dropoff_date) {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ error: 'Missing required fields: vehicle_id, pickup_date, dropoff_date' }),
      }
    }

    // 1. Fetch revenue config
    const { data: configRow, error: configError } = await supabase
      .from('revenue_config')
      .select('*')
      .limit(1)
      .single()

    // Default: enabled + auto_apply with default coefficients when no config row exists
    const config = (configError || !configRow)
      ? getDefaultConfig()
      : parseConfigFromDB(configRow)

    // Only skip if admin explicitly disabled it
    if (config.mode === 'disabled') {
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ enabled: false, mode: config.mode }),
      }
    }

    // 2. Fetch vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, display_name, daily_rate, category, status')
      .eq('id', vehicle_id)
      .single()

    if (vehicleError || !vehicle) {
      return {
        statusCode: 404, headers,
        body: JSON.stringify({ error: 'Vehicle not found' }),
      }
    }

    // 3. Calculate fleet occupancy for this category
    const vehicleCategory = vehicle.category || 'urban'

    const { data: categoryVehicles } = await supabase
      .from('vehicles')
      .select('id')
      .eq('category', vehicleCategory)
      .neq('status', 'retired')

    const totalInCategory = categoryVehicles?.length || 1

    const { data: overlappingBookings } = await supabase
      .from('bookings')
      .select('vehicle_id')
      .in('vehicle_id', (categoryVehicles || []).map((v: { id: string }) => v.id))
      .not('status', 'in', '(cancelled,annullata,completed,completata)')
      .lte('pickup_date', dropoff_date)
      .gte('dropoff_date', pickup_date)

    const busyVehicleIds = new Set((overlappingBookings || []).map((b: { vehicle_id: string }) => b.vehicle_id))
    const occupancyPct = Math.round((busyVehicleIds.size / totalInCategory) * 100)

    // 4. Run pricing engine
    const vehicleDailyRateCents = (vehicle.daily_rate || 0) * 100
    const vehicleBaseRateEur = vehicleDailyRateCents / 100

    // Base rate priority: vehicle override > category override > vehicle daily_rate
    const vehicleOverride = config.base_prices[vehicle.id]
    const categoryOverride = config.base_prices[`category:${vehicleCategory}`]

    let selectedBaseRateEur: number
    let selectedBaseRateSource: string

    if (vehicleOverride != null && vehicleOverride > 0) {
      selectedBaseRateEur = vehicleOverride
      selectedBaseRateSource = 'vehicle_override'
    } else if (categoryOverride != null && categoryOverride > 0) {
      selectedBaseRateEur = categoryOverride
      selectedBaseRateSource = 'category_override'
    } else {
      selectedBaseRateEur = vehicleBaseRateEur
      selectedBaseRateSource = 'vehicle_daily_rate'
    }

    // Rental days
    const pickupMs = new Date(pickup_date).getTime()
    const dropoffMs = new Date(dropoff_date).getTime()
    const rentalDays = Math.max(1, Math.ceil((dropoffMs - pickupMs) / (1000 * 60 * 60 * 24)))

    // Days ahead
    const nowMs = Date.now()
    const daysAhead = Math.max(0, Math.floor((pickupMs - nowMs) / (1000 * 60 * 60 * 24)))

    // Coefficients
    const occBracket = matchBracket(config.occupation_coefficients, occupancyPct, 'pct')
    const occCoeff = occBracket?.coeff ?? 1.0

    const advBracket = matchBracket(config.advance_coefficients, daysAhead, 'days')
    const advCoeff = advBracket?.coeff ?? 1.0

    const durBracket = matchBracket(config.duration_coefficients, rentalDays, 'days')
    const durCoeff = durBracket?.coeff ?? 1.0

    const seasonMatch = matchSeason(config.season_rules, pickup_date, dropoff_date)
    const seasonCoeff = seasonMatch?.coeff ?? 1.0

    // Formula
    let rawDailyRate = selectedBaseRateEur * occCoeff * advCoeff * durCoeff * seasonCoeff

    // Min/Max clamp
    const minPrice = config.min_prices[vehicle.id]
      ?? config.min_prices[`category:${vehicleCategory}`]
      ?? null
    const maxPrice = config.max_prices[vehicle.id]
      ?? config.max_prices[`category:${vehicleCategory}`]
      ?? null

    let finalDailyRate = rawDailyRate
    if (minPrice != null && finalDailyRate < minPrice) finalDailyRate = minPrice
    if (maxPrice != null && finalDailyRate > maxPrice) finalDailyRate = maxPrice

    // Round to 2 decimals
    finalDailyRate = Math.round(finalDailyRate * 100) / 100
    const finalTotalEur = Math.round(finalDailyRate * rentalDays * 100) / 100

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        enabled: true,
        mode: config.mode,
        finalDailyRateEur: finalDailyRate,
        finalTotalEur,
        rentalDays,
        selectedBaseRateEur,
        selectedBaseRateSource,
        occupancyPct,
        coefficients: {
          occupancy: occCoeff,
          advance: advCoeff,
          duration: durCoeff,
          seasonality: seasonCoeff,
        },
      }),
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: message }),
    }
  }
}
