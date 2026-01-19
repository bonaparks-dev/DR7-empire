// Quick diagnostic script to check BMW M4 bookings
import { supabase } from './supabaseClient.js';

async function checkBookings() {
    console.log('🔍 Checking BMW M4 Competition bookings for 2026-01-19...\n');

    const { data, error } = await supabase
        .from('bookings')
        .select('id, vehicle_name, pickup_date, dropoff_date, status, booking_source')
        .ilike('vehicle_name', '%M4%')
        .neq('status', 'cancelled')
        .order('pickup_date');

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    // Filter for Jan 19, 2026
    const jan19Bookings = data.filter(b =>
        b.pickup_date.includes('2026-01-19') || b.dropoff_date.includes('2026-01-19')
    );

    console.log(`Found ${jan19Bookings.length} booking(s) on 2026-01-19:\n`);

    jan19Bookings.forEach((booking, index) => {
        console.log(`Booking ${index + 1}:`);
        console.log(`  ID: ${booking.id}`);
        console.log(`  Vehicle: ${booking.vehicle_name}`);
        console.log(`  Pickup: ${booking.pickup_date}`);
        console.log(`  Dropoff: ${booking.dropoff_date}`);
        console.log(`  Status: ${booking.status}`);
        console.log(`  Source: ${booking.booking_source}`);

        // Calculate available after time (dropoff + 1h30 buffer)
        const dropoffTime = new Date(booking.dropoff_date);
        const availableAfter = new Date(dropoffTime.getTime() + (90 * 60 * 1000));
        console.log(`  Available after: ${availableAfter.toLocaleString('it-IT')}`);
        console.log('');
    });

    // Also check all M4 bookings to see the full picture
    console.log(`\n📋 All BMW M4 bookings (not cancelled):\n`);
    data.forEach((booking, index) => {
        console.log(`${index + 1}. ${booking.pickup_date} → ${booking.dropoff_date} [${booking.status}]`);
    });
}

checkBookings().catch(console.error);
