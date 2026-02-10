import type { Handler } from "@netlify/functions";
import { createClient } from '@supabase/supabase-js';
import { createCalendarEvent, formatCarRentalEvent, formatCarWashEvent } from './utils/googleCalendar';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Syncs old bookings to Google Calendar
 * Call this function via: /.netlify/functions/sync-old-bookings?secret=YOUR_SECRET_KEY
 */
const handler: Handler = async (event) => {
  // Simple authentication to prevent abuse
  const secret = event.queryStringParameters?.secret;
  const expectedSecret = process.env.SYNC_SECRET;

  if (!expectedSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Configuration Error',
        message: 'SYNC_SECRET environment variable not set'
      }),
    };
  }

  if (secret !== expectedSecret) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid secret key'
      }),
    };
  }

  console.log('🔄 Starting sync of old bookings to Google Calendar...');

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

    console.log(`✓ Found ${bookings.length} total bookings`);

    // Filter for future bookings only
    const today = new Date();
    const futureBookings = bookings.filter((booking: any) => {
      const bookingDate = booking.service_type === 'car_wash'
        ? new Date(booking.appointment_date)
        : new Date(booking.pickup_date);
      return bookingDate >= today;
    });

    console.log(`📅 ${futureBookings.length} future bookings to sync`);

    if (futureBookings.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No future bookings to sync',
          totalBookings: bookings.length,
          syncedBookings: 0,
        }),
      };
    }

    const results = {
      success: [] as string[],
      errors: [] as { bookingId: string; error: string }[],
    };

    // Create calendar events for each booking
    for (const booking of futureBookings) {
      try {
        const serviceType = booking.service_type;
        const bookingId = booking.id.substring(0, 8).toUpperCase();

        console.log(`📝 Processing booking DR7-${bookingId} (${serviceType || 'car_rental'})...`);

        const eventDetails = serviceType === 'car_wash'
          ? formatCarWashEvent(booking)
          : formatCarRentalEvent(booking);

        await createCalendarEvent(eventDetails);

        console.log(`✅ Calendar event created for DR7-${bookingId}`);
        results.success.push(`DR7-${bookingId}`);

        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        const bookingId = booking.id.substring(0, 8).toUpperCase();
        console.error(`❌ Failed to create event for DR7-${bookingId}: ${error.message}`);
        results.errors.push({
          bookingId: `DR7-${bookingId}`,
          error: error.message,
        });
      }
    }

    console.log('✓ Sync completed');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Sync completed',
        totalBookings: bookings.length,
        futureBookings: futureBookings.length,
        syncedBookings: results.success.length,
        failedBookings: results.errors.length,
        results,
      }),
    };

  } catch (error: any) {
    console.error('❌ Sync error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};

export { handler };
