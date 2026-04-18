import type { Handler } from "@netlify/functions";
import { renderTemplate, resolveKeyForContext } from './utils/messageTemplates';

const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID;
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;
const NOTIFICATION_PHONE = process.env.NOTIFICATION_PHONE || "393457905205";

/**
 * Sends a WhatsApp notification via Green API.
 *
 * ZERO HARDCODED MESSAGE BODIES.
 * Every body comes from Messaggi di Sistema Pro (table `system_messages`,
 * keys prefixed `pro_*`). Legacy keys (rental_new_customer, carwash_new, …)
 * are resolved to their Pro equivalent by `resolveKeyForContext`. If no Pro
 * template is mapped OR the template is disabled/empty, we skip the send.
 *
 * Accepted payload shapes:
 *   { booking: {...}, customPhone?: string, skipHeader?: boolean }
 *   { customMessage: string, customPhone: string }
 *   { ticket: {...}, type?: 'ticket' }   // no Pro slot yet → skips
 */
const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }
  if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
    console.error('Green API not configured.');
    return { statusCode: 500, body: JSON.stringify({ message: 'Green API not configured' }) };
  }

  const { booking, ticket, type, customMessage, customPhone, skipHeader } = JSON.parse(event.body || '{}');

  // ── Target phone ──
  let targetPhone: string = String(customPhone || NOTIFICATION_PHONE).replace(/[\s\-+]/g, '');
  if (targetPhone.startsWith('0')) targetPhone = '39' + targetPhone.substring(1);
  if (!targetPhone.startsWith('39') && targetPhone.length === 10) targetPhone = '39' + targetPhone;

  const isCustomerMessage = !!customPhone;

  // ── Build the message ──
  let message: string | null = null;

  if (customMessage) {
    // Admin-authored free text — already composed upstream.
    message = customMessage;
  } else if (booking) {
    const serviceType = booking.service_type as string | undefined;
    const legacyKey =
      serviceType === 'car_wash' ? (isCustomerMessage ? 'carwash_new_customer' : 'carwash_new_admin') :
      serviceType === 'mechanical' || serviceType === 'mechanical_service' ? (isCustomerMessage ? 'mechanical_new_customer' : 'mechanical_new_admin') :
      (isCustomerMessage ? 'rental_new_customer' : 'rental_new_admin');

    const resolvedKey = await resolveKeyForContext(legacyKey);
    if (resolvedKey === null) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, skipped: true, reason: 'pro_template_unavailable', key: legacyKey }),
      };
    }

    // Build template variables from the booking
    const customerName: string = booking.customer_name || booking.booking_details?.customer?.fullName || 'Cliente';
    const customerEmail: string = booking.customer_email || booking.booking_details?.customer?.email || '';
    const customerPhone: string = booking.customer_phone || booking.booking_details?.customer?.phone || '';
    const bookingId: string = (booking.id || '').substring(0, 8).toUpperCase();
    const totalPrice: string = booking.price_total != null ? (Number(booking.price_total) / 100).toFixed(2) : '';
    const notes: string = booking.booking_details?.notes || '';
    const paymentLabel: string =
      booking.payment_method === 'credit_wallet' || booking.payment_method === 'credit' ? 'Credit Wallet' :
      booking.payment_method === 'nexi' || booking.payment_method === 'Nexi Pay by Link' ? 'Carta' :
      (booking.payment_status === 'paid' || booking.payment_status === 'succeeded' || booking.payment_status === 'completed') ? 'Pagato' : 'Da saldare';

    const vars: Record<string, string> = {
      nome: customerName.split(' ')[0] || customerName,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      booking_id: bookingId,
      total: totalPrice,
      notes,
      payment_status: paymentLabel,
      payment_method: booking.payment_method || '',
    };

    if (serviceType === 'car_wash') {
      const appt = booking.appointment_date ? new Date(booking.appointment_date) : null;
      const plateValue: string = booking.vehicle_plate || booking.booking_details?.customerVehicle?.plate || booking.booking_details?.plate || booking.booking_details?.targa || '';
      const flexInfo: string = booking.booking_details?.prime_flex ? 'Prime Flex' : booking.booking_details?.dr7_flex ? 'DR7 Flex' : '';
      const baseService: string = booking.service_name || '';
      Object.assign(vars, {
        service_name: flexInfo ? `${baseService} + ${flexInfo}` : baseService,
        plate: plateValue,
        targa: plateValue,
        date: appt ? appt.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' }) : '',
        time: appt ? appt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }) : '',
        pickup_date: appt ? appt.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' }) : '',
        pickup_time: appt ? appt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }) : '',
        extras: booking.booking_details?.additionalService || '',
        flex: flexInfo,
      });
    } else if (serviceType === 'mechanical' || serviceType === 'mechanical_service') {
      const appt = booking.appointment_date ? new Date(booking.appointment_date) : null;
      Object.assign(vars, {
        service_name: booking.service_name || '',
        pickup_date: appt ? appt.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' }) : '',
        pickup_time: appt ? appt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }) : '',
      });
    } else {
      // Rental
      const pickup = booking.pickup_date ? new Date(booking.pickup_date) : null;
      const dropoff = booking.dropoff_date ? new Date(booking.dropoff_date) : null;
      const depositAmount = Number(booking.deposit_amount || booking.booking_details?.deposit || 0);
      const depositOption = booking.booking_details?.depositOption;
      let depositStr = '';
      if (depositOption === 'no_deposit') {
        const sur = Number(booking.booking_details?.noDepositSurcharge || 0);
        depositStr = `Senza cauzione (+€${sur.toFixed(2)})`;
      } else if (depositAmount > 0) {
        depositStr = `€${depositAmount}`;
      }
      Object.assign(vars, {
        vehicle_name: booking.vehicle_name || '',
        plate: booking.vehicle_plate || '',
        pickup_date: pickup ? pickup.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' }) : '',
        pickup_time: pickup ? pickup.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }) : '',
        dropoff_date: dropoff ? dropoff.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' }) : '',
        dropoff_time: dropoff ? dropoff.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }) : '',
        pickup_location: booking.pickup_location || '',
        insurance: booking.insurance_option || booking.booking_details?.insuranceOption || '',
        deposit: depositStr,
        km_info: booking.booking_details?.unlimited_km ? 'Illimitati' : String(booking.booking_details?.kmPackage?.includedKm || ''),
        flex: booking.booking_details?.dr7_flex || booking.booking_details?.dr7Flex ? 'DR7 Flex' : '',
      });
    }

    message = await renderTemplate(resolvedKey, vars, undefined, { vehiclePlate: booking.vehicle_plate });
  } else if (ticket || type === 'ticket') {
    // No Pro slot for lottery ticket sales yet. Skip rather than hardcode.
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, skipped: true, reason: 'no_pro_template_for_ticket' }),
    };
  } else {
    return { statusCode: 400, body: JSON.stringify({ message: 'No booking, ticket, or custom message provided' }) };
  }

  if (!message || !message.trim()) {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, skipped: true, reason: 'empty_body_no_template' }),
    };
  }

  // skipHeader is handled by the Pro wrapper logic inside messageTemplates
  // (the template's own `include_header` flag decides). Retained as a no-op
  // hint in the payload for legacy callers.
  void skipHeader;

  try {
    const greenApiUrl = `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_TOKEN}`;
    const response = await fetch(greenApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: `${targetPhone}@c.us`, message }),
    });
    const result = await response.json();
    if (!response.ok || result.error) {
      console.error('Green API error:', result);
      throw new Error(result.error || 'Green API error');
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'WhatsApp notification sent via Green API', success: true, messageId: result.idMessage }),
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp notification:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Error sending WhatsApp notification', error: error.message }) };
  }
};

export { handler };
