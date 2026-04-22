/**
 * regenerate-contract-after-modify
 *
 * Customer-triggered endpoint. After a rental is modified via MyBookings,
 * the stored contract PDF (and therefore the signing link the customer
 * already received) is stale — dates/locations/price no longer match.
 *
 * This endpoint proxies to the admin's `generate-contract` + `signature-init`
 * functions the same way nexi-callback.js does for new bookings:
 *   1. POST {bookingId} to admin/generate-contract → upserts contracts row,
 *      writes signed_pdf_url → updated PDF is now the canonical copy.
 *   2. Fetch the contracts row id.
 *   3. POST {contractId, bookingId} to admin/signature-init → creates a new
 *      signature_requests row + sends email/WhatsApp with the signing link.
 *
 * Authorization: the caller must own the booking (checked by matching
 * user_id on the booking row against the supplied supabase session user).
 */

import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { getCorsOrigin } from './utils/cors'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ADMIN_URL = process.env.ADMIN_URL || 'https://admin.dr7empire.com'

export const handler: Handler = async (event) => {
  const origin = getCorsOrigin(event.headers.origin || event.headers.Origin)
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }

  try {
    const { bookingId } = JSON.parse(event.body || '{}')
    if (!bookingId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'bookingId required' }) }

    const auth = event.headers.authorization || event.headers.Authorization || ''
    const jwt = auth.replace(/^Bearer\s+/i, '')
    if (!jwt) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }

    // Verify the caller owns this booking
    const sbUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: userData } = await sbUser.auth.getUser(jwt)
    const userId = userData?.user?.id
    if (!userId) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) }

    const { data: booking, error: bookingErr } = await sbUser
      .from('bookings')
      .select('id, user_id, service_type')
      .eq('id', bookingId)
      .single()
    if (bookingErr || !booking) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Booking not found' }) }
    if (booking.user_id !== userId) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) }

    // Only rentals have contracts
    const svc = String(booking.service_type || '')
    if (svc !== 'car_rental') {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, skipped: true, reason: 'non_rental' }) }
    }

    // 1. Regenerate the contract PDF (admin upserts contracts row)
    const genRes = await fetch(`${ADMIN_URL}/.netlify/functions/generate-contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })
    const genData: { success?: boolean; url?: string; error?: string } = await genRes.json().catch(() => ({}))
    if (!genRes.ok || !genData.success) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Contract regeneration failed', details: genData.error }) }
    }

    // 2. Find the (updated) contracts row id
    const { data: contractRow } = await sbUser
      .from('contracts')
      .select('id')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!contractRow?.id) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, contractRegenerated: true, signingSent: false, reason: 'no_contract_row' }) }
    }

    // 3. Trigger a fresh signature request → email/WhatsApp to customer
    const sigRes = await fetch(`${ADMIN_URL}/.netlify/functions/signature-init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId: contractRow.id, bookingId }),
    })
    const signingSent = sigRes.ok

    // 4. Clear the regeneration flag (best-effort)
    try {
      const { data: b2 } = await sbUser.from('bookings').select('booking_details').eq('id', bookingId).single()
      const bd = (b2?.booking_details || {}) as Record<string, unknown>
      if (bd.needs_contract_regen) {
        delete bd.needs_contract_regen
        bd.contract_regen_completed_at = new Date().toISOString()
        await sbUser.from('bookings').update({ booking_details: bd }).eq('id', bookingId)
      }
    } catch { /* non-fatal */ }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, contractRegenerated: true, signingSent, contractUrl: genData.url }) }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { statusCode: 500, headers, body: JSON.stringify({ error: msg }) }
  }
}
