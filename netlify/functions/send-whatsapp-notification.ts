import type { Handler } from "@netlify/functions";

const sanitizeForWhatsApp = (str: string | undefined | null): string => {
  if (!str) return '';
  // Remove markdown-sensitive characters that could be exploited
  return str.replace(/[*_~`]/g, '').substring(0, 500);
};

const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID;
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;
const NOTIFICATION_PHONE = process.env.NOTIFICATION_PHONE || "393457905205"; // Your phone to receive notifications

/**
 * Sends WhatsApp notification using Green API
 * More reliable than CallMeBot
 */
const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const { booking, customMessage, customPhone } = JSON.parse(event.body || '{}');

  // Check if Green API is configured
  if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
    console.error('Green API not configured. Set GREEN_API_INSTANCE_ID and GREEN_API_TOKEN in environment variables.');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Green API not configured' }),
    };
  }

  // Helper to clean phone numbers for Green API format: 393457905205 (no + or spaces)
  const cleanPhone = (phone: string): string => {
    let cleaned = phone.replace(/[\s\-\+]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '39' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('39') && cleaned.length === 10) {
      cleaned = '39' + cleaned;
    }
    return cleaned;
  };

  // Helper to send a single Green API message
  const sendGreenApiMessage = async (phone: string, msg: string) => {
    const greenApiUrl = `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_TOKEN}`;
    const response = await fetch(greenApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: `${phone}@c.us`, message: msg }),
    });
    const result = await response.json();
    if (!response.ok || result.error) {
      throw new Error(result.error || 'Green API error');
    }
    return result;
  };

  let message = '';
  let targetPhone = cleanPhone(customPhone || NOTIFICATION_PHONE);

  // Handle custom message (for birthdays, marketing, etc.)
  if (customMessage) {
    message = customMessage;
  }
  // Handle booking notifications
  else if (booking) {
    const serviceType = booking.service_type;
    const customerName = booking.customer_name || booking.booking_details?.customer?.fullName || 'Cliente';
    const customerEmail = booking.customer_email || booking.booking_details?.customer?.email;
    const customerPhone = booking.customer_phone || booking.booking_details?.customer?.phone;
    const bookingId = booking.id.substring(0, 8).toUpperCase();
    const totalPrice = (booking.price_total / 100).toFixed(2);

    if (serviceType === 'car_wash') {
      // Car Wash Booking
      const appointmentDate = new Date(booking.appointment_date);
      const serviceName = booking.service_name;
      const vehiclePlate = booking.booking_details?.customerVehicle?.plate || booking.vehicle_plate || '';
      const firstName = customerName.split(' ')[0];

      const formattedDate = appointmentDate.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Rome'
      });
      const formattedTime = booking.appointment_time || appointmentDate.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Rome'
      });

      const paymentDisplay = (booking.payment_status === 'paid' || booking.payment_status === 'succeeded' || booking.payment_status === 'completed') ? 'Pagato' : 'Da saldare';

      // Customer-facing message via Green API — plain text, no bold
      let customerMessage = `Salve ${sanitizeForWhatsApp(firstName)},\n\n`;
      customerMessage += `Confermiamo il suo appuntamento.\n\n`;
      customerMessage += `NUOVA PRENOTAZIONE AUTOLAVAGGIO\n\n`;
      customerMessage += `ID: DR7-${bookingId}\n`;
      customerMessage += `Servizio: ${sanitizeForWhatsApp(serviceName)}\n`;
      if (vehiclePlate) {
        customerMessage += `Targa:${sanitizeForWhatsApp(vehiclePlate)}\n`;
      }
      customerMessage += `Data e Ora: ${formattedDate} alle ${formattedTime}\n`;
      customerMessage += `Totale: €${totalPrice}\n`;
      customerMessage += `Pagamento: ${paymentDisplay}\n\n`;
      customerMessage += `Cordiali Saluti,\nDR7`;

      // Send to customer if phone is available
      if (customerPhone) {
        try {
          const custPhone = cleanPhone(customerPhone);
          await sendGreenApiMessage(custPhone, customerMessage);
          console.log('Car wash confirmation sent to customer:', custPhone);
        } catch (custErr: any) {
          console.error('Failed to send car wash confirmation to customer:', custErr.message);
        }
      }

      // Office notification with full details
      message = `*NUOVA PRENOTAZIONE AUTOLAVAGGIO*\n\n`;
      message += `*ID:* DR7-${bookingId}\n`;
      message += `*Cliente:* ${sanitizeForWhatsApp(customerName)}\n`;
      message += `*Email:* ${sanitizeForWhatsApp(customerEmail)}\n`;
      message += `*Telefono:* ${sanitizeForWhatsApp(customerPhone)}\n`;
      message += `*Servizio:* ${sanitizeForWhatsApp(serviceName)}\n`;
      if (vehiclePlate) {
        message += `*Targa:* ${sanitizeForWhatsApp(vehiclePlate)}\n`;
      }
      message += `*Data e Ora:* ${formattedDate} alle ${formattedTime}\n`;
      message += `*Totale:* €${totalPrice}\n`;
      message += `*Pagamento:* ${paymentDisplay}`;
    } else if (serviceType === 'mechanical') {
      // Mechanical Booking
      const appointmentDate = new Date(booking.appointment_date);
      const serviceName = booking.service_name || 'Servizio Meccanica';
      const vehicleInfo = booking.booking_details?.vehicle || {};
      const notes = booking.booking_details?.notes;

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

      message = `*NUOVA PRENOTAZIONE MECCANICA*\n\n`;
      message += `*ID:* DR7-${bookingId}\n`;
      message += `*Cliente:* ${sanitizeForWhatsApp(customerName)}\n`;
      message += `*Email:* ${sanitizeForWhatsApp(customerEmail)}\n`;
      message += `*Telefono:* ${sanitizeForWhatsApp(customerPhone)}\n`;
      message += `*Servizio:* ${sanitizeForWhatsApp(serviceName)}\n`;
      if (vehicleInfo.brand || vehicleInfo.model) {
        message += `*Veicolo:* ${sanitizeForWhatsApp(vehicleInfo.brand)} ${sanitizeForWhatsApp(vehicleInfo.model)}\n`;
      }
      message += `*Data e Ora:* ${formattedDate} alle ${formattedTime}\n`;
      if (notes) {
        message += `*Note:* ${sanitizeForWhatsApp(notes)}\n`;
      }
      message += `*Stato Pagamento:* ${(booking.payment_status === 'paid' || booking.payment_status === 'succeeded' || booking.payment_status === 'completed') ? 'Pagato' : 'In attesa'}`;

      // Second driver info
      const secondDriver = booking.booking_details?.secondDriver;
      if (secondDriver) {
        message += `\n\n*SECONDO GUIDATORE*\n`;
        message += `*Nome:* ${sanitizeForWhatsApp(secondDriver.firstName)} ${sanitizeForWhatsApp(secondDriver.lastName)}\n`;
        message += `*Email:* ${sanitizeForWhatsApp(secondDriver.email)}\n`;
        message += `*Telefono:* ${sanitizeForWhatsApp(secondDriver.phone)}\n`;
        message += `*Patente:* ${sanitizeForWhatsApp(secondDriver.licenseNumber) || 'N/A'}`;
        if (secondDriver.licenseExpiryDate) {
          message += ` (scad. ${secondDriver.licenseExpiryDate})`;
        }
        if (secondDriver.countryOfIssue) {
          message += `\n*Paese Rilascio:* ${sanitizeForWhatsApp(secondDriver.countryOfIssue)}`;
        }
      }
    } else {
      // Car Rental Booking
      const vehicleName = booking.vehicle_name;
      const pickupDate = new Date(booking.pickup_date);
      const dropoffDate = new Date(booking.dropoff_date);
      const pickupLocation = booking.pickup_location;
      const insuranceRaw = booking.insurance_option || booking.booking_details?.insuranceOption || 'KASKO';
      const insuranceMap: Record<string, string> = {
        'RCA': 'Kasko',
        'KASKO_BASE': 'Kasko',
        'KASKO': 'Kasko',
        'KASKO_BLACK': 'Kasko Black',
        'KASKO_SIGNATURE': 'Kasko Signature',
        'DR7': 'Kasko DR7'
      };
      const insuranceOption = insuranceMap[insuranceRaw] || 'Kasko';

      const pickupDateFormatted = pickupDate.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
      const pickupTimeFormatted = pickupDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
      const dropoffDateFormatted = dropoffDate.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
      const dropoffTimeFormatted = dropoffDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });

      message = `*NUOVA PRENOTAZIONE NOLEGGIO*\n\n`;
      message += `*ID:* DR7-${bookingId}\n`;
      message += `*Cliente:* ${sanitizeForWhatsApp(customerName)}\n`;
      message += `*Email:* ${sanitizeForWhatsApp(customerEmail)}\n`;
      message += `*Telefono:* ${sanitizeForWhatsApp(customerPhone)}\n`;
      message += `*Veicolo:* ${sanitizeForWhatsApp(vehicleName)}\n`;
      message += `*Ritiro:* ${pickupDateFormatted} alle ${pickupTimeFormatted}\n`;
      message += `*Riconsegna:* ${dropoffDateFormatted} alle ${dropoffTimeFormatted}\n`;
      message += `*Luogo Ritiro:* ${sanitizeForWhatsApp(pickupLocation)}\n`;
      message += `*Assicurazione:* ${insuranceOption}\n`;
      message += `*Totale:* €${totalPrice}\n`;

      // Cauzione (deposit) info
      const depositAmount = booking.deposit_amount || booking.booking_details?.deposit || 0;
      const depositOption = booking.booking_details?.depositOption;
      if (depositOption === 'no_deposit') {
        const surcharge = booking.booking_details?.noDepositSurcharge || 0;
        message += `*Cauzione:* Senza cauzione (+30% = €${surcharge.toFixed(2)})\n`;
      } else if (depositAmount > 0) {
        message += `*Cauzione:* €${depositAmount}\n`;
      }

      // Second driver info
      const secondDriver = booking.booking_details?.secondDriver;
      if (secondDriver) {
        message += `\n*SECONDO CONDUCENTE:*\n`;
        message += `*Nome:* ${secondDriver.fullName || `${secondDriver.firstName} ${secondDriver.lastName}`}\n`;
        if (secondDriver.phone) message += `*Telefono:* ${secondDriver.phone}\n`;
        if (secondDriver.licenseNumber) message += `*Patente:* ${secondDriver.licenseNumber}\n`;
      }

      message += `*Stato Pagamento:* ${(booking.payment_status === 'paid' || booking.payment_status === 'succeeded') ? 'Pagato' : 'In attesa'}`;
    }
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'No booking or custom message provided' }),
    };
  }

  try {
    const result = await sendGreenApiMessage(targetPhone, message);
    console.log('WhatsApp notification sent via Green API:', result.idMessage);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'WhatsApp notification sent via Green API',
        success: true,
        messageId: result.idMessage
      }),
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
