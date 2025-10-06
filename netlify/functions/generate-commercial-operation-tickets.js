// netlify/functions/generate-commercial-operation-tickets.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const { createHash } = require('crypto');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// Add your base64 logo here after converting it with the tool
const DR7_LOGO_BASE64 = 'data:image/png;base64,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';

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
  return \`\${h.slice(0, 8)}-\${h.slice(8, 12)}-\${h.slice(12, 16)}-\${h.slice(16, 20)}-\${h.slice(20, 32)}\`;
}

// =================================================================================
// REDESIGNED PDF GENERATION FUNCTION - PROFESSIONAL BLACK & WHITE WITH EXO FONT
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

    // Convert base64 logo to buffer
    let logoBuffer;
    try {
      logoBuffer = Buffer.from(DR7_LOGO_BASE64.split(',')[1], 'base64');
    } catch (error) {
      console.error("Failed to convert logo:", error);
    }

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

      let yPosition = 60;

      // Logo
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, (pageWidth - 70) / 2, yPosition, {
            fit: [70, 70],
            align: 'center',
          });
          yPosition += 85;
        } catch (err) {
          console.error("Error adding logo:", err);
          yPosition += 20;
        }
      }

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
         .text(\`ID: \${ticket.id}\`, margin, qrY + qrSize + 30, {
           align: 'center',
           width: pageWidth - margin * 2,
         });

      // Footer
      const footerY = pageHeight - 100;
      doc.font('Helvetica')
         .fontSize(11)
         .fillColor('#666666')
         .text('Buona fortuna! L\\'estrazione si terrà il giorno di Natale.', margin, footerY, {
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
    const seed = \`\${paymentIntentId}:\${incomingEmail}:\${qty}\`;

    const numbers = generateDeterministicUniqueNumbers(qty, RANGE_MIN, RANGE_MAX, seed);
    const tickets = numbers.map((number, idx) => ({
      number,
      id: hashId(paymentIntentId, incomingEmail, String(number), String(idx)),
    }));

    const purchaseDate = pi.created ? new Date(pi.created * 1000) : new Date();

    const pdfBuffer = await generateTicketPdf(fullName || 'Cliente Stimato', tickets, purchaseDate);

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: \`"DR7 Empire" <\${process.env.GMAIL_USER}>\`,
        to: email,
        subject: 'I Tuoi Biglietti DR7 Operazione Commerciale',
        text: \`Ciao \${fullName || 'Cliente Stimato'},\\n\\nGrazie per il tuo acquisto. I tuoi biglietti dell'Operazione Commerciale sono allegati a questa email in formato PDF.\\n\\nBuona fortuna!\\n\\nIl Team DR7 Empire\`,
        attachments: [
          {
            filename: 'Biglietti-DR7-Operazione-Commerciale.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      console.log(\`Email with PDF attachment sent successfully to \${email}.\`);
    } catch (emailError) {
      console.error(\`Failed to send email to \${email}:\`, emailError);
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
