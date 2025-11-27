// Netlify function to generate and send PDF for manually sold tickets
// Called by admin panel after manual ticket sale

const nodemailer = require('nodemailer');
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

// PDF generation function (same as in generate-commercial-operation-tickets.js)
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
      // Draw outer border
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).lineWidth(3).strokeColor('#FFD700').stroke();

      let yPos = 80;
      doc.font('Helvetica-Bold').fontSize(24).text('LOTTERIA', 50, yPos, { align: 'center', width: doc.page.width - 100 });
      yPos += 35;
      doc.font('Helvetica').fontSize(14).text('BIGLIETTO UFFICIALE', 50, yPos, { align: 'center', width: doc.page.width - 100 });
      yPos += 40;

      doc.font('Helvetica').fontSize(14).text('TITOLARE DEL BIGLIETTO', 50, yPos, { align: 'center', width: doc.page.width - 100, characterSpacing: 2 });
      yPos += 25;
      doc.font('Helvetica-Bold').fontSize(20).text(fullName.toUpperCase(), 50, yPos, { align: 'center', width: doc.page.width - 100 });
      yPos += 40;

      doc.font('Helvetica').fontSize(14).text('NUMERO BIGLIETTO', 50, yPos, { align: 'center', width: doc.page.width - 100, characterSpacing: 2 });
      yPos += 25;
      doc.font('Helvetica-Bold').fontSize(36).text(ticket.number.toString().padStart(4, '0'), 50, yPos, { align: 'center', width: doc.page.width - 100 });
      yPos += 55;

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

      doc.font('Helvetica-Bold').fontSize(12).text('Estrazione: 24 Dicembre 2025, ore 10:00', 50, yPos, { align: 'center', width: doc.page.width - 100 });
      yPos += 20;
      doc.font('Helvetica').fontSize(10).text('Solo 2.000 biglietti disponibili', 50, yPos, { align: 'center', width: doc.page.width - 100 });
      yPos += 15;
      doc.font('Helvetica').fontSize(10).text('Supervisione legale garantita', 50, yPos, { align: 'center', width: doc.page.width - 100 });

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

  try {
    const { ticketNumber, email, fullName, phone } = JSON.parse(event.body || '{}');

    if (!ticketNumber || !email || !fullName) {
      return createResponse(400, { success: false, error: 'Missing required fields' });
    }

    console.log(`[Manual Ticket PDF] Generating PDF for ticket ${ticketNumber}, customer: ${fullName}`);

    // Get ticket details from database
    const { data: ticketData, error: fetchError } = await supabase
      .from('commercial_operation_tickets')
      .select('*')
      .eq('ticket_number', ticketNumber)
      .eq('email', email)
      .single();

    if (fetchError || !ticketData) {
      console.error('[Manual Ticket PDF] Ticket not found:', fetchError);
      return createResponse(404, { success: false, error: 'Ticket not found in database' });
    }

    // Format ticket for PDF generation
    const tickets = [{
      number: ticketData.ticket_number,
      uuid: ticketData.uuid
    }];

    const purchaseDate = new Date(ticketData.purchase_date);

    // Generate PDF
    console.log('[Manual Ticket PDF] Generating PDF...');
    const pdfBuffer = await generateTicketPdf(fullName, tickets, purchaseDate);
    console.log(`[Manual Ticket PDF] PDF generated, size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    // Send email
    console.log('[Manual Ticket PDF] Sending email...');
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
      subject: 'Il Tuo Biglietto - LOTTERIA',
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
              <h1>🎟️ IL TUO BIGLIETTO È PRONTO!</h1>
            </div>
            <div class="content">
              <p><strong>Ciao ${fullName},</strong></p>
              <p>Grazie per aver partecipato alla <strong>LOTTERIA</strong>!</p>
              <div class="ticket-info">
                <h2 style="margin: 0;">📋 Il Tuo Numero</h2>
                <p style="font-size: 48px; font-weight: bold; margin: 20px 0;">${String(ticketNumber).padStart(4, '0')}</p>
                <p>Il tuo biglietto è allegato a questa email in formato PDF.</p>
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
      attachments: [{
        filename: `Biglietto-LOTTERIA-${String(ticketNumber).padStart(4, '0')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    console.log(`[Manual Ticket PDF] ✅ Email sent successfully to ${email}`);

    // Send admin notification
    try {
      await transporter.sendMail({
        from: `"DR7 Empire" <${process.env.GMAIL_USER}>`,
        to: 'dubai.rent7.0srl@gmail.com',
        subject: `Vendita Manuale Biglietto - #${String(ticketNumber).padStart(4, '0')} - ${fullName}`,
        html: `
          <h2>Vendita Manuale Biglietto LOTTERIA</h2>
          <p><strong>Cliente:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Telefono:</strong> ${phone}</p>` : ''}
          <p><strong>Numero Biglietto:</strong> #${String(ticketNumber).padStart(4, '0')}</p>
          <p><strong>Data:</strong> ${purchaseDate.toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}</p>
          <p><strong>UUID:</strong> ${ticketData.uuid}</p>
          <p><em>Vendita effettuata tramite pannello admin</em></p>
        `
      });
      console.log('[Manual Ticket PDF] ✅ Admin notification sent');
    } catch (adminError) {
      console.error('[Manual Ticket PDF] ❌ Failed to send admin notification:', adminError);
    }

    return createResponse(200, { success: true, message: 'PDF generated and sent successfully' });

  } catch (error) {
    console.error('[Manual Ticket PDF] Error:', error);
    return createResponse(500, { success: false, error: error.message || 'Internal server error' });
  }
};
