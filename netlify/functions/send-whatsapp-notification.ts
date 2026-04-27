import type { Handler } from "@netlify/functions";
import { renderTemplate, resolveKeyForContext } from './utils/messageTemplates';
import { getInsuranceNameById } from './utils/centralinaProLookups';
import { formatLocation } from './utils/formatLocation';

const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID;
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;
const NOTIFICATION_PHONE = process.env.NOTIFICATION_PHONE || "393457905205";

// Return "Illimitati" whenever the booking is flagged unlimited OR the stored km count
// is the sentinel 9999 (≥). Otherwise the numeric km count. Never show "9999".
function formatKmInfo(booking: { booking_details?: Record<string, unknown> }): string {
  const bd = (booking.booking_details || {}) as Record<string, unknown>;
  const kmPkg = (bd.kmPackage || {}) as Record<string, unknown>;
  const unlimited =
    bd.unlimited_km === true
    || bd.unlimited_km === 'true'
    || bd.km_limit === 'Illimitati'
    || kmPkg.type === 'unlimited'
    || kmPkg.distance === 'unlimited';
  const rawIncluded = Number(kmPkg.includedKm ?? bd.km_limit ?? 0);
  if (unlimited || rawIncluded >= 9999) return 'Illimitati';
  return rawIncluded > 0 ? `${rawIncluded} km` : 'Illimitati';
}

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
 *   { templateKey: string, templateVars?: Record<string,string>, customPhone: string }
 */
const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }
  if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
    console.error('Green API not configured.');
    return { statusCode: 500, body: JSON.stringify({ message: 'Green API not configured' }) };
  }

  const { booking, customMessage, customPhone, skipHeader, templateKey, templateVars } = JSON.parse(event.body || '{}');

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
  } else if (templateKey) {
    // Explicit legacy key → resolved to Pro → rendered with templateVars.
    // Caller passes keys like '{nome}' (with braces) OR bare 'nome'.
    const resolvedKey = await resolveKeyForContext(String(templateKey));
    if (resolvedKey === null) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, skipped: true, reason: 'pro_template_unavailable', key: templateKey }),
      };
    }
    // Normalize var keys: renderTemplate uses {var} syntax; strip braces if the caller sent them.
    const vars: Record<string, string> = {};
    if (templateVars && typeof templateVars === 'object') {
      for (const [k, v] of Object.entries(templateVars as Record<string, unknown>)) {
        const cleanKey = k.replace(/^\{|\}$/g, '');
        vars[cleanKey] = v == null ? '' : String(v);
      }
    }
    message = await renderTemplate(resolvedKey, vars);
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
      cliente: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      booking_id: bookingId,
      total: totalPrice,
      totale: totalPrice,
      importo: totalPrice,
      amount: totalPrice,
      notes,
      note: notes,
      nota: notes,
      payment_status: paymentLabel,
      payment_method: booking.payment_method || '',
      // Italian aliases — Pro / system templates often use {payment_info}
      // and {pagamento}; without these the literal placeholder leaks into
      // the customer's WhatsApp message (visible bug: "Pagamento: {payment_info}").
      payment_info: paymentLabel,
      pagamento: paymentLabel,
    };

    if (serviceType === 'car_wash') {
      const appt = booking.appointment_date ? new Date(booking.appointment_date) : null;
      const plateValue: string = booking.vehicle_plate || booking.booking_details?.customerVehicle?.plate || booking.booking_details?.plate || booking.booking_details?.targa || '';
      const flexInfo: string = booking.booking_details?.prime_flex ? 'Prime Flex' : booking.booking_details?.dr7_flex ? 'DR7 Flex' : '';
      const baseService: string = booking.service_name || '';
      const composedService = flexInfo ? `${baseService} + ${flexInfo}` : baseService;
      const apptDateShort = appt ? appt.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' }) : '';
      const apptDateLong = appt ? appt.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' }) : '';
      const apptTime = appt ? appt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }) : '';
      Object.assign(vars, {
        service_name: composedService,
        servizio: composedService,
        plate: plateValue,
        targa: plateValue,
        date: apptDateShort,
        data: apptDateShort,
        data_lunga: apptDateLong,
        time: apptTime,
        ora: apptTime,
        appointment_date: apptDateShort,
        appointment_time: apptTime,
        pickup_date: apptDateShort,
        pickup_time: apptTime,
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
        pickup_location: formatLocation(booking.pickup_location),
        dropoff_location: formatLocation(booking.dropoff_location),
        insurance: await getInsuranceNameById(booking.insurance_option || booking.booking_details?.insuranceOption || ''),
        deposit: depositStr,
        km_info: formatKmInfo(booking),
        flex: booking.booking_details?.dr7_flex || booking.booking_details?.dr7Flex ? 'DR7 Flex' : '',
      });
    }

    message = await renderTemplate(resolvedKey, vars, undefined, { vehiclePlate: booking.vehicle_plate });
  } else {
    return { statusCode: 400, body: JSON.stringify({ message: 'No booking or custom message provided' }) };
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
