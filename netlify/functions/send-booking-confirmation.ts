import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import nodemailer from "nodemailer";
import type { Booking } from "../../types";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const { booking } = JSON.parse(event.body || '{}') as { booking: Booking };

  if (!booking) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Booking data is required' }),
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"DR7 Empire" <no-reply@dr7empire.com>`,
    to: booking.customer.email,
    subject: `Conferma Prenotazione #${booking.bookingId.substring(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #000;">Prenotazione Confermata!</h1>
        <p>Grazie per aver prenotato con DR7. Ecco il riepilogo della tua prenotazione:</p>

        <h2>Riepilogo</h2>
        <p><strong>Veicolo:</strong> ${booking.itemName}</p>
        <p><strong>Numero Prenotazione:</strong> DR7-${booking.bookingId.substring(0, 8).toUpperCase()}</p>
        <p><strong>Data Ritiro:</strong> ${new Date(booking.pickupDate).toLocaleDateString('it-IT')} alle ${booking.pickupTime}</p>
        <p><strong>Data Riconsegna:</strong> ${new Date(booking.returnDate).toLocaleDateString('it-IT')} alle ${booking.returnTime}</p>

        <h3>Costo Totale: ${new Intl.NumberFormat('it-IT', { style: 'currency', currency: booking.currency }).format(booking.totalPrice)}</h3>

        <p>Grazie per aver scelto DR7!</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' }),
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error sending email', error: error.message }),
    };
  }
};

export { handler };