// netlify/functions/generate-commercial-operation-tickets.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const { createHash } = require('crypto');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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

// Simple PDF generation (working version from Oct 4)
const generateTicketPdf = (fullName, tickets, purchaseDate) => {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', (err) => {
      reject(err);
    });

    for (const ticket of tickets) {
      // Draw outer border (space between gold border and edge)
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).lineWidth(3).strokeColor('#FFD700').stroke();

      // Top section with ticket info
      let yPos = 80;
      doc.font('Helvetica-Bold').fontSize(24).text('LOTTERIA', 50, yPos, { align: 'center', width: doc.page.width - 100 });
      yPos += 35;
      doc.font('Helvetica').fontSize(14).text('BIGLIETTO UFFICIALE', 50, yPos, { align: 'center', width: doc.page.width - 100 });
      yPos += 40;

      // Ticket details
      doc.font('Helvetica').fontSize(14).text('TITOLARE DEL BIGLIETTO', 50, yPos, { align: 'center', width: doc.page.width - 100, characterSpacing: 2 });
      yPos += 25;
      doc.font('Helvetica-Bold').fontSize(20).text(fullName.toUpperCase(), 50, yPos, { align: 'center', width: doc.page.width - 100 });
      yPos += 40;

      doc.font('Helvetica').fontSize(14).text('NUMERO BIGLIETTO', 50, yPos, { align: 'center', width: doc.page.width - 100, characterSpacing: 2 });
      yPos += 25;
      doc.font('Helvetica-Bold').fontSize(36).text(ticket.number.toString().padStart(6, '0'), 50, yPos, { align: 'center', width: doc.page.width - 100 });
      yPos += 55;

      // Purchase date and time
      if (purchaseDate) {
        const dateStr = new Date(purchaseDate).toLocaleString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Rome'
        });
        doc.font('Helvetica').fontSize(12).text('DATA E ORA DI ACQUISTO', 50, yPos, { align: 'center', width: doc.page.width - 100, characterSpacing: 1 });
        yPos += 20;
        doc.font('Helvetica-Bold').fontSize(14).text(dateStr, 50, yPos, { align: 'center', width: doc.page.width - 100 });
        yPos += 35;
      }

      // Center QR code
      const qrSize = 200;
      const qrCodeDataUrl = await QRCode.toDataURL('https://dr7empire.com/', {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      const qrX = (doc.page.width - qrSize) / 2;
      doc.image(qrCodeDataUrl, qrX, yPos, { width: qrSize, height: qrSize });
      yPos += qrSize + 15;

      doc.font('Courier').fontSize(10).text(`ID: ${ticket.uuid}`, 50, yPos, { align: 'center', width: doc.page.width - 100 });
      yPos += 30;

      // Lottery info
      doc.font('Helvetica-Bold').fontSize(12).text('Estrazione: 24 Dicembre 2025, ore 10:00', 50, yPos, { align: 'center', width: doc.page.width - 100 });
      yPos += 20;
      doc.font('Helvetica').fontSize(10).text('Solo 2.000 biglietti disponibili', 50, yPos, { align: 'center', width: doc.page.width - 100 });
      yPos += 15;
      doc.font('Helvetica').fontSize(10).text('Supervisione legale garantita', 50, yPos, { align: 'center', width: doc.page.width - 100 });

      // Footer
      const footerY = doc.page.height - 80;
      doc.font('Helvetica-Oblique').fontSize(10).text('In bocca al lupo!',
        50, footerY, { align: 'center', width: doc.page.width - 100 });

      if (tickets.indexOf(ticket) < tickets.length - 1) {
        doc.addPage();
      }
    }

    doc.end();
  });
};


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
    const RANGE_MAX = 2000;
    const seed = `${paymentIntentId}:${incomingEmail}:${qty}`;

    const numbers = generateDeterministicUniqueNumbers(qty, RANGE_MIN, RANGE_MAX, seed);
    const tickets = numbers.map((number, idx) => ({
      number,
      uuid: hashId(paymentIntentId, incomingEmail, String(number), String(idx)),
    }));

    // Get purchase date from Payment Intent creation timestamp
    const purchaseDate = pi.created ? new Date(pi.created * 1000) : new Date();

    console.log(`[Tickets] Generating PDF for ${qty} tickets for ${email}`);
    let pdfBuffer;
    try {
      pdfBuffer = await generateTicketPdf(fullName || 'Cliente Stimato', tickets, purchaseDate);
      console.log(`[Tickets] PDF generated successfully, size: ${pdfBuffer.length} bytes`);
    } catch (pdfError) {
      console.error(`[Tickets] PDF generation failed:`, pdfError);
      return createResponse(500, {
        success: false,
        error: 'Failed to generate ticket PDF. Please contact support.'
      });
    }

    console.log(`[Tickets] Preparing to send email to ${email}`);
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      console.log(`[Tickets] Transporter created, sending email...`);
      await transporter.sendMail({
        from: `"DR7 Empire" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'I Tuoi Biglietti - LOTTERIA',
        text: `Ciao ${fullName || 'Cliente Stimato'},\n\nGrazie per il tuo acquisto! I tuoi ${qty} bigliett${qty > 1 ? 'i' : 'o'} della LOTTERIA sono allegat${qty > 1 ? 'i' : 'o'} a questa email in formato PDF.\n\nEstrazione: 24 Dicembre 2025, ore 10:00\nSolo 2.000 biglietti disponibili!\n\nIn bocca al lupo!\n\nIl Team DR7 Empire`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
              .header { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #000; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .ticket-info { background: white; border: 2px solid #000; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎟️ I TUOI BIGLIETTI SONO PRONTI!</h1>
              </div>
              <div class="content">
                <p><strong>Ciao ${fullName || 'Cliente Stimato'},</strong></p>
                <p>Grazie per aver partecipato alla <strong>LOTTERIA</strong>!</p>
                <div class="ticket-info">
                  <h2 style="margin: 0;">📋 Dettagli Acquisto</h2>
                  <p style="font-size: 24px; margin: 10px 0;"><strong>${qty} Bigliett${qty > 1 ? 'i' : 'o'}</strong></p>
                  <p>I tuoi biglietti sono allegati a questa email in formato PDF.</p>
                </div>
                <p><strong>🎄 Data Estrazione:</strong> 24 Dicembre 2025, ore 10:00</p>
                <p><strong>🎟️ Biglietti disponibili:</strong> Solo 2.000</p>
                <p style="margin-top: 30px;"><strong>In bocca al lupo!</strong></p>
                <div class="footer">
                  <p>DR7 Empire – Luxury Car Rental & Services</p>
                  <p>Per domande: <a href="https://dr7empire.com">dr7empire.com</a></p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        attachments: [
          {
            filename: 'Biglietti-LOTTERIA.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      console.log(`[Tickets] ✅ Email sent successfully to ${email} (PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB)`);

      // Send admin notification
      try {
        await transporter.sendMail({
          from: `"DR7 Empire" <${process.env.GMAIL_USER}>`,
          to: 'dubai.rent7.0srl@gmail.com',
          subject: `Nuovo Acquisto Biglietti - ${qty} biglietto/i - ${fullName}`,
          html: `
            <h2>Nuovo Acquisto Operazione Commerciale</h2>
            <p><strong>Cliente:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Quantità:</strong> ${qty} biglietto/i</p>
            <p><strong>Importo:</strong> €${(pi.amount / 100).toFixed(2)}</p>
            <p><strong>Payment Intent:</strong> ${paymentIntentId}</p>
            <p><strong>Data:</strong> ${purchaseDate.toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}</p>
            <hr>
            <h3>Numeri Biglietti:</h3>
            <ul>
              ${tickets.map(t => `<li>Biglietto #${String(t.number).padStart(6, '0')} (ID: ${t.uuid})</li>`).join('')}
            </ul>
          `
        });
        console.log(`[Tickets] ✅ Admin notification sent`);
      } catch (adminEmailError) {
        console.error(`[Tickets] ❌ Failed to send admin notification:`, adminEmailError);
        // Don't fail the whole request if admin email fails
      }

    } catch (emailError) {
      console.error(`[Tickets] ❌ Failed to send email to ${email} (PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB):`, emailError);
      console.error(`[Tickets] Error details:`, {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command
      });
      return createResponse(500, {
          success: false,
          error: 'Payment succeeded, but failed to send ticket email. Please contact support.'
      });
    }

    // Save tickets to Supabase
    console.log(`[Tickets] Saving ${qty} tickets to Supabase...`);
    try {
      const ticketsToInsert = tickets.map(ticket => ({
        uuid: ticket.uuid,
        ticket_number: ticket.number,
        user_id: null, // Will be linked if user is authenticated
        email: email,
        full_name: fullName || 'Cliente Stimato',
        payment_intent_id: paymentIntentId,
        amount_paid: pi.amount,
        currency: pi.currency,
        purchase_date: purchaseDate.toISOString(),
        quantity: qty
      }));

      const { data, error } = await supabase
        .from('commercial_operation_tickets')
        .insert(ticketsToInsert);

      if (error) {
        console.error(`[Tickets] ❌ Failed to save to Supabase:`, error);
        // Don't fail the whole request if Supabase fails
      } else {
        console.log(`[Tickets] ✅ Saved ${qty} tickets to Supabase`);
      }
    } catch (supabaseError) {
      console.error(`[Tickets] ❌ Supabase error:`, supabaseError);
      // Don't fail the whole request if Supabase fails
    }

    // Send WhatsApp notification
    console.log(`[Tickets] Sending WhatsApp notification...`);
    try {
      const ticketNumbers = tickets.map(t => String(t.number).padStart(4, '0'));
      await fetch(`${process.env.URL}/.netlify/functions/send-whatsapp-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ticket',
          ticket: {
            customer_name: fullName || 'Cliente Stimato',
            customer_email: email,
            quantity: qty,
            total_price: pi.amount,
            ticket_numbers: ticketNumbers
          }
        })
      });
      console.log(`[Tickets] ✅ WhatsApp notification sent`);
    } catch (whatsappError) {
      console.error(`[Tickets] ❌ Failed to send WhatsApp notification:`, whatsappError);
      // Don't fail the whole request if WhatsApp notification fails
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
    console.error('Error generating tickets:', err);
    return createResponse(500, { success: false, error: err.message || 'Internal server error.' });
  }
};
