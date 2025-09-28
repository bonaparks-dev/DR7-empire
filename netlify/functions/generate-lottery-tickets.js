// netlify/functions/generate-lottery-tickets.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const { createHash } = require('crypto');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

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

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateDeterministicUniqueNumbers(count, min, max, seedString) {
  if (count > (max - min + 1)) {
    throw new Error('Count exceeds the size of the range.');
  }
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

function hashId(...parts) {
  const h = createHash('sha1').update(parts.join(':')).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

// =================================================================================
// START: NEW PDF GENERATION FUNCTION
// =================================================================================
const generateTicketPdf = (fullName, tickets) => {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', (err) => {
      reject(err);
    });

    // Register a font
    doc.font('Helvetica-Bold');

    // Title
    doc.fontSize(24).text('DR7 Empire Lottery Ticket', { align: 'center' });
    doc.moveDown();

    for (const ticket of tickets) {
      // Generate QR code as a data URL
      const qrCodeDataUrl = await QRCode.toDataURL(ticket.id, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
      });

      // Draw ticket details
      doc.fontSize(16).text('Ticket Holder:', { continued: true });
      doc.font('Helvetica').fontSize(16).text(` ${fullName}`);

      doc.font('Helvetica-Bold').fontSize(16).text('Ticket Number:', { continued: true });
      doc.font('Helvetica').fontSize(20).text(` ${ticket.number.toString().padStart(6, '0')}`);

      doc.moveDown();

      // Embed QR code
      doc.image(qrCodeDataUrl, {
        fit: [150, 150],
        align: 'center',
      });

      doc.font('Courier').fontSize(10).text(ticket.id, { align: 'center' });

      doc.moveDown(2);

      // Add a separator for the next ticket if it's not the last one
      if (tickets.indexOf(ticket) < tickets.length - 1) {
          doc.addPage();
      }
    }

    doc.end();
  });
};
// =================================================================================
// END: NEW PDF GENERATION FUNCTION
// =================================================================================


exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Missing Stripe or Gmail environment variables.');
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

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!pi || pi.id !== paymentIntentId) {
      return createResponse(400, { success: false, error: 'Payment Intent not found.' });
    }
    if (pi.status !== 'succeeded' || (pi.amount_received || 0) <= 0) {
      return createResponse(400, { success: false, error: 'Payment not completed.' });
    }

    const metaEmail = (pi.metadata && pi.metadata.email) ? String(pi.metadata.email).toLowerCase() : null;
    const receiptEmail = pi.receipt_email ? String(pi.receipt_email).toLowerCase() : null;
    const incomingEmail = String(email).toLowerCase();

    if (metaEmail && metaEmail !== incomingEmail && receiptEmail && receiptEmail !== incomingEmail) {
      return createResponse(400, { success: false, error: 'Email does not match the payment record.' });
    }

    const RANGE_MIN = 1;
    const RANGE_MAX = 350000;
    const seed = `${paymentIntentId}:${incomingEmail}:${qty}`;

    const numbers = generateDeterministicUniqueNumbers(qty, RANGE_MIN, RANGE_MAX, seed);
    const tickets = numbers.map((number, idx) => ({
      number,
      id: hashId(paymentIntentId, incomingEmail, String(number), String(idx)),
    }));

    // Generate the PDF
    const pdfBuffer = await generateTicketPdf(fullName || 'Valued Customer', tickets);

    // Send Email with PDF attachment
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"DR7 Empire" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Your DR7 Lottery Tickets',
        text: `Hello ${fullName || 'Valued Customer'},\n\nThank you for your purchase. Your lottery tickets are attached to this email as a PDF.\n\nGood luck!\n\nThe DR7 Empire Team`,
        attachments: [
          {
            filename: 'DR7-Lottery-Tickets.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      console.log(`Email with PDF attachment sent successfully to ${email}.`);
    } catch (emailError) {
      console.error(`Failed to send email to ${email}:`, emailError);
      return createResponse(500, {
          success: false,
          error: 'Payment succeeded, but failed to send ticket email. Please contact support.'
      });
    }

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
        console.warn('Could not update PI metadata:', metaErr.message || metaErr);
      }
    }

    return createResponse(200, { success: true, tickets });
  } catch (err) {
    console.error('Error generating lottery tickets:', err);
    return createResponse(500, { success: false, error: err.message || 'Internal server error.' });
  }
};