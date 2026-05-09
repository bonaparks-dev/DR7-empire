/**
 * GET /api/get-supercar-experience-fleet
 *   ?tier=supercar|hypercar
 *   &start=ISO timestamp
 *   &end=ISO timestamp
 *
 * Returns the list of vehicles in the requested tier with per-vehicle
 * availability for the [start, end] window. Drives the website's
 * Supercar / Icon Experience picker on CarWashBookingPage.
 *
 * Tier mapping:
 *   - supercar  → category ILIKE %supercar% OR equals exotic (any case)
 *   - hypercar  → category ILIKE %hyper%   OR equals icon/icons (any case)
 *
 * Availability:
 *   A vehicle is BUSY if any non-cancelled bookings row references it
 *   (vehicle_id OR vehicle_plate match) and overlaps the requested
 *   window. We exclude cancelled/annullata/completed/expired statuses.
 */
import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { getCorsOrigin } from './utils/cors'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

interface VehicleRow {
    id: string
    display_name: string
    plate: string | null
    daily_rate: number | null
    category: string | null
    status: string | null
    metadata: Record<string, unknown> | null
}

interface BookingRow {
    id: string
    vehicle_id: string | null
    vehicle_plate: string | null
    pickup_date: string | null
    dropoff_date: string | null
    status: string | null
    customer_name: string | null
}

const EXCLUDED_STATUSES = new Set(['cancelled', 'annullata', 'completed', 'completata', 'expired'])

function isExperienceTier(value: unknown): value is 'supercar' | 'hypercar' {
    return value === 'supercar' || value === 'hypercar'
}

export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': getCorsOrigin(event.headers['origin']),
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json',
    }
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
    if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Supabase config missing' }) }
    }

    const params = event.queryStringParameters || {}
    const tier = params.tier
    const startIso = params.start
    const endIso = params.end

    if (!isExperienceTier(tier)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'tier must be "supercar" or "hypercar"' }) }
    }
    if (!startIso || !endIso) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'start and end (ISO) are required' }) }
    }

    const start = new Date(startIso)
    const end = new Date(endIso)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'start/end must be valid ISO timestamps with end > start' }) }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1) Fetch fleet for the requested tier.
    const filter = tier === 'hypercar'
        ? 'category.ilike.%hyper%,category.eq.icon,category.eq.Icon,category.eq.ICON,category.eq.icons,category.eq.Icons'
        : 'category.ilike.%supercar%,category.eq.exotic,category.eq.Exotic,category.eq.EXOTIC'

    const { data: fleetData, error: fleetErr } = await supabase
        .from('vehicles')
        .select('id, display_name, plate, daily_rate, category, status, metadata')
        .or(filter)
        .neq('status', 'retired')
        .order('display_name', { ascending: true })

    if (fleetErr) {
        console.error('[get-supercar-experience-fleet] fleet query failed:', fleetErr)
        return { statusCode: 500, headers, body: JSON.stringify({ error: fleetErr.message }) }
    }

    const fleet: VehicleRow[] = (fleetData || []) as VehicleRow[]

    if (fleet.length === 0) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ tier, fleet: [], total: 0, available: 0 }),
        }
    }

    // 2) Pull bookings overlapping the window (1-day pad on either side
    //    to catch adjacent same-day bookings safely).
    const windowStart = new Date(start.getTime() - 24 * 60 * 60 * 1000)
    const windowEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000)

    const { data: bookingsData, error: bookingsErr } = await supabase
        .from('bookings')
        .select('id, vehicle_id, vehicle_plate, pickup_date, dropoff_date, status, customer_name')
        .lt('pickup_date', windowEnd.toISOString())
        .gt('dropoff_date', windowStart.toISOString())

    if (bookingsErr) {
        console.error('[get-supercar-experience-fleet] bookings query failed:', bookingsErr)
        return { statusCode: 500, headers, body: JSON.stringify({ error: bookingsErr.message }) }
    }

    const bookings: BookingRow[] = (bookingsData || []) as BookingRow[]

    // 3) Per-vehicle availability check. A vehicle is busy if any
    //    non-excluded booking with the same id or plate has dates that
    //    overlap [start, end].
    const overlaps = (b: BookingRow): boolean => {
        if (!b.pickup_date || !b.dropoff_date) return false
        const bStart = new Date(b.pickup_date).getTime()
        const bEnd = new Date(b.dropoff_date).getTime()
        if (isNaN(bStart) || isNaN(bEnd)) return false
        return bStart < end.getTime() && bEnd > start.getTime()
    }

    const result = fleet.map((v) => {
        const conflict = bookings.find((b) => {
            const status = (b.status || '').toLowerCase()
            if (EXCLUDED_STATUSES.has(status)) return false
            const idMatch = b.vehicle_id && v.id && b.vehicle_id === v.id
            const plateMatch = b.vehicle_plate && v.plate && b.vehicle_plate === v.plate
            if (!idMatch && !plateMatch) return false
            return overlaps(b)
        })
        return {
            id: v.id,
            display_name: v.display_name,
            plate: v.plate,
            category: v.category,
            daily_rate: v.daily_rate,
            available: !conflict,
            reason: conflict
                ? `Occupata da ${conflict.customer_name || 'altra prenotazione'} (${conflict.pickup_date?.slice(0, 16) || '?'} → ${conflict.dropoff_date?.slice(0, 16) || '?'})`
                : null,
        }
    })

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            tier,
            fleet: result,
            total: result.length,
            available: result.filter((r) => r.available).length,
        }),
    }
}
