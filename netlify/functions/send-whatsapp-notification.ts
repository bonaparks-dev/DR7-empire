import type { Handler } from "@netlify/functions";
import { createClient } from '@supabase/supabase-js';

const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID;
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;
const NOTIFICATION_PHONE = process.env.NOTIFICATION_PHONE || "393457905205";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

  const { booking, ticket, type, customMessage, customPhone } = JSON.parse(event.body || '{}');

  // Check if Green API is configured
  if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
    console.error('Green API not configured. Set GREEN_API_INSTANCE_ID and GREEN_API_TOKEN in environment variables.');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Green API not configured' }),
    };
  }

  let message = '';
  let targetPhone = customPhone || NOTIFICATION_PHONE;

  // Clean phone number - Green API format: 393457905205 (no + or spaces)
  targetPhone = targetPhone.replace(/[\s\-\+]/g, '');
  if (targetPhone.startsWith('0')) {
    targetPhone = '39' + targetPhone.substring(1);
  }
  if (!targetPhone.startsWith('39') && targetPhone.length === 10) {
    targetPhone = '39' + targetPhone;
  }

  // Load templates from system_messages
  let templateMap = new Map<string, string>();
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data: tpls } = await sb
        .from('system_messages')
        .select('message_key, message_body, is_enabled')
        .eq('is_enabled', true);
      if (tpls) {
        tpls.forEach((t: any) => templateMap.set(t.message_key, t.message_body));
      }
    } catch (e) {
      console.warn('Failed to load system_messages templates:', e);
    }
  }

  const applyVars = (tpl: string, vars: Record<string, string>) => {
    let result = tpl;
    for (const [key, val] of Object.entries(vars)) {
      result = result.split(key).join(val);
    }
    return result;
  };

  // Handle custom message (for birthdays, marketing, etc.)
  if (customMessage) {
    message = customMessage;
  }
  // Handle ticket purchase notifications
  else if (ticket || type === 'ticket') {
    const ticketData = ticket || {};
    const customerName = ticketData.customer_name || ticketData.name || 'Cliente';
    const customerEmail = ticketData.customer_email || ticketData.email;
    const customerPhone = ticketData.customer_phone || ticketData.phone;
    const ticketQuantity = ticketData.quantity || 1;
    const totalPrice = ticketData.total_price ? (ticketData.total_price / 100).toFixed(2) : 'N/A';
    const ticketNumbers = ticketData.ticket_numbers || [];

    message = `🎟️ *NUOVA VENDITA BIGLIETTI*\n\n`;
    message += `*Cliente:* ${customerName}\n`;
    message += `*Email:* ${customerEmail}\n`;
    if (customerPhone) {
      message += `*Telefono:* ${customerPhone}\n`;
    }
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
    const customerName = booking.customer_name || booking.booking_details?.customer?.fullName || 'Cliente';
    const customerEmail = booking.customer_email || booking.booking_details?.customer?.email;
    const customerPhone = booking.customer_phone || booking.booking_details?.customer?.phone;
    const bookingId = booking.id.substring(0, 8).toUpperCase();
    const totalPrice = (booking.price_total / 100).toFixed(2);

    if (serviceType === 'car_wash') {
      // Car Wash Booking
      const appointmentDate = new Date(booking.appointment_date);
      const serviceName = booking.service_name;
      const additionalService = booking.booking_details?.additionalService;
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
      message += `*Stato Pagamento:* ${(booking.payment_status === 'paid' || booking.payment_status === 'succeeded') ? '✅ Pagato' : '⏳ In attesa'}`;

      // Override with DB template if available
      const cwTpl = templateMap.get('carwash_new');
      if (cwTpl) {
        const plateValue = booking.vehicle_plate || booking.booking_details?.plate || booking.booking_details?.targa || '';
        message = applyVars(cwTpl, {
          '{booking_id}': bookingId.substring(0, 8).toUpperCase(),
          '{nome}': customerName.split(' ')[0] || customerName,
          '{customer_name}': customerName, '{customer_email}': customerEmail || '',
          '{customer_phone}': customerPhone || '', '{service_name}': serviceName || '',
          '{plate}': plateValue, '{targa}': plateValue,
          '{date}': formattedDate, '{time}': formattedTime,
          '{pickup_date}': formattedDate, '{pickup_time}': formattedTime,
          '{extras}': additionalService || 'Nessuno',
          '{total}': totalPrice, '{notes}': booking.booking_details?.notes || '',
          '{payment_status}': (booking.payment_status === 'paid' || booking.payment_status === 'succeeded') ? '✅ Pagato' : '⏳ In attesa',
        });
      }
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

      message = `🔧 *NUOVA PRENOTAZIONE MECCANICA*\n\n`;
      message += `*ID:* DR7-${bookingId}\n`;
      message += `*Cliente:* ${customerName}\n`;
      message += `*Email:* ${customerEmail}\n`;
      message += `*Telefono:* ${customerPhone}\n`;
      message += `*Servizio:* ${serviceName}\n`;
      if (vehicleInfo.brand || vehicleInfo.model) {
        message += `*Veicolo:* ${vehicleInfo.brand || ''} ${vehicleInfo.model || ''}\n`;
      }
      message += `*Data e Ora:* ${formattedDate} alle ${formattedTime}\n`;
      if (notes) {
        message += `*Note:* ${notes}\n`;
      }
      message += `*Stato Pagamento:* ${(booking.payment_status === 'paid' || booking.payment_status === 'succeeded') ? '✅ Pagato' : '⏳ In attesa'}`;

      // Override with DB template if available
      const mechTpl = templateMap.get('mechanical_new');
      if (mechTpl) {
        message = applyVars(mechTpl, {
          '{booking_id}': `DR7-${bookingId}`, '{customer_name}': customerName, '{customer_email}': customerEmail || '',
          '{customer_phone}': customerPhone || '', '{service_name}': serviceName || '', '{pickup_date}': formattedDate,
          '{pickup_time}': formattedTime, '{total}': totalPrice, '{notes}': booking.booking_details?.notes || '',
          '{payment_status}': (booking.payment_status === 'paid' || booking.payment_status === 'succeeded') ? '✅ Pagato' : '⏳ In attesa',
        });
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
        message += `\n👤 *SECONDO CONDUCENTE:*\n`;
        message += `*Nome:* ${secondDriver.fullName || `${secondDriver.firstName} ${secondDriver.lastName}`}\n`;
        if (secondDriver.phone) message += `*Telefono:* ${secondDriver.phone}\n`;
        if (secondDriver.licenseNumber) message += `*Patente:* ${secondDriver.licenseNumber}\n`;
      }

      message += `*Stato Pagamento:* ${(booking.payment_status === 'paid' || booking.payment_status === 'succeeded') ? '✅ Pagato' : '⏳ In attesa'}`;

      // Override with DB template if available
      const rentalTpl = templateMap.get('rental_new');
      if (rentalTpl) {
        const depositAmount = booking.deposit_amount || booking.booking_details?.deposit || 0;
        const depositOption = booking.booking_details?.depositOption;
        let depositStr = '';
        if (depositOption === 'no_deposit') {
          depositStr = `Senza cauzione (+30% = €${(booking.booking_details?.noDepositSurcharge || 0).toFixed(2)})`;
        } else if (depositAmount > 0) {
          depositStr = `€${depositAmount}`;
        }
        message = applyVars(rentalTpl, {
          '{booking_id}': bookingId.substring(0, 8).toUpperCase(), '{customer_name}': customerName, '{customer_email}': customerEmail || '',
          '{customer_phone}': customerPhone || '', '{vehicle_name}': vehicleName, '{plate}': booking.vehicle_plate || '',
          '{pickup_date}': pickupDateFormatted, '{pickup_time}': pickupTimeFormatted,
          '{dropoff_date}': dropoffDateFormatted, '{dropoff_time}': dropoffTimeFormatted,
          '{pickup_location}': pickupLocation || '', '{insurance}': insuranceOption, '{deposit}': depositStr,
          '{km_info}': booking.booking_details?.unlimited_km ? 'Illimitati' : `${booking.booking_details?.kmPackage?.includedKm || 'Standard'} km`,
          '{total}': totalPrice, '{payment_status}': (booking.payment_status === 'paid' || booking.payment_status === 'succeeded') ? '✅ Pagato' : '⏳ In attesa',
        });
      }
    }
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'No booking, ticket, or custom message provided' }),
    };
  }

  try {
    // Send via Green API
    const greenApiUrl = `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_TOKEN}`;

    const response = await fetch(greenApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: `${targetPhone}@c.us`,
        message: message,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      console.error('Green API error:', result);
      throw new Error(result.error || 'Green API error');
    }

    console.log('✅ WhatsApp notification sent via Green API:', result.idMessage);

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
