import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import nodemailer from "nodemailer";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const { booking } = JSON.parse(event.body || '{}');

  if (!booking) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Booking data is required' }),
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // false for port 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Extract data from new booking structure
  const customerEmail = booking.booking_details?.customer?.email || booking.customer?.email;
  const customerName = booking.booking_details?.customer?.fullName || booking.customer?.fullName || 'Cliente';
  const vehicleName = booking.vehicle_name;
  const bookingId = booking.id;
  const pickupDate = new Date(booking.pickup_date);
  const dropoffDate = new Date(booking.dropoff_date);
  const totalPrice = booking.price_total / 100; // Convert from cents to euros
  const currency = booking.currency || 'EUR';

  const mailOptions = {
    from: `"DR7 Empire" <dubai.rent7.0srl@gmail.com>`,
    to: customerEmail,
    subject: `Conferma Prenotazione #${bookingId.substring(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">Prenotazione Confermata!</h1>
        <p>Gentile ${customerName},</p>
        <p>Grazie per aver prenotato con DR7 Empire. Ecco il riepilogo della tua prenotazione:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Riepilogo Prenotazione</h2>
          <p><strong>Veicolo:</strong> ${vehicleName}</p>
          <p><strong>Numero Prenotazione:</strong> DR7-${bookingId.substring(0, 8).toUpperCase()}</p>
          <p><strong>Data e Ora Ritiro:</strong> ${pickupDate.toLocaleDateString('it-IT')} alle ${pickupDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
          <p><strong>Data e Ora Riconsegna:</strong> ${dropoffDate.toLocaleDateString('it-IT')} alle ${dropoffDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
          <p><strong>Luogo di Ritiro:</strong> ${booking.pickup_location}</p>
          <p><strong>Stato Pagamento:</strong> ${booking.payment_status === 'pending' ? 'In attesa' : 'Completato'}</p>
        </div>

        <h3 style="font-size: 24px;">Costo Totale: ${new Intl.NumberFormat('it-IT', { style: 'currency', currency: currency }).format(totalPrice)}</h3>
        
        ${booking.payment_method === 'agency' ? `
          <p style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <strong>⚠️ Nota:</strong> Il pagamento sarà effettuato in sede al momento del ritiro del veicolo.
          </p>
        ` : ''}

        <p style="margin-top: 30px;">Ti aspettiamo!</p>
        <p><strong>DR7 Empire Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Per qualsiasi domanda, contattaci all'indirizzo <a href="mailto:support@dr7empire.com">support@dr7empire.com</a>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' }),
    };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error sending email', error: error.message }),
    };
  }
};

export { handler };
