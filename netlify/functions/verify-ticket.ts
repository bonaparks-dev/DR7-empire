import type { Handler, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// --- CONFIGURATION ---
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY! // Use the public anonymous key for client-side access
);
const LOTTERY_SECRET_KEY = process.env.LOTTERY_SECRET_KEY!;

// --- HELPER ---
/**
 * Re-creates the HMAC signature to verify authenticity.
 */
const verifyTicketSignature = (drawId: number, ticketNumber: number, providedSignature: string): boolean => {
  const hmac = crypto.createHmac("sha256", LOTTERY_SECRET_KEY);
  hmac.update(`${drawId}:${ticketNumber}`);
  const expectedSignature = hmac.digest("hex");

  // Use crypto.timingSafeEqual for security against timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature));
  } catch {
    return false;
  }
};

// --- MAIN HANDLER ---
export const handler: Handler = async (event: HandlerEvent) => {
  const { ticketNumber, drawId, signature } = event.queryStringParameters || {};

  // 1. Validate input parameters
  if (!ticketNumber || !drawId || !signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ status: "Error", message: "Missing required parameters." }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const parsedTicketNumber = parseInt(ticketNumber, 10);
  const parsedDrawId = parseInt(drawId, 10);

  if (isNaN(parsedTicketNumber) || isNaN(parsedDrawId)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ status: "Error", message: "Invalid parameter format." }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  // 2. Verify HMAC Signature
  const isSignatureValid = verifyTicketSignature(parsedDrawId, parsedTicketNumber, signature);
  if (!isSignatureValid) {
    return {
      statusCode: 403, // Forbidden
      body: JSON.stringify({ status: "Invalid", message: "Ticket signature is invalid." }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  // 3. Check ticket existence in the database
  try {
    const { data, error } = await supabase
      .from("lottery_tickets")
      .select("ticket_number, buyer_email, created_at, locale")
      .eq("draw_id", parsedDrawId)
      .eq("ticket_number", parsedTicketNumber)
      .single();

    if (error || !data) {
      return {
        statusCode: 404, // Not Found
        body: JSON.stringify({ status: "NotFound", message: "This ticket does not exist." }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // 4. Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "Valid",
        message: "This ticket is authentic and valid.",
        ticket: {
          ticketNumber: data.ticket_number,
          buyerEmail: data.buyer_email, // You might want to hide/remove this in production
          createdAt: data.created_at,
          locale: data.locale,
        }
      }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (dbError) {
    console.error("Database query failed:", dbError);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: "Error", message: "An internal server error occurred." }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};