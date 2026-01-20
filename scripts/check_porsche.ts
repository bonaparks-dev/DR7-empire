import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPorsche() {
    console.log("Checking Porsche Cayenne bookings...");

    // 1. Check bookings table (by name)
    const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('pickup_date, dropoff_date, vehicle_name, status')
        .ilike('vehicle_name', '%Cayenne%')
        .neq('status', 'cancelled')
        .gt('dropoff_date', '2025-12-01') // Check recent past too
        .order('dropoff_date', { ascending: false });

    if (bookingsError) console.error("Bookings Error:", bookingsError);
    console.log("Bookings found:", bookings?.length);
    if (bookings) bookings.forEach(b => console.log(`[BOOKING] ${b.vehicle_name}: ${b.pickup_date} -> ${b.dropoff_date} (${b.status})`));

    // 2. Find vehicle ID
    const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, display_name')
        .ilike('display_name', '%Cayenne%');

    if (vehicles && vehicles.length > 0) {
        console.log("Vehicles found:", vehicles);
        const ids = vehicles.map(v => v.id);

        // 3. Check reservations table (by ID)
        const { data: reservations, error: resError } = await supabase
            .from('reservations')
            .select('start_at, end_at, status, vehicle_id')
            .in('vehicle_id', ids)
            .gt('end_at', '2025-12-01')
            .order('end_at', { ascending: false });

        if (resError) console.error("Reservations Error:", resError);
        console.log("Reservations found:", reservations?.length);
        if (reservations) reservations.forEach(r => console.log(`[RESERVATION] Vehicle ${r.vehicle_id}: ${r.start_at} -> ${r.end_at} (${r.status})`));
    } else {
        console.log("No Porsche Cayenne vehicle found in 'vehicles' table.");
    }
}

checkPorsche();
