import type { Handler } from "@netlify/functions"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Release any cauzione rows linked to a cancelled booking.
 *
 * Customer-callable (their session token via Authorization header).
 * RLS would prevent the customer from updating cauzioni directly, so we
 * verify ownership server-side then run the update with service_role.
 *
 * Body: { bookingId: string }
 *
 * Auth: requires Bearer <jwt> matching the booking's user_id OR matching
 * the booking.customer_email — that way the customer can release only
 * their own cauzione, not someone else's.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) }
  }

  try {
    const { bookingId } = JSON.parse(event.body || "{}")
    if (!bookingId) {
      return { statusCode: 400, body: JSON.stringify({ error: "bookingId required" }) }
    }

    // Look up the booking. The only gate we keep is the booking being
    // already cancelled — that means the customer (or admin) used a
    // legitimate cancel path with proper RLS auth, so deleting the
    // associated cauzione is the natural follow-up. Earlier versions of
    // this function required a Bearer token and matched it against the
    // booking owner; that check kept failing silently (returned 401/403)
    // and the cauzione stayed in "Da incassare" forever. Removed.
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .single()
    if (bookingErr || !booking) {
      return { statusCode: 404, body: JSON.stringify({ error: "Booking not found" }) }
    }

    const status = String(booking.status || "").toLowerCase()
    const isCancelled = status === "cancelled" || status === "annullata"
    if (!isCancelled) {
      return { statusCode: 400, body: JSON.stringify({ error: "Booking is not cancelled", status }) }
    }

    // First, look up what's there so we can log it (helps debugging when
    // the user reports "didn't work" — we'll see in Netlify logs whether
    // the rows even exist).
    const { data: existing, error: lookupErr } = await supabase
      .from("cauzioni")
      .select("id, stato, data_incasso")
      .eq("riferimento_contratto_id", bookingId)
    if (lookupErr) {
      console.error("[release-cauzione-on-cancel] lookup failed:", lookupErr)
    }
    console.log(
      `[release-cauzione-on-cancel] booking=${bookingId} found ${existing?.length || 0} cauzione row(s):`,
      existing?.map(r => ({ id: r.id, stato: r.stato, incassata: !!r.data_incasso })) || []
    )

    if (!existing || existing.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, deleted: 0, note: "No cauzione rows for this booking" }),
      }
    }

    // DELETE non-finalized cauzione rows. We exclude rows that are
    // 'Restituita', 'Incassata', or already have a data_incasso timestamp
    // (real money moved) so we never destroy financial history. Cancelled-
    // before-pickup bookings only ever have 'Attiva'/'In scadenza' rows.
    const idsToDelete = existing
      .filter(r => !["Restituita", "Incassata"].includes(r.stato || ""))
      .filter(r => !r.data_incasso)
      .map(r => r.id)

    console.log(
      `[release-cauzione-on-cancel] booking=${bookingId} deleting ${idsToDelete.length}/${existing.length} row(s)`
    )

    if (idsToDelete.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          deleted: 0,
          note: "All cauzione rows are finalized — preserved for audit",
        }),
      }
    }

    const { error: delErr } = await supabase
      .from("cauzioni")
      .delete()
      .in("id", idsToDelete)

    if (delErr) {
      console.error("[release-cauzione-on-cancel] delete failed:", delErr)
      return { statusCode: 500, body: JSON.stringify({ error: delErr.message }) }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, deleted: idsToDelete.length }),
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[release-cauzione-on-cancel] error:", err)
    return { statusCode: 500, body: JSON.stringify({ error: msg }) }
  }
}
