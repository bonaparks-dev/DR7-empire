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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google Calendar configuration
const getCalendarClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Calendar OAuth credentials not configured. Required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN');
  }

  console.log('✓ Using OAuth2 authentication for Google Calendar');
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost'
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

// Parse booking info from calendar event
function parseEventToBooking(event) {
  try {
    const summary = event.summary || '';
    const description = event.description || '';

    // Extract booking ID from description (format: "Booking ID: DR7-XXXXXXXX")
    const bookingIdMatch = description.match(/Booking ID: DR7-([A-Z0-9]+)/i);
    const bookingId = bookingIdMatch ? bookingIdMatch[1].toLowerCase() : null;

    // Determine service type from summary
    let serviceType = null;
    if (summary.includes('🚿') || summary.includes('WASH') || summary.includes('LUXURY WASH')) {
      serviceType = 'car_wash';
    } else if (summary.includes('🚗') || summary.includes('🏎️') || summary.includes('CAR')) {
      serviceType = 'car_rental';
    }

    // Extract customer name from summary (usually after last "-")
    const summaryParts = summary.split(' - ');
    const customerName = summaryParts.length > 0 ? summaryParts[summaryParts.length - 1] : null;

    // Extract vehicle name
    let vehicleName = null;
    if (summaryParts.length >= 2) {
      vehicleName = summaryParts[1];
    }

    // Extract service name for car wash
    let serviceName = null;
    if (serviceType === 'car_wash' && summaryParts.length >= 2) {
      serviceName = summaryParts[1];
    }

    // Extract email from attendees or description
    let customerEmail = null;
    if (event.attendees && event.attendees.length > 0) {
      customerEmail = event.attendees[0].email;
    } else {
      const emailMatch = description.match(/Email: ([^\n]+)/);
      if (emailMatch) customerEmail = emailMatch[1].trim();
    }

    // Extract phone from description
    const phoneMatch = description.match(/Phone: ([^\n]+)/);
    const customerPhone = phoneMatch ? phoneMatch[1].trim() : null;

    // Extract total price from description
    const priceMatch = description.match(/Total: €?([\d,]+\.?\d*)/);
    const priceTotal = priceMatch ? Math.round(parseFloat(priceMatch[1].replace(',', '')) * 100) : 0;

    // Get dates
    const startDateTime = event.start.dateTime || event.start.date;
    const endDateTime = event.end.dateTime || event.end.date;

    const booking = {
      id: bookingId,
      service_type: serviceType,
      service_name: serviceName,
      vehicle_name: vehicleName || 'Unknown Vehicle',
      customer_name: customerName || 'Unknown Customer',
      customer_email: customerEmail,
      customer_phone: customerPhone,
      price_total: priceTotal,
      currency: 'EUR',
      status: 'confirmed',
      payment_status: 'succeeded',
      booking_source: 'calendar_import',
    };

    if (serviceType === 'car_wash') {
      booking.appointment_date = startDateTime;
      // Extract appointment time from description
      const timeMatch = description.match(/SLOT BLOCKED: (\d{2}:\d{2})/);
      booking.appointment_time = timeMatch ? timeMatch[1] : new Date(startDateTime).toTimeString().slice(0, 5);
    } else {
      booking.pickup_date = startDateTime;
      booking.dropoff_date = endDateTime;
    }

    return booking;
  } catch (error) {
    console.error('Error parsing event:', error.message);
    return null;
  }
}

async function importCalendarEvents() {
  console.log('📅 Importing Google Calendar events to Supabase...\n');

  try {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'dubai.rent7.0srl@gmail.com';

    console.log('📊 Fetching events from Google Calendar...');

    // Fetch all future events
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    console.log(`✓ Found ${events.length} events in calendar\n`);

    if (events.length === 0) {
      console.log('✓ No events to import!');
      return;
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const event of events) {
      try {
        console.log(`\n📝 Processing: ${event.summary}`);

        const booking = parseEventToBooking(event);

        if (!booking) {
          console.log('⚠️  Could not parse event, skipping...');
          skipCount++;
          continue;
        }

        if (!booking.id) {
          console.log('⚠️  No booking ID found, skipping...');
          skipCount++;
          continue;
        }

        // Check if booking already exists
        const { data: existing } = await supabase
          .from('bookings')
          .select('id')
          .eq('id', booking.id)
          .single();

        if (existing) {
          console.log(`✓ Booking already exists: DR7-${booking.id.toUpperCase()}`);
          skipCount++;
          continue;
        }

        // Insert booking
        const { error } = await supabase
          .from('bookings')
          .insert(booking);

        if (error) {
          throw error;
        }

        console.log(`✅ Imported: DR7-${booking.id.toUpperCase()}`);
        console.log(`   📅 ${booking.service_type === 'car_wash' ? 'Car Wash' : 'Car Rental'}`);
        console.log(`   👤 ${booking.customer_name}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Failed to import event: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Import Summary:');
    console.log(`✅ Imported: ${successCount} bookings`);
    console.log(`⏭️  Skipped: ${skipCount} bookings (already exist or invalid)`);
    console.log(`❌ Errors: ${errorCount} bookings`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error details:');
    console.error(error);
  }
}

// Run the import
importCalendarEvents();
