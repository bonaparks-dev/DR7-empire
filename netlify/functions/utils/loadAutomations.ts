/**
 * Server-side automations loader.
 *
 * Reads `centralina_pro_config.config.automations` from Supabase and
 * returns the rental buffer (post-noleggio) in minutes. Self-contained:
 * uses raw fetch to Supabase REST so it works in Netlify functions that
 * don't import @supabase/supabase-js. Cached at module level for 60s.
 *
 * Both website and admin read from the same row; admin manages it via
 * Centralina Pro > Automazioni.
 */

const TTL_MS = 60_000 // 1 minute
const DEFAULT_BUFFER = 75 // unified default with admin's INITIAL_AUTOMATIONS

interface Cache {
    bufferMinutes: number
    expires: number
}

let cache: Cache | null = null

/** Returns the configured rental buffer in minutes. Cached for 60s. */
export async function getRentalBufferMinutes(): Promise<number> {
    const now = Date.now()
    if (cache && cache.expires > now) return cache.bufferMinutes

    let value = DEFAULT_BUFFER
    const url = process.env.VITE_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && key) {
        try {
            const resp = await fetch(
                `${url}/rest/v1/centralina_pro_config?select=config&id=eq.main`,
                { headers: { apikey: key, Authorization: `Bearer ${key}` } }
            )
            if (resp.ok) {
                const rows = (await resp.json()) as Array<{ config?: Record<string, unknown> }>
                const cfg = rows?.[0]?.config ?? null
                const automations = (cfg as Record<string, unknown> | null)?.automations as Record<string, unknown> | undefined
                const v = automations?.rental_buffer_minutes
                if (typeof v === 'number' && v >= 0 && v <= 720) {
                    value = v
                }
            }
        } catch (err) {
            console.error('[loadAutomations] failed, using default:', err)
        }
    }

    cache = { bufferMinutes: value, expires: now + TTL_MS }
    return value
}

/** Same as above but returns milliseconds (convenience for `+ buffer` arithmetic). */
export async function getRentalBufferMs(): Promise<number> {
    return (await getRentalBufferMinutes()) * 60 * 1000
}
