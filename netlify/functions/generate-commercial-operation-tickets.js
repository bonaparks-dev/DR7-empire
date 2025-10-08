// netlify/functions/generate-commercial-operation-tickets.js

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
// START: REDESIGNED PDF GENERATION FUNCTION
// =================================================================================
const generateTicketPdf = (fullName, tickets, purchaseDate) => {
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

    for (const ticket of tickets) {
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;

      // Draw main border
      doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
         .lineWidth(3)
         .strokeColor('#000000')
         .stroke();

      // Draw decorative corners
      const cornerSize = 40;
      const cornerOffset = 40;

      // Top-left corner
      doc.moveTo(cornerOffset, cornerOffset + cornerSize)
         .lineTo(cornerOffset, cornerOffset)
         .lineTo(cornerOffset + cornerSize, cornerOffset)
         .lineWidth(2)
         .stroke();

      // Top-right corner
      doc.moveTo(pageWidth - cornerOffset - cornerSize, cornerOffset)
         .lineTo(pageWidth - cornerOffset, cornerOffset)
         .lineTo(pageWidth - cornerOffset, cornerOffset + cornerSize)
         .stroke();

      // Bottom-left corner
      doc.moveTo(cornerOffset, pageHeight - cornerOffset - cornerSize)
         .lineTo(cornerOffset, pageHeight - cornerOffset)
         .lineTo(cornerOffset + cornerSize, pageHeight - cornerOffset)
         .stroke();

      // Bottom-right corner
      doc.moveTo(pageWidth - cornerOffset - cornerSize, pageHeight - cornerOffset)
         .lineTo(pageWidth - cornerOffset, pageHeight - cornerOffset)
         .lineTo(pageWidth - cornerOffset, pageHeight - cornerOffset - cornerSize)
         .stroke();

      let yPosition = 80;

      // Main Title - 7 MILIONI DI €
      doc.font('Helvetica-Bold')
         .fontSize(28)
         .fillColor('#000000')
         .text('7 MILIONI DI €', margin, yPosition, {
           align: 'center',
           width: pageWidth - margin * 2,
         });
      yPosition += 35;

      // Subtitle - Biglietto Ufficiale
      doc.font('Helvetica')
         .fontSize(11)
         .fillColor('#666666')
         .text('BIGLIETTO UFFICIALE', margin, yPosition, {
           align: 'center',
           width: pageWidth - margin * 2,
           characterSpacing: 4,
         });
      yPosition += 18;

      // Subtitle - Operazione Commerciale
      doc.font('Helvetica')
         .fontSize(11)
         .fillColor('#666666')
         .text('OPERAZIONE COMMERCIALE', margin, yPosition, {
           align: 'center',
           width: pageWidth - margin * 2,
           characterSpacing: 4,
         });
      yPosition += 30;

      // Divider line
      const dividerWidth = 60;
      doc.moveTo((pageWidth - dividerWidth) / 2, yPosition)
         .lineTo((pageWidth + dividerWidth) / 2, yPosition)
         .lineWidth(2)
         .strokeColor('#000000')
         .stroke();
      yPosition += 30;

      // Ticket Holder Label
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor('#999999')
         .text('TITOLARE DEL BIGLIETTO', margin, yPosition, {
           align: 'center',
           width: pageWidth - margin * 2,
           characterSpacing: 3,
         });
      yPosition += 15;

      // Ticket Holder Name
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor('#000000')
         .text(fullName.toUpperCase(), margin, yPosition, {
           align: 'center',
           width: pageWidth - margin * 2,
         });
      yPosition += 35;

      // Divider line
      doc.moveTo((pageWidth - dividerWidth) / 2, yPosition)
         .lineTo((pageWidth + dividerWidth) / 2, yPosition)
         .lineWidth(2)
         .strokeColor('#000000')
         .stroke();
      yPosition += 30;

      // Ticket Number Label
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor('#999999')
         .text('NUMERO BIGLIETTO', margin, yPosition, {
           align: 'center',
           width: pageWidth - margin * 2,
           characterSpacing: 3,
         });
      yPosition += 15;

      // Ticket Number
      doc.font('Helvetica-Bold')
         .fontSize(56)
         .fillColor('#000000')
         .text(ticket.number.toString().padStart(6, '0'), margin, yPosition, {
           align: 'center',
           width: pageWidth - margin * 2,
           characterSpacing: 8,
         });
      yPosition += 70;

      // Purchase Date & Time Label
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor('#999999')
         .text('DATA E ORA DI ACQUISTO', margin, yPosition, {
           align: 'center',
           width: pageWidth - margin * 2,
           characterSpacing: 3,
         });
      yPosition += 15;

      // Purchase Date & Time Value
      if (purchaseDate) {
        const dateStr = new Date(purchaseDate).toLocaleString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Rome'
        });
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .fillColor('#000000')
           .text(dateStr, margin, yPosition, {
             align: 'center',
             width: pageWidth - margin * 2,
           });
        yPosition += 50;
      }

      // QR Code - Centered in the middle section
      const qrSize = 200;
      const qrCodeDataUrl = await QRCode.toDataURL('https://dr7empire.com/', {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 0,
        width: qrSize,
        color: { dark: '#000000', light: '#FFFFFF' }
      });

      // QR Code border
      const qrX = (pageWidth - qrSize - 30) / 2;
      const qrY = (pageHeight - qrSize) / 2 + 20;
      
      doc.rect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30)
         .lineWidth(2)
         .strokeColor('#000000')
         .stroke();

      doc.image(qrCodeDataUrl, qrX, qrY, {
        width: qrSize,
        height: qrSize,
      });

      // Ticket ID below QR code
      doc.font('Courier')
         .fontSize(9)
         .fillColor('#666666')
         .text(`ID: ${ticket.id}`, margin, qrY + qrSize + 30, {
           align: 'center',
           width: pageWidth - margin * 2,
         });

      // Footer
      const footerY = pageHeight - 100;
      doc.font('Helvetica')
         .fontSize(11)
         .fillColor('#666666')
         .text('Buona fortuna! L\'estrazione si terrà il giorno di Natale.', margin, footerY, {
           align: 'center',
           width: pageWidth - margin * 2,
         });
      
      doc.text('Per domande, visita dr7empire.com', margin, footerY + 20, {
        align: 'center',
        width: pageWidth - margin * 2,
      });

      if (tickets.indexOf(ticket) < tickets.length - 1) {
        doc.addPage();
      }
    }

    doc.end();
  });
};
// =================================================================================
// END: REDESIGNED PDF GENERATION FUNCTION
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
        subject: 'I Tuoi Biglietti DR7 - Operazione Commerciale 7 MILIONI DI EURO',
        text: `Ciao ${fullName || 'Cliente Stimato'},\n\nGrazie per il tuo acquisto! I tuoi ${qty} bigliett${qty > 1 ? 'i' : 'o'} dell'Operazione Commerciale sono allegat${qty > 1 ? 'i' : 'o'} a questa email in formato PDF.\n\nBuona fortuna! L'estrazione si terrà il giorno di Natale.\n\nIl Team DR7 Empire`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #000000 0%, #434343 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
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
                <p>Grazie per aver partecipato all'Operazione Commerciale <strong>"7 MILIONI DI EURO"</strong>!</p>
                <div class="ticket-info">
                  <h2 style="margin: 0;">📋 Dettagli Acquisto</h2>
                  <p style="font-size: 24px; margin: 10px 0;"><strong>${qty} Bigliett${qty > 1 ? 'i' : 'o'}</strong></p>
                  <p>I tuoi biglietti sono allegati a questa email in formato PDF.</p>
                </div>
                <p><strong>🎁 BONUS:</strong> Riceverai anche una Gift Card da €25 via email separata!</p>
                <p><strong>🎄 Data Estrazione:</strong> 25 Dicembre 2025</p>
                <p style="margin-top: 30px;"><strong>Buona fortuna!</strong></p>
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
            filename: 'Biglietti-DR7-Operazione-Commerciale.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      console.log(`[Tickets] ✅ Email sent successfully to ${email}`);
    } catch (emailError) {
      console.error(`[Tickets] ❌ Failed to send email to ${email}:`, emailError);
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
    console.error('Error generating tickets:', err);
    return createResponse(500, { success: false, error: err.message || 'Internal server error.' });
  }
};
