const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

// Supabase configuration
const supabaseUrl = 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Google Calendar configuration
const getCalendarClient = () => {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error('Google Calendar credentials not configured');
  }

  console.log('✓ Using Service Account authentication');
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
};

const createCalendarEvent = async (eventDetails) => {
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'dubai.rent7.0srl@gmail.com';

  const event = {
    summary: eventDetails.summary,
    description: eventDetails.description,
    start: {
      dateTime: eventDetails.startDateTime,
      timeZone: 'Europe/Rome',
    },
    end: {
      dateTime: eventDetails.endDateTime,
      timeZone: 'Europe/Rome',
    },
    attendees: [
      { email: eventDetails.customerEmail, displayName: eventDetails.customerName },
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 60 },
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: calendarId,
    requestBody: event,
    sendUpdates: 'all',
  });

  return response.data;
};

const formatCarRentalEvent = (booking) => {
  const vehicleName = booking.vehicle_name;
  const pickupDate = new Date(booking.pickup_date);
  const dropoffDate = new Date(booking.dropoff_date);
  const customerName = booking.customer_name || booking.booking_details?.customer?.fullName || 'Cliente';
  const customerEmail = booking.customer_email || booking.booking_details?.customer?.email;
  const bookingId = booking.id.substring(0, 8).toUpperCase();
  const totalPrice = booking.price_total / 100;
  const currency = booking.currency || 'EUR';
  const vehicleType = booking.vehicle_type || 'car';
  const insuranceOption = booking.insurance_option || booking.booking_details?.insuranceOption || 'Nessuna';

  let servicePrefix = '🚗';
  if (vehicleType === 'exotic' || vehicleType === 'supercar') {
    servicePrefix = '🏎️ EXOTIC SUPERCAR';
  } else if (vehicleType === 'urban') {
    servicePrefix = '🚗 URBAN CAR';
  } else {
    servicePrefix = '🚙 CAR RENTAL';
  }

  return {
    summary: `${servicePrefix} - ${vehicleName} - ${customerName}`,
    description: `
📋 Booking ID: DR7-${bookingId}
👤 Customer: ${customerName}
📧 Email: ${customerEmail}
📞 Phone: ${booking.customer_phone || 'N/A'}
🚗 Vehicle: ${vehicleName}
📍 Pickup Location: ${booking.pickup_location}
🛡️ Insurance: ${insuranceOption}
💰 Total: ${new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(totalPrice)}
💳 Payment: ${booking.payment_method === 'agency' ? 'In sede' : 'Online'}
📝 Status: ${booking.payment_status === 'pending' ? 'In attesa' : 'Completato'}
    `.trim(),
    startDateTime: pickupDate.toISOString(),
    endDateTime: dropoffDate.toISOString(),
    customerEmail,
    customerName,
  };
};

const formatCarWashEvent = (booking) => {
  const appointmentDate = new Date(booking.appointment_date);
  const serviceName = booking.service_name;
  const customerName = booking.customer_name || booking.booking_details?.customer?.fullName || 'Cliente';
  const customerEmail = booking.customer_email || booking.booking_details?.customer?.email;
  const bookingId = booking.id.substring(0, 8).toUpperCase();
  const totalPrice = booking.price_total / 100;
  const currency = booking.currency || 'EUR';
  const additionalService = booking.booking_details?.additionalService;
  const notes = booking.booking_details?.notes;

  const durationHours = Math.ceil(totalPrice / 25);
  const endDate = new Date(appointmentDate);
  endDate.setHours(endDate.getHours() + durationHours);

  return {
    summary: `🚿 LUXURY WASH (${durationHours}h) - ${serviceName} - ${customerName}`,
    description: `
📋 Booking ID: DR7-${bookingId}
👤 Customer: ${customerName}
📧 Email: ${customerEmail}
📞 Phone: ${booking.customer_phone || 'N/A'}
🚿 Service: ${serviceName}
⏱️ Duration: ${durationHours} hour${durationHours > 1 ? 's' : ''}
${additionalService ? `➕ Additional: ${additionalService}` : ''}
💰 Total: ${new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(totalPrice)}
${notes ? `📝 Notes: ${notes}` : ''}

🔒 SLOT BLOCKED: ${appointmentDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
    `.trim(),
    startDateTime: appointmentDate.toISOString(),
    endDateTime: endDate.toISOString(),
    customerEmail,
    customerName,
  };
};

async function syncOldBookings() {
  console.log('🔄 Syncing old bookings to Google Calendar...\n');

  try {
    // Fetch all bookings from Supabase
    console.log('📊 Fetching bookings from database...');
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    console.log(`✓ Found ${bookings.length} total bookings\n`);

    // Filter for future bookings only (optional - remove this line to sync all bookings)
    const today = new Date();
    const futureBookings = bookings.filter(booking => {
      const bookingDate = booking.service_type === 'car_wash'
        ? new Date(booking.appointment_date)
        : new Date(booking.pickup_date);
      return bookingDate >= today;
    });

    console.log(`📅 ${futureBookings.length} future bookings to sync\n`);

    if (futureBookings.length === 0) {
      console.log('✓ No future bookings to sync!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Create calendar events for each booking
    for (const booking of futureBookings) {
      try {
        const serviceType = booking.service_type;
        const bookingId = booking.id.substring(0, 8).toUpperCase();

        console.log(`\n📝 Processing booking DR7-${bookingId} (${serviceType || 'car_rental'})...`);

        const eventDetails = serviceType === 'car_wash'
          ? formatCarWashEvent(booking)
          : formatCarRentalEvent(booking);

        const calendarEvent = await createCalendarEvent(eventDetails);

        console.log(`✅ Calendar event created: ${calendarEvent.id}`);
        console.log(`   📅 ${eventDetails.summary}`);
        console.log(`   🔗 ${calendarEvent.htmlLink}`);

        successCount++;

        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Failed to create event for booking ${booking.id.substring(0, 8).toUpperCase()}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Sync Summary:');
    console.log(`✅ Success: ${successCount} events created`);
    console.log(`❌ Errors: ${errorCount} events failed`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error details:');
    console.error(error);
  }
}

// Run the sync
syncOldBookings();
