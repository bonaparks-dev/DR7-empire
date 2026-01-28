// Netlify function to regenerate and resend PDFs for customers with reassigned ticket numbers
// Trigger this via: https://your-site.netlify.app/.netlify/functions/resend-updated-tickets

const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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

      doc.font('Helvetica-Bold').fontSize(12).text('Estrazione: 24 Gennaio 2026, ore 10:00', 50, yPos, { align: 'center', width: doc.page.width - 100 });
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

// Customers with reassigned ticket numbers
const customersToUpdate = [
  { email: "cristianosanti@inwind.it", full_name: "Cristiano Santi", new_ticket_numbers: [6, 8] },
  { email: "dubai.rent7.0srl@gmail.com", full_name: "Dubai Rent 7", new_ticket_numbers: [1, 2, 3, 5] },
  { email: "fabriliggi@gmail.com", full_name: "Fabri Liggi", new_ticket_numbers: [7] },
  { email: "francescola2003@gmail.com", full_name: "Francesco Laricchiuta", new_ticket_numbers: [12] },
  { email: "gianluca.andreolli@gmail.com", full_name: "Gianluca Andreolli", new_ticket_numbers: [9, 10] },
  { email: "infospace.magmanlacalessandro@gmail.com", full_name: "Alessandro Magmanlac", new_ticket_numbers: [11] },
  { email: "matteopiragavoi@gmail.com", full_name: "Matteo", new_ticket_numbers: [427, 957] },
  { email: "nicola.figus9@gmail.com", full_name: "Nicola Figus", new_ticket_numbers: [4] },
  { email: "pirafrancesco05@gmail.com", full_name: "Francesco pira", new_ticket_numbers: [681, 1545] }
];

exports.handler = async (event) => {
  // Simple security: only allow POST and require a secret
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // Simple auth check
    if (body.secret !== process.env.ADMIN_SECRET && body.secret !== 'DR7Empire2025') {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.secureserver.net',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const results = [];

    for (const customer of customersToUpdate) {
      try {
        console.log(`Processing: ${customer.full_name} (${customer.email})`);

        // Fetch tickets from database
        const { data: dbTickets, error } = await supabase
          .from('commercial_operation_tickets')
          .select('*')
          .eq('email', customer.email)
          .in('ticket_number', customer.new_ticket_numbers);

        if (error) {
          results.push({ email: customer.email, status: 'error', message: error.message });
          continue;
        }

        if (!dbTickets || dbTickets.length === 0) {
          results.push({ email: customer.email, status: 'error', message: 'No tickets found' });
          continue;
        }

        // Format tickets for PDF generation
        const tickets = dbTickets.map(t => ({
          number: t.ticket_number,
          uuid: t.uuid
        }));

        const purchaseDate = dbTickets[0].purchase_date;

        // Generate PDF
        const pdfBuffer = await generateTicketPdf(customer.full_name, tickets, new Date(purchaseDate));

        // Send email
        await transporter.sendMail({
          from: '"DR7 Empire" <info@dr7.app>',
          to: customer.email,
          subject: 'AGGIORNAMENTO - I Tuoi Biglietti LOTTERIA',
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
                .ticket-list { text-align: left; margin: 20px 0; }
                .ticket-list li { font-size: 18px; font-weight: bold; margin: 10px 0; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                .important { background: #fff3cd; border: 2px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎟️ AGGIORNAMENTO BIGLIETTI</h1>
                </div>
                <div class="content">
                  <p><strong>Ciao ${customer.full_name},</strong></p>
                  <div class="important">
                    <strong>⚠️ IMPORTANTE:</strong> Abbiamo aggiornato il sistema dei biglietti della LOTTERIA. I tuoi nuovi numeri di biglietto sono elencati qui sotto.
                  </div>
                  <div class="ticket-info">
                    <h2 style="margin: 0;">📋 I Tuoi Nuovi Numeri</h2>
                    <ul class="ticket-list">
                      ${tickets.map(t => `<li>Biglietto #${String(t.number).padStart(4, '0')}</li>`).join('')}
                    </ul>
                    <p style="margin-top: 20px;">I tuoi biglietti aggiornati sono allegati a questa email in formato PDF.</p>
                  </div>
                  <p><strong>Data Estrazione:</strong> 24 Gennaio 2026, ore 10:00</p>
                  <p><strong>Biglietti disponibili:</strong> Solo 2.000</p>
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
            filename: 'Biglietti-LOTTERIA-AGGIORNATI.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf',
          }],
        });

        results.push({ email: customer.email, status: 'success', tickets: tickets.map(t => t.number) });

      } catch (error) {
        results.push({ email: customer.email, status: 'error', message: error.message });
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, results })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
