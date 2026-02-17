const { createClient } = require('@supabase/supabase-js');

/**
 * Scheduled function — runs every 30 minutes
 * Sends 3 types of WhatsApp reminders:
 *
 * 1. SUPERCAR day-before: promo continuation offer
 * 2. UTILITARIA day-before: extension offer with discount
 * 3. DEPOSIT return (60 min after rental ends): IBAN request for refund
 */
exports.handler = async (event) => {
  console.log('=== Booking Reminders Started ===');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return { statusCode: 500, body: 'Server configuration error' };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const greenInstanceId = process.env.GREEN_API_INSTANCE_ID;
  const greenToken = process.env.GREEN_API_TOKEN;

  if (!greenInstanceId || !greenToken) {
    console.error('Missing GREEN_API_INSTANCE_ID or GREEN_API_TOKEN');
    return { statusCode: 500, body: 'WhatsApp not configured' };
  }

  const now = new Date();
  let sent = 0;
  let failed = 0;

  // ──────────────────────────────────────────────
  // Load message templates from system_messages table
  // (editable from Admin CRM → Marketing → Messaggi di Sistema)
  // ──────────────────────────────────────────────
  const messageTemplates = {};
  try {
    const { data: templates } = await supabase
      .from('system_messages')
      .select('message_key, message_body');

    if (templates) {
      templates.forEach(t => { messageTemplates[t.message_key] = t.message_body; });
      console.log(`Loaded ${templates.length} message template(s) from database`);
    }
  } catch (err) {
    console.warn('Could not load system_messages, using defaults:', err.message);
  }

  // Fallback defaults if table doesn't exist yet
  const getTemplate = (key, fallback) => messageTemplates[key] || fallback;

  // ──────────────────────────────────────────────
  // 1 & 2. DAY-BEFORE REMINDERS (supercar + utilitaria)
  // Find bookings where dropoff_date is tomorrow (Italy time)
  // ──────────────────────────────────────────────
  try {
    // Get tomorrow's date in Italy timezone
    const italyFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayItaly = italyFormatter.format(now);
    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowItaly = italyFormatter.format(tomorrowDate);

    console.log(`Italy today: ${todayItaly}, tomorrow: ${tomorrowItaly}`);

    // Query confirmed/active car rental bookings ending tomorrow
    const { data: endingTomorrow, error: dayBeforeError } = await supabase
      .from('bookings')
      .select('*')
      .gte('dropoff_date', `${tomorrowItaly}T00:00:00`)
      .lt('dropoff_date', `${tomorrowItaly}T23:59:59`)
      .in('status', ['confirmed', 'active'])
      .is('service_type', null); // Car rentals have null service_type

    if (dayBeforeError) {
      console.error('Error querying day-before bookings:', dayBeforeError);
    } else if (endingTomorrow && endingTomorrow.length > 0) {
      console.log(`Found ${endingTomorrow.length} booking(s) ending tomorrow`);

      for (const booking of endingTomorrow) {
        try {
          // Skip if already notified
          if (booking.booking_details?.day_before_reminder_sent) {
            console.log(`Skipping booking ${booking.id} — day-before already sent`);
            continue;
          }

          const firstName = booking.booking_details?.customer?.firstName
            || booking.customer_name?.split(' ')[0]
            || 'Cliente';
          const phone = booking.customer_phone;
          const vehicleType = (booking.vehicle_type || '').toUpperCase();

          if (!phone) {
            console.log(`Skipping booking ${booking.id} — no phone number`);
            continue;
          }

          let message = '';

          if (vehicleType === 'SUPERCAR') {
            const template = getTemplate('supercar_day_before',
              `Buongiorno {nome},\n\nVorrebbe valutare una promo in continuazione super vantaggiosa?\n\nCordiali saluti,\nDR7`);
            message = template.replace(/\{nome\}/g, firstName);
          } else if (['UTILITARIA', 'FURGONE', 'V_CLASS'].includes(vehicleType)) {
            const template = getTemplate('utilitaria_day_before',
              `Buongiorno {nome},\n\nLa contattiamo per informarla che, qualora avesse necessità di prolungare il noleggio, restiamo a disposizione per verificarne la disponibilità.\n\nIn caso di estensione, possiamo riservarle uno sconto dedicato sul periodo aggiuntivo.\n\nQualora lo desiderasse, le chiediamo gentilmente di indicarci per quanto tempo intende eventualmente prolungare, così da poter valutare la soluzione più conveniente.\n\nCordiali saluti,\nDR7`);
            message = template.replace(/\{nome\}/g, firstName);
          } else {
            console.log(`Skipping booking ${booking.id} — unknown vehicle type: ${vehicleType}`);
            continue;
          }

          const success = await sendWhatsApp(greenInstanceId, greenToken, phone, message);

          if (success) {
            // Mark as sent in booking_details
            const updatedDetails = {
              ...(booking.booking_details || {}),
              day_before_reminder_sent: true,
              day_before_reminder_sent_at: now.toISOString(),
            };

            await supabase
              .from('bookings')
              .update({ booking_details: updatedDetails })
              .eq('id', booking.id);

            console.log(`Day-before reminder sent for booking ${booking.id} (${vehicleType})`);
            sent++;
          } else {
            failed++;
          }
        } catch (err) {
          console.error(`Error processing day-before for booking ${booking.id}:`, err.message);
          failed++;
        }
      }
    } else {
      console.log('No bookings ending tomorrow');
    }
  } catch (err) {
    console.error('Day-before reminders error:', err.message);
  }

  // ──────────────────────────────────────────────
  // 3. DEPOSIT RETURN REMINDER (60 min after rental ends)
  // Only for customers who left a deposit (cauzione)
  // ──────────────────────────────────────────────
  try {
    const sixtyMinAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find bookings that ended between 24h ago and 60min ago, with deposit
    const { data: depositBookings, error: depositError } = await supabase
      .from('bookings')
      .select('*')
      .gte('dropoff_date', twentyFourHoursAgo.toISOString())
      .lte('dropoff_date', sixtyMinAgo.toISOString())
      .in('status', ['confirmed', 'active', 'completed'])
      .gt('deposit_amount', 0)
      .is('service_type', null); // Car rentals only

    if (depositError) {
      console.error('Error querying deposit bookings:', depositError);
    } else if (depositBookings && depositBookings.length > 0) {
      console.log(`Found ${depositBookings.length} deposit booking(s) eligible for IBAN reminder`);

      for (const booking of depositBookings) {
        try {
          // Skip if already notified
          if (booking.booking_details?.deposit_reminder_sent) {
            console.log(`Skipping booking ${booking.id} — deposit reminder already sent`);
            continue;
          }

          const firstName = booking.booking_details?.customer?.firstName
            || booking.customer_name?.split(' ')[0]
            || 'Cliente';
          const phone = booking.customer_phone;

          if (!phone) {
            console.log(`Skipping booking ${booking.id} — no phone number`);
            continue;
          }

          const template = getTemplate('deposit_return_iban',
            `Buongiorno {nome},\n\nLa ringraziamo per aver scelto i nostri servizi.\n\nAl fine di procedere con la restituzione della cauzione, Le chiediamo cortesemente di comunicarci il Suo IBAN completo e il nominativo dell'intestatario del conto.\n\nIl rimborso verrà effettuato tramite bonifico ordinario entro il quattordicesimo giorno lavorativo, come da condizioni contrattuali.\n\nCordiali saluti,\nDR7`);
          const message = template.replace(/\{nome\}/g, firstName);

          const success = await sendWhatsApp(greenInstanceId, greenToken, phone, message);

          if (success) {
            const updatedDetails = {
              ...(booking.booking_details || {}),
              deposit_reminder_sent: true,
              deposit_reminder_sent_at: now.toISOString(),
            };

            await supabase
              .from('bookings')
              .update({ booking_details: updatedDetails })
              .eq('id', booking.id);

            console.log(`Deposit IBAN reminder sent for booking ${booking.id}`);
            sent++;
          } else {
            failed++;
          }
        } catch (err) {
          console.error(`Error processing deposit reminder for booking ${booking.id}:`, err.message);
          failed++;
        }
      }
    } else {
      console.log('No deposit bookings eligible for IBAN reminder');
    }
  } catch (err) {
    console.error('Deposit reminders error:', err.message);
  }

  console.log(`=== Booking Reminders Complete: ${sent} sent, ${failed} failed ===`);
  return { statusCode: 200, body: `Reminders sent: ${sent}, failed: ${failed}` };
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/**
 * Clean phone number for Green API format: 39XXXXXXXXXX
 */
function cleanPhone(phone) {
  if (!phone) return null;
  let clean = phone.replace(/[\s\-\+\(\)]/g, '');
  if (clean.startsWith('0')) {
    clean = '39' + clean.substring(1);
  }
  if (!clean.startsWith('39') && clean.length === 10) {
    clean = '39' + clean;
  }
  return clean;
}

/**
 * Send WhatsApp message via Green API
 */
async function sendWhatsApp(instanceId, token, phone, message) {
  const cleanNum = cleanPhone(phone);
  if (!cleanNum) {
    console.warn('Invalid phone number:', phone);
    return false;
  }

  try {
    const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: `${cleanNum}@c.us`,
        message: message,
      }),
    });

    if (response.ok) {
      return true;
    } else {
      const text = await response.text();
      console.error(`WhatsApp send failed for ${cleanNum}:`, text);
      return false;
    }
  } catch (err) {
    console.error(`WhatsApp error for ${cleanNum}:`, err.message);
    return false;
  }
}
