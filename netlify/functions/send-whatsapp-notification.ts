import type { Handler } from "@netlify/functions";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM; // e.g., whatsapp:+14155238886
const WHATSAPP_BUSINESS_TOKEN = process.env.WHATSAPP_BUSINESS_TOKEN;
const WHATSAPP_BUSINESS_PHONE_ID = process.env.WHATSAPP_BUSINESS_PHONE_ID;
const ADMIN_WHATSAPP_NUMBER = '+393457905205';

/**
 * Sends WhatsApp notification for new bookings, tickets, and other events
 * Supports both Twilio and WhatsApp Business API
 */
const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const { booking, ticket, type } = JSON.parse(event.body || '{}');

  if (!booking && !ticket) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Booking or ticket data is required' }),
    };
  }

  // Check if either Twilio or WhatsApp Business API is configured
  const useTwilio = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM);
  const useWhatsAppBusiness = !!(WHATSAPP_BUSINESS_TOKEN && WHATSAPP_BUSINESS_PHONE_ID);

  if (!useTwilio && !useWhatsAppBusiness) {
    console.error('No WhatsApp service configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'WhatsApp service not configured' }),
    };
  }

  let message = '';

  // Handle ticket purchase notifications
  if (ticket || type === 'ticket') {
    const ticketData = ticket || {};
    const customerName = ticketData.customer_name || ticketData.name || 'Cliente';
    const customerEmail = ticketData.customer_email || ticketData.email;
    const ticketQuantity = ticketData.quantity || 1;
    const totalPrice = ticketData.total_price ? (ticketData.total_price / 100).toFixed(2) : 'N/A';
    const ticketNumbers = ticketData.ticket_numbers || [];

    message = `🎟️ *NUOVA VENDITA BIGLIETTI*\n\n`;
    message += `*Cliente:* ${customerName}\n`;
    message += `*Email:* ${customerEmail}\n`;
    message += `*Quantità:* ${ticketQuantity} bigliett${ticketQuantity > 1 ? 'i' : 'o'}\n`;
    message += `*Totale:* €${totalPrice}\n`;
    if (ticketNumbers.length > 0) {
      message += `*Numeri:* ${ticketNumbers.join(', ')}\n`;
    }
    message += `*Data:* ${new Date().toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })} alle ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })}`;
  }
  // Handle booking notifications
  else if (booking) {
    const serviceType = booking.service_type;
    const customerName = booking.customer_name || 'Cliente';
    const customerEmail = booking.customer_email;
    const customerPhone = booking.customer_phone;
    const bookingId = booking.id.substring(0, 8).toUpperCase();
    const totalPrice = (booking.price_total / 100).toFixed(2);
    const currency = booking.currency || 'EUR';

    if (serviceType === 'car_wash') {
    // Car Wash Booking
    const appointmentDate = new Date(booking.appointment_date);
    const serviceName = booking.service_name;
    const additionalService = booking.booking_details?.additionalService;
    const notes = booking.booking_details?.notes;

    // Format date and time in Europe/Rome timezone
    const formattedDate = appointmentDate.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Rome'
    });
    const formattedTime = appointmentDate.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Rome'
    });

    message = `🚗 *NUOVA PRENOTAZIONE AUTOLAVAGGIO*\n\n`;
    message += `*ID:* DR7-${bookingId}\n`;
    message += `*Cliente:* ${customerName}\n`;
    message += `*Email:* ${customerEmail}\n`;
    message += `*Telefono:* ${customerPhone}\n`;
    message += `*Servizio:* ${serviceName}\n`;
    message += `*Data e Ora:* ${formattedDate} alle ${formattedTime}\n`;
    if (additionalService) {
      message += `*Servizio Aggiuntivo:* ${additionalService}\n`;
    }
    if (notes) {
      message += `*Note:* ${notes}\n`;
    }
    message += `*Totale:* €${totalPrice}\n`;
    message += `*Stato Pagamento:* ${booking.payment_status === 'paid' ? '✅ Pagato' : '⏳ In attesa'}`;
  } else {
    // Car Rental Booking
    const vehicleName = booking.vehicle_name;
    const pickupDate = new Date(booking.pickup_date);
    const dropoffDate = new Date(booking.dropoff_date);
    const pickupLocation = booking.pickup_location;
    const insuranceOption = booking.insurance_option || booking.booking_details?.insuranceOption || 'Nessuna';

    // Format dates and times in Europe/Rome timezone
    const pickupDateFormatted = pickupDate.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
    const pickupTimeFormatted = pickupDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
    const dropoffDateFormatted = dropoffDate.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
    const dropoffTimeFormatted = dropoffDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });

    message = `🚘 *NUOVA PRENOTAZIONE NOLEGGIO*\n\n`;
    message += `*ID:* DR7-${bookingId}\n`;
    message += `*Cliente:* ${customerName}\n`;
    message += `*Email:* ${customerEmail}\n`;
    message += `*Telefono:* ${customerPhone}\n`;
    message += `*Veicolo:* ${vehicleName}\n`;
    message += `*Ritiro:* ${pickupDateFormatted} alle ${pickupTimeFormatted}\n`;
    message += `*Riconsegna:* ${dropoffDateFormatted} alle ${dropoffTimeFormatted}\n`;
    message += `*Luogo Ritiro:* ${pickupLocation}\n`;
    message += `*Assicurazione:* ${insuranceOption}\n`;
    message += `*Totale:* €${totalPrice}\n`;
    message += `*Stato Pagamento:* ${booking.payment_status === 'paid' ? '✅ Pagato' : '⏳ In attesa'}`;
    }
  }

  try {
    let response;

    if (useWhatsAppBusiness) {
      // Send via WhatsApp Business API
      response = await fetch(
        `https://graph.facebook.com/v18.0/${WHATSAPP_BUSINESS_PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_BUSINESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: ADMIN_WHATSAPP_NUMBER.replace('+', ''),
            type: 'text',
            text: { body: message }
          }),
        }
      );
    } else {
      // Send via Twilio API
      response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: TWILIO_WHATSAPP_FROM,
            To: `whatsapp:${ADMIN_WHATSAPP_NUMBER}`,
            Body: message,
          }),
        }
      );
    }

    if (!response.ok) {
      const error = await response.text();
      console.error('WhatsApp API error:', error);
      throw new Error(`WhatsApp API error: ${error}`);
    }

    const data = await response.json();
    const messageId = useWhatsAppBusiness ? data.messages?.[0]?.id : data.sid;
    console.log('WhatsApp notification sent:', messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'WhatsApp notification sent', id: messageId }),
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp notification:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error sending WhatsApp notification', error: error.message }),
    };
  }
};

export { handler };
