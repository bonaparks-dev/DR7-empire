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

interface NamedCoeff { key: string; label: string; coeff: number }

interface RevenueConfig {
  enabled: boolean
  mode: 'disabled' | 'suggestion' | 'auto_apply'
  base_prices: Record<string, number>
  min_prices: Record<string, number>
  max_prices: Record<string, number>
  occupation_coefficients: CoefficientRow[]
  advance_coefficients: CoefficientRow[]
  duration_coefficients: CoefficientRow[]
  calendar_gap_coefficients: CoefficientRow[]
  season_rules: SeasonRule[]
  day_type_coefficients: NamedCoeff[]
  vehicle_occupation_coefficients: NamedCoeff[]
  promo_push_coefficients: NamedCoeff[]
  special_dates: Record<string, string>
  active_promo_level: string
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

const DEFAULT_NAMED: NamedCoeff[] = []

// Build engine-format season_rules from Pro's named tiers + month→tier map.
// Pro stores: season_coefficients=[{key,label,coeff}], season_by_month={1:'alta',...}
// Engine expects: [{name, type, start_date: 'MM-DD', end_date: 'MM-DD', coeff}]
function buildSeasonRulesFromProConfig(proDynamic: any): SeasonRule[] {
  const coeffs = Array.isArray(proDynamic?.season_coefficients) ? proDynamic.season_coefficients : []
  const monthMap: Record<string, string> = (proDynamic?.season_by_month && typeof proDynamic.season_by_month === 'object') ? proDynamic.season_by_month : {}
  if (!coeffs.length || Object.keys(monthMap).length === 0) return []

  const tierToCoeff = new Map<string, number>()
  const tierToLabel = new Map<string, string>()
  for (const c of coeffs) {
    if (c && typeof c.key === 'string' && typeof c.coeff === 'number') {
      tierToCoeff.set(c.key, c.coeff)
      tierToLabel.set(c.key, typeof c.label === 'string' ? c.label : c.key)
    }
  }

  const daysInMonth = (m: number) => {
    if (m === 2) return 28
    if ([4, 6, 9, 11].includes(m)) return 30
    return 31
  }

  const rules: SeasonRule[] = []
  for (let m = 1; m <= 12; m++) {
    const tier = monthMap[String(m)]
    if (!tier) continue
    const coeff = tierToCoeff.get(tier)
    if (typeof coeff !== 'number') continue
    const mm = String(m).padStart(2, '0')
    const lastDay = String(daysInMonth(m)).padStart(2, '0')
    rules.push({
      name: tierToLabel.get(tier) || tier,
      type: tier,
      start_date: `${mm}-01`,
      end_date: `${mm}-${lastDay}`,
      coeff,
    })
  }
  return rules
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
    calendar_gap_coefficients: [],
    season_rules: [],
    day_type_coefficients: DEFAULT_NAMED,
    vehicle_occupation_coefficients: DEFAULT_NAMED,
    promo_push_coefficients: DEFAULT_NAMED,
    special_dates: {},
    active_promo_level: '',
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
    calendar_gap_coefficients: (c.calendar_gap_coefficients as CoefficientRow[]) || [],
    season_rules: (c.season_rules as SeasonRule[]) || [],
    day_type_coefficients: (c.day_type_coefficients as NamedCoeff[]) || [],
    vehicle_occupation_coefficients: (c.vehicle_occupation_coefficients as NamedCoeff[]) || [],
    promo_push_coefficients: (c.promo_push_coefficients as NamedCoeff[]) || [],
    special_dates: (c.special_dates as Record<string, string>) || {},
    active_promo_level: (c.active_promo_level as string) || '',
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

    // 1. Fetch revenue config from Centralina Pro
    let config = getDefaultConfig()
    const { data: proRow } = await supabase
      .from('centralina_pro_config')
      .select('config')
      .eq('id', 'main')
      .maybeSingle()

    const proDynamic = proRow?.config?.prezzoDinamico?.dynamic
    if (proDynamic && typeof proDynamic === 'object') {
      const PRO_TO_DB: Record<string, string> = { supercars: 'exotic', urban: 'urban', aziendali: 'aziendali' }
      const remapPrices = (prices: Record<string, any>): Record<string, number> => {
        const out: Record<string, number> = {}
        for (const [k, v] of Object.entries(prices || {})) {
          if (typeof v !== 'number' || v === 0) continue
          out[PRO_TO_DB[k] ? `category:${PRO_TO_DB[k]}` : k] = v
        }
        return out
      }
      const mapCoeffs = (rows: any[], keyMin: string, keyMax: string) => rows.map((r: any) => ({
        [keyMin]: r.min ?? r[keyMin] ?? 0,
        [keyMax]: r.max ?? r[keyMax] ?? 100,
        coeff: typeof r.coeff === 'number' ? r.coeff : 1,
        label: r.label || '',
      }))

      const mapNamed = (rows: any[]) => (rows || []).map((r: any) => ({
        key: r.key || '', label: r.label || '', coeff: typeof r.coeff === 'number' ? r.coeff : 1,
      }))
      config = {
        enabled: proDynamic.enabled ?? true,
        mode: proDynamic.mode || 'suggestion',
        base_prices: remapPrices(proDynamic.base_prices),
        min_prices: remapPrices(proDynamic.min_prices),
        max_prices: remapPrices(proDynamic.max_prices),
        occupation_coefficients: proDynamic.occupation_coefficients?.length
          ? mapCoeffs(proDynamic.occupation_coefficients, 'min_pct', 'max_pct') : config.occupation_coefficients,
        advance_coefficients: proDynamic.advance_coefficients?.length
          ? mapCoeffs(proDynamic.advance_coefficients, 'min_days', 'max_days') : config.advance_coefficients,
        duration_coefficients: proDynamic.duration_coefficients?.length
          ? mapCoeffs(proDynamic.duration_coefficients, 'min_days', 'max_days') : config.duration_coefficients,
        calendar_gap_coefficients: proDynamic.calendar_gap_coefficients?.length
          ? mapCoeffs(proDynamic.calendar_gap_coefficients, 'min_days', 'max_days') : [],
        season_rules: buildSeasonRulesFromProConfig(proDynamic),
        day_type_coefficients: mapNamed(proDynamic.day_type_coefficients),
        vehicle_occupation_coefficients: mapNamed(proDynamic.vehicle_occupation_coefficients),
        promo_push_coefficients: mapNamed(proDynamic.promo_push_coefficients),
        special_dates: (proDynamic.special_dates && typeof proDynamic.special_dates === 'object') ? proDynamic.special_dates : {},
        active_promo_level: proDynamic.active_promo_level || '',
      }
    } else {
      // Fallback: try old revenue_config table
      const { data: configRow, error: configError } = await supabase
        .from('revenue_config')
        .select('*')
        .limit(1)
        .single()
      if (!configError && configRow) {
        config = parseConfigFromDB(configRow)
      }
    }

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
      .select('id, display_name, daily_rate, category, status, plate')
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

    // 3b. Per-vehicle own occupancy (last 30 + next 30 days window)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: thisVehicleBookings } = await supabase
      .from('bookings')
      .select('pickup_date, dropoff_date')
      .eq('vehicle_id', vehicle.id)
      .not('status', 'in', '(cancelled,annullata)')
      .gte('pickup_date', thirtyDaysAgo)
      .lte('dropoff_date', thirtyDaysAhead)
    let vehicleOwnOccupiedDays = 0
    for (const b of (thisVehicleBookings || [])) {
      const p = new Date(b.pickup_date).getTime()
      const d = new Date(b.dropoff_date).getTime()
      vehicleOwnOccupiedDays += Math.max(1, Math.ceil((d - p) / (1000 * 60 * 60 * 24)))
    }
    const vehicleOwnOccupancyPct = Math.min(100, Math.round((vehicleOwnOccupiedDays / 60) * 100))

    // 3c. Calendar gap: finestra "stretta" tra prenotazione precedente e
    // successiva sullo stesso veicolo. Il coefficiente serve a incentivare il
    // riempimento dei buchi — quindi richiediamo una prenotazione SUCCESSIVA
    // entro 30 giorni. Se il calendario è aperto dopo il dropoff (es. Macan
    // libero fino a fine mese), niente gap, niente sconto.
    const pickupMs = new Date(pickup_date).getTime()
    const dropoffMs = new Date(dropoff_date).getTime()
    const horizon30Iso = new Date(dropoffMs + 30 * 24 * 60 * 60 * 1000).toISOString()

    const vehicleMatch = vehicle.plate
      ? `vehicle_id.eq.${vehicle.id},vehicle_plate.eq.${vehicle.plate}`
      : `vehicle_id.eq.${vehicle.id}`

    const [{ data: priorBookings }, { data: nextBookings }] = await Promise.all([
      supabase
        .from('bookings')
        .select('dropoff_date')
        .or(vehicleMatch)
        .not('status', 'in', '(cancelled,annullata)')
        .lt('dropoff_date', pickup_date)
        .order('dropoff_date', { ascending: false })
        .limit(1),
      supabase
        .from('bookings')
        .select('pickup_date')
        .or(vehicleMatch)
        .not('status', 'in', '(cancelled,annullata)')
        .gte('pickup_date', dropoff_date)
        .lte('pickup_date', horizon30Iso)
        .order('pickup_date', { ascending: true })
        .limit(1),
    ])

    let calendarGapDays: number | undefined
    const hasNext = !!(nextBookings && nextBookings.length > 0)
    const hasPrior = !!(priorBookings && priorBookings.length > 0)
    if (hasNext) {
      const nextPickMs = new Date(nextBookings![0].pickup_date).getTime()
      let windowMs: number
      if (hasPrior) {
        const prevDropMs = new Date(priorBookings![0].dropoff_date).getTime()
        windowMs = nextPickMs - prevDropMs
      } else {
        windowMs = nextPickMs - dropoffMs
      }
      // "Gap giorni" = giorni interi LIBERI tra le due prenotazioni.
      // prior.drop 22/04, next.pick 24/04 → finestra 48h → 1 giorno libero (23/04).
      // I giorni di dropoff precedente e pickup successivo non contano come "liberi".
      const windowDays = Math.round(windowMs / (1000 * 60 * 60 * 24))
      const freeDays = Math.max(0, windowDays - 1)
      if (freeDays > 0) calendarGapDays = freeDays
    }
    // else: niente booking successivo entro 30gg → calendario aperto → no gap

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

    // Rental days (reuse pickupMs/dropoffMs computed above)
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

    // Calendar gap
    let gapCoeff = 1.0
    let gapLabel = 'Nessun dato gap'
    if ((config.calendar_gap_coefficients || []).length && typeof calendarGapDays === 'number') {
      const gapBracket = matchBracket(config.calendar_gap_coefficients, calendarGapDays, 'days')
      if (gapBracket) { gapCoeff = gapBracket.coeff; gapLabel = gapBracket.label }
    }

    // Day type — admin logic: iterate each rental day, map weekday -> key (monday, tuesday...),
    // also check special_dates[YYYY-MM-DD] overrides. Average the per-day coefficients.
    // Matches src/utils/revenuePricingEngine.ts::calculateDayTypeMeanCoeff in admin.
    let dayTypeCoeff = 1.0
    let dayTypeLabel = 'Giorno standard'
    const dayTypeCoeffs = config.day_type_coefficients || []
    if (dayTypeCoeffs.length) {
      const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
      const byKey = new Map<string, { key: string; label: string; coeff: number }>()
      for (const d of dayTypeCoeffs) byKey.set(d.key, d)
      const pickupYmdStart = pickup_date.slice(0, 10)
      const [py, pm, pd] = pickupYmdStart.split('-').map(Number)
      const startUTC = new Date(Date.UTC(py, (pm || 1) - 1, pd || 1))
      const days = Math.max(1, Math.floor(rentalDays))
      const perDay: Array<{ date: string; key: string; label: string; coeff: number }> = []
      let sum = 0
      for (let i = 0; i < days; i++) {
        const d = new Date(startUTC.getTime() + i * 86_400_000)
        const y = d.getUTCFullYear()
        const m = String(d.getUTCMonth() + 1).padStart(2, '0')
        const day = String(d.getUTCDate()).padStart(2, '0')
        const ymd = `${y}-${m}-${day}`
        const specialKey = config.special_dates?.[ymd]
        const key = specialKey || WEEKDAY_KEYS[d.getUTCDay()]
        const match = byKey.get(key)
        const coeff = match ? match.coeff : 1.0
        const label = match ? match.label : 'Giorno standard'
        perDay.push({ date: ymd, key, label, coeff })
        sum += coeff
      }
      dayTypeCoeff = perDay.length > 0 ? sum / perDay.length : 1.0
      if (perDay.length === 1) {
        dayTypeLabel = `${perDay[0].label} (${perDay[0].date})`
      } else {
        // Summarize: count occurrences of each label, format "Label1×n + Label2"
        const counts: Record<string, number> = {}
        for (const p of perDay) counts[p.label] = (counts[p.label] ?? 0) + 1
        const summary = Object.entries(counts).map(([l, n]) => (n > 1 ? `${l}×${n}` : l)).join(' + ')
        dayTypeLabel = `Media ${perDay.length} giorni (${summary})`
      }
    }

    // Vehicle own occupation bucket — admin logic (revenuePricingEngine.ts:482-497)
    // Pro config keys can be 'basso/medio/alto' OR 'sotto/allineato/richiesto'.
    // If no key match, fall back to math-based indexing: Math.floor(pct / (100 / length))
    let vehOccCoeff = 1.0
    let vehOccLabel = 'Nessun dato singolo veicolo'
    const vehOccArr = config.vehicle_occupation_coefficients || []
    if (vehOccArr.length) {
      const pct = vehicleOwnOccupancyPct
      let bucketKey = 'medio'
      if (pct < 33) bucketKey = 'basso'
      else if (pct < 66) bucketKey = 'medio'
      else bucketKey = 'alto'
      const vehOccMatch = vehOccArr.find(v => v.key === bucketKey)
        ?? vehOccArr[Math.min(
          Math.floor(pct / (100 / Math.max(1, vehOccArr.length))),
          vehOccArr.length - 1
        )]
      if (vehOccMatch) { vehOccCoeff = vehOccMatch.coeff; vehOccLabel = `${vehOccMatch.label} (${pct}%)` }
    }

    // Promo push (active level)
    let promoCoeff = 1.0
    let promoLabel = 'Nessuna promo attiva'
    if (config.active_promo_level) {
      const promoMatch = (config.promo_push_coefficients || []).find(p => p.key === config.active_promo_level)
      if (promoMatch) { promoCoeff = promoMatch.coeff; promoLabel = promoMatch.label }
    }

    // Formula
    let rawDailyRate = selectedBaseRateEur * occCoeff * advCoeff * durCoeff * seasonCoeff * gapCoeff * dayTypeCoeff * vehOccCoeff * promoCoeff

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

    // Build breakdown array for frontend coefficient display
    const breakdown: { label: string; coeff: number; description: string }[] = []
    breakdown.push({ label: 'Coefficienti Occupazione', coeff: occCoeff, description: occBracket?.label || `${occupancyPct}% occupata` })
    breakdown.push({ label: 'Coefficienti Anticipo', coeff: advCoeff, description: advBracket?.label || `${daysAhead} giorni prima` })
    breakdown.push({ label: 'Coefficienti Durata', coeff: durCoeff, description: durBracket?.label || `${rentalDays} giorni` })
    breakdown.push({ label: 'Coefficienti Gap Calendario', coeff: gapCoeff, description: gapLabel })
    breakdown.push({ label: 'Coefficienti Stagione', coeff: seasonCoeff, description: seasonMatch?.name || 'Nessuna regola stagionale' })
    breakdown.push({ label: 'Coefficienti Tipo Giorno', coeff: dayTypeCoeff, description: dayTypeLabel })
    breakdown.push({ label: 'Coefficienti Occupazione Veicolo', coeff: vehOccCoeff, description: vehOccLabel })
    breakdown.push({ label: 'Coefficienti Spinta Direzionale (Promo)', coeff: promoCoeff, description: promoLabel })

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
        breakdown,
        // Expose min/max so the wizard can apply the same clamp UI rules
        // as the admin side (Prezzi Base + Limiti from Centralina Pro).
        minPrice: minPrice ?? null,
        maxPrice: maxPrice ?? null,
        minHit: minPrice != null && finalDailyRate <= minPrice,
        maxHit: maxPrice != null && finalDailyRate >= maxPrice,
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
