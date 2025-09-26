// netlify/functions/generate-lottery-tickets.js

// Node: CommonJS is fine on Netlify functions
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');
const { createHash } = require('crypto');

const resend = new Resend(process.env.RESEND_API_KEY);

// ---- Optional: Supabase persistence (uncomment if you want DB storage) ----
// const { createClient } = require('@supabase/supabase-js');
// const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
//   ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
//   : null;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const createResponse = (statusCode, body) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});

// ---- Deterministic PRNG (mulberry32) for idempotent ticket generation ----
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a specified number of unique random integers within [min, max],
 * deterministically using a seed string.
 */
function generateDeterministicUniqueNumbers(count, min, max, seedString) {
  if (count > (max - min + 1)) {
    throw new Error('Count exceeds the size of the range.');
  }
  // seed from first 8 hex chars of SHA-256
  const hex = createHash('sha256').update(seedString).digest('hex').slice(0, 8);
  const seed = parseInt(hex, 16) >>> 0;
  const rand = mulberry32(seed);

  const numbers = new Set();
  while (numbers.size < count) {
    const n = Math.floor(rand() * (max - min + 1)) + min;
    numbers.add(n);
  }
  return Array.from(numbers);
}

// Deterministic "uuid-like" id from hash (so retries reproduce same IDs)
function hashId(...parts) {
  const h = createHash('sha1').update(parts.join(':')).digest('hex');
  // format as 8-4-4-4-12
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

const generateEmailHtml = (fullName, tickets) => {
  const ticketBlocks = tickets
    .map(
      (ticket) => `
    <div style="background-color:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;margin-bottom:15px;text-align:center;">
      <p style="margin:0 0 10px;font-size:16px;color:#ccc;">Lottery Number:</p>
      <p style="margin:0 0 15px;font-size:32px;font-weight:bold;color:#fff;letter-spacing:2px;">${ticket.number
        .toString()
        .padStart(6, '0')}</p>
      <div style="border-top:1px dashed #555;margin:15px 0;"></div>
      <p style="margin:0 0 5px;font-size:12px;color:#ccc;text-transform:uppercase;">Ticket Holder</p>
      <p style="margin:0 0 15px;font-size:18px;font-weight:bold;color:#fff;">${fullName}</p>
      <div style="margin-top:15px;position:relative;display:inline-block;width:128px;height:128px;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
          ticket.id
        )}&ecc=H&color=FFD700&bgcolor=000000" alt="Ticket QR Code" style="width:120px;height:120px;display:block;border:4px solid #FFD700;border-radius:4px;">
        <img src="https://firebasestorage.googleapis.com/v0/b/dr7-empire.appspot.com/o/DR7logo.png?alt=media" alt="DR7 Logo" style="position:absolute;top:50%;left:50%;width:36px;height:36px;margin-top:-18px;margin-left:-18px;background:#000000;padding:2px;border-radius:4px;">
      </div>
      <p style="margin:10px 0 0;font-size:10px;color:#777;font-family:monospace;line-height:1.4;">
        ID: ${ticket.id}
      </p>
    </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your DR7 Lottery Tickets</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;700&display=swap');
body { margin:0; padding:0; background-color:#000000; font-family:'Exo 2', sans-serif; }
.container { max-width:600px; margin:0 auto; padding:20px; color:#ffffff; }
.header { text-align:center; padding-bottom:20px; border-bottom:1px solid #333; }
.content { padding:30px 0; }
.footer { text-align:center; font-size:12px; color:#777; padding-top:20px; border-top:1px solid #333; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://firebasestorage.googleapis.com/v0/b/dr7-empire.appspot.com/o/DR7logo.png?alt=media" alt="DR7 Empire Logo" style="height:50px;width:auto;margin-bottom:10px;">
    </div>
    <div class="content">
      <h1 style="font-size:28px;color:#fff;text-align:center;">Your Lottery Tickets Are Here!</h1>
      <p style="font-size:16px;color:#ccc;line-height:1.6;text-align:center;">Hello ${fullName},</p>
      <p style="font-size:16px;color:#ccc;line-height:1.6;text-align:center;">Thank you for participating in the DR7 Grand Giveaway. Below are your official ticket details. Please keep this email safe.</p>
      <div style="margin-top:30px;">
        ${ticketBlocks}
      </div>
      <p style="font-size:16px;color:#ccc;line-height:1.6;text-align:center;margin-top:30px;">Good luck! The draw will be held on Christmas Day.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} DR7 Empire. All Rights Reserved.
    </div>
  </div>
</body>
</html>`;
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.RESEND_API_KEY) {
    console.error('Missing STRIPE_SECRET_KEY or RESEND_API_KEY.');
    return createResponse(500, { success: false, error: 'Server configuration error.' });
  }

  try {
    const { email, fullName, quantity, paymentIntentId } = JSON.parse(event.body || '{}');

    if (!email || !quantity || !paymentIntentId) {
      return createResponse(400, { success: false, error: 'Missing required fields: email, quantity, paymentIntentId.' });
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 1000) {
      return createResponse(400, { success: false, error: 'Invalid quantity.' });
    }

    // 1) Verify the PaymentIntent is paid
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!pi || pi.id !== paymentIntentId) {
      return createResponse(400, { success: false, error: 'Payment Intent not found.' });
    }
    if (pi.status !== 'succeeded' || (pi.amount_received || 0) <= 0) {
      return createResponse(400, { success: false, error: 'Payment not completed.' });
    }

    // Optional check: ensure email matches (either metadata.email or receipt_email)
    const metaEmail = (pi.metadata && pi.metadata.email) ? String(pi.metadata.email).toLowerCase() : null;
    const receiptEmail = pi.receipt_email ? String(pi.receipt_email).toLowerCase() : null;
    const incomingEmail = String(email).toLowerCase();

    if (metaEmail && metaEmail !== incomingEmail && receiptEmail && receiptEmail !== incomingEmail) {
      // If both exist and neither matches, block. If only one exists, compare to that.
      return createResponse(400, { success: false, error: 'Email does not match the payment record.' });
    }

    // 2) Idempotency: deterministically generate the same tickets for the same PI + email
    const RANGE_MIN = 1;
    const RANGE_MAX = 350000; // adjust to your campaign range
    const seed = `${paymentIntentId}:${incomingEmail}:${qty}`;

    const numbers = generateDeterministicUniqueNumbers(qty, RANGE_MIN, RANGE_MAX, seed);
    const tickets = numbers.map((number, idx) => ({
      number,
      id: hashId(paymentIntentId, incomingEmail, String(number), String(idx)),
    }));

    // 3) (Optional but recommended) persist once using DB with unique constraint on payment_intent_id
    // if (supabase) {
    //   const { data, error } = await supabase
    //     .from('lottery_tickets')
    //     .upsert({
    //       payment_intent_id: pi.id,
    //       email: incomingEmail,
    //       full_name: fullName || null,
    //       tickets, // JSONB column
    //     }, { onConflict: 'payment_intent_id' })
    //     .select();
    //   if (error) {
    //     console.error('Supabase upsert error:', error);
    //     // Not fatal, continue to email
    //   }
    // }

    // 4) Send Email (Resend) — ensure your domain is verified and FROM is allowed
    const fromAddress = process.env.RESEND_FROM || 'DR7 Empire <noreply@dr7empire.com>';
    const emailHtml = generateEmailHtml(fullName || 'Valued Customer', tickets);

    await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: 'Your DR7 Lottery Tickets',
      html: emailHtml,
    });

    // 5) (Optional) Tag the PI that tickets were issued (visible in Stripe)
    const alreadyFlagged = pi.metadata && pi.metadata.tickets_issued === 'true';
    if (!alreadyFlagged) {
      try {
        await stripe.paymentIntents.update(paymentIntentId, {
          metadata: {
            ...(pi.metadata || {}),
            tickets_issued: 'true',
            tickets_qty: String(qty),
          },
        });
      } catch (metaErr) {
        // Not fatal
        console.warn('Could not update PI metadata:', metaErr.message || metaErr);
      }
    }

    return createResponse(200, { success: true, tickets });
  } catch (err) {
    console.error('Error generating lottery tickets:', err);
    return createResponse(500, { success: false, error: err.message || 'Internal server error.' });
  }
};
