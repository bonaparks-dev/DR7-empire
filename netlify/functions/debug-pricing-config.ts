/**
 * debug-pricing-config — utility diagnostic per allineare le chiavi
 * tra centralina_pro_config.config.prezzoDinamico (admin) e
 * vehicles.category (DB), in modo da capire perche\' pickPrice non
 * trova un min_price che l'admin pensa di aver configurato.
 *
 * GET /debug-pricing-config?vehicleName=Mercedes%20Classe%20A%2045S%20AMG
 *
 * Restituisce, IN CHIARO:
 *   - vehicle row trovata (id, display_name, category)
 *   - chiavi di config.prezzoDinamico.dynamic.base_prices
 *   - chiavi di config.prezzoDinamico.dynamic.min_prices
 *   - chiavi di config.prezzoDinamico.dynamic.max_prices
 *   - categories[] (cosi\' vediamo se vehicle.category corrisponde a
 *     un categoria valido)
 *
 * Niente prezzi, solo nomi delle chiavi.
 */
import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { getCorsOrigin } from './utils/cors'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': getCorsOrigin(event.headers['origin']),
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
    if (!supabaseUrl || !supabaseKey) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Supabase env missing' }) }
    }
    const sb = createClient(supabaseUrl, supabaseKey)
    const vehicleName = event.queryStringParameters?.vehicleName || null
    const vehicleId = event.queryStringParameters?.vehicleId || null

    let vehicle: { id?: string; display_name?: string; category?: string | null } | null = null
    if (vehicleId) {
        const { data } = await sb.from('vehicles').select('id, display_name, category').eq('id', vehicleId).maybeSingle()
        vehicle = data
    } else if (vehicleName) {
        const { data } = await sb.from('vehicles').select('id, display_name, category').ilike('display_name', vehicleName).limit(1).maybeSingle()
        vehicle = data
    }

    const { data: proRow } = await sb
        .from('centralina_pro_config')
        .select('config')
        .eq('id', 'main')
        .maybeSingle()
    const proDynamic = (proRow?.config as { prezzoDinamico?: { dynamic?: Record<string, unknown> } } | null)?.prezzoDinamico?.dynamic || null
    const categoriesArr = (proRow?.config as { categories?: Array<{ id: string; label: string }> } | null)?.categories || []

    const safeKeys = (obj: unknown): string[] => {
        if (!obj || typeof obj !== 'object') return []
        return Object.keys(obj as Record<string, unknown>)
    }

    const pd = proDynamic as Record<string, unknown> | null

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            vehicle,
            vehicleCategory: vehicle?.category || null,
            categoriesConfigured: categoriesArr.map(c => ({ id: c.id, label: c.label })),
            base_prices_keys: safeKeys((pd as { base_prices?: unknown } | null)?.base_prices),
            min_prices_keys: safeKeys((pd as { min_prices?: unknown } | null)?.min_prices),
            max_prices_keys: safeKeys((pd as { max_prices?: unknown } | null)?.max_prices),
            // Bracket completi: con questi vediamo PERCHE\' un certo
            // valore di coeff viene matchato per Massimo. Es. se
            // advance_coefficients ha un bracket "medio anticipo"
            // che copre 0-30 giorni con coeff 0.80, ecco perche\' 10gg
            // di anticipo prende 0.80 invece di 1.00.
            occupation_coefficients: pd?.occupation_coefficients ?? null,
            advance_coefficients: pd?.advance_coefficients ?? null,
            duration_coefficients: pd?.duration_coefficients ?? null,
            calendar_gap_coefficients: pd?.calendar_gap_coefficients ?? null,
            season_coefficients: pd?.season_coefficients ?? null,
            season_by_month: pd?.season_by_month ?? null,
            day_type_coefficients: pd?.day_type_coefficients ?? null,
            vehicle_occupation_coefficients: pd?.vehicle_occupation_coefficients ?? null,
            promo_push_coefficients: pd?.promo_push_coefficients ?? null,
            active_promo_level: pd?.active_promo_level ?? null,
            mode: pd?.mode ?? null,
            enabled: pd?.enabled ?? null,
            // Min/max price specifico per il veicolo (valore, non solo chiave)
            min_price_for_vehicle: vehicle?.id
                ? ((pd as { min_prices?: Record<string, unknown> } | null)?.min_prices?.[vehicle.id] ?? null)
                : null,
            max_price_for_vehicle: vehicle?.id
                ? ((pd as { max_prices?: Record<string, unknown> } | null)?.max_prices?.[vehicle.id] ?? null)
                : null,
            base_price_for_vehicle: vehicle?.id
                ? ((pd as { base_prices?: Record<string, unknown> } | null)?.base_prices?.[vehicle.id] ?? null)
                : null,
            simulatedLookup: vehicle ? simulateLookup(vehicle, pd) : null,
        }, null, 2),
    }
}

function simulateLookup(
    vehicle: { id?: string; category?: string | null },
    proDynamic: Record<string, unknown> | null,
): { matched_by: string | null; matched_key: string | null; alternatives_present: string[] } {
    if (!proDynamic) return { matched_by: null, matched_key: null, alternatives_present: [] }
    const minPrices = (proDynamic as { min_prices?: Record<string, unknown> }).min_prices || {}
    const cat = String(vehicle.category || '').toLowerCase().trim()
    const baseAliases = cat === 'supercars' || cat === 'supercar'
        ? ['supercars', 'supercar', 'exotic']
        : cat === 'exotic'
            ? ['exotic', 'supercars', 'supercar']
            : cat ? [cat] : []
    const aliasSet = new Set(baseAliases.map(a => a.toLowerCase()))
    if (vehicle.id && minPrices[vehicle.id] != null) {
        return { matched_by: 'vehicle_id', matched_key: vehicle.id, alternatives_present: Object.keys(minPrices) }
    }
    const alts: string[] = []
    for (const k of Object.keys(minPrices)) {
        const kLow = k.toLowerCase().trim()
        const stripped = kLow.startsWith('category:') ? kLow.slice(9)
                       : kLow.startsWith('cat:') ? kLow.slice(4)
                       : kLow
        if (aliasSet.has(stripped)) {
            return { matched_by: 'alias', matched_key: k, alternatives_present: alts.concat(Object.keys(minPrices)) }
        }
        alts.push(k)
    }
    return { matched_by: null, matched_key: null, alternatives_present: alts }
}
