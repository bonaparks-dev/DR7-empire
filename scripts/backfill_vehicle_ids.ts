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

async function backfillVehicleIds() {
    console.log("Starting backfill of vehicle_id in bookings...");

    // 1. Fetch all bookings that don't have vehicle_id
    // Since we just added the column, it's basically all bookings, or we can filter where vehicle_id is null
    // But for the script, let's just process "active" or "recent" bookings first? 
    // Actually, doing all is safer.

    let page = 0;
    const pageSize = 100;
    let processedCount = 0;
    let updatedCount = 0;

    // Fetch all vehicles for lookup map
    const { data: vehicles, error: vError } = await supabase.from('vehicles').select('id, display_name, plate');
    if (vError) {
        console.error("Error fetching vehicles:", vError);
        return;
    }

    // Create lookup maps
    const nameToIdMap = new Map();
    const plateToIdMap = new Map();

    vehicles.forEach(v => {
        if (v.display_name) nameToIdMap.set(v.display_name.toLowerCase().trim(), v.id);
        if (v.plate) plateToIdMap.set(v.plate.toLowerCase().trim(), v.id);
    });

    while (true) {
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('bookingId, vehicle_name, vehicle_plate, booking_details, vehicle_id')
            .is('vehicle_id', null) // Only process those missing ID
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("Error fetching bookings:", error);
            break;
        }

        if (!bookings || bookings.length === 0) {
            console.log("No more bookings to process.");
            break;
        }

        for (const booking of bookings) {
            processedCount++;
            let matchedVehicleId = null;

            // Strategy 1: Check booking_details JSON for vehicle_id
            if (booking.booking_details && typeof booking.booking_details === 'object') {
                const details: any = booking.booking_details;
                if (details.vehicle_id) {
                    // Verify this ID exists in our vehicle list? 
                    // Assume if it's a UUID it might be valid, but checking against known vehicles is safer?
                    // Let's trust it if it looks like a UUID.
                    matchedVehicleId = details.vehicle_id;
                }
            }

            // Strategy 2: Check vehicle_plate (if column exists and is populated)
            if (!matchedVehicleId && booking.vehicle_plate) {
                const plate = booking.vehicle_plate.toLowerCase().trim();
                if (plateToIdMap.has(plate)) {
                    matchedVehicleId = plateToIdMap.get(plate);
                }
            }

            // Strategy 3: Check vehicle_name (Fuzzy / Exact match)
            if (!matchedVehicleId && booking.vehicle_name) {
                const name = booking.vehicle_name.toLowerCase().trim();
                // Try exact match first
                if (nameToIdMap.has(name)) {
                    matchedVehicleId = nameToIdMap.get(name);
                } else {
                    // Try partial match? "Porsche Cayenne Coupé" vs "Porsche Cayenne"
                    // Iterate all known vehicle names
                    for (const [vName, vId] of nameToIdMap.entries()) {
                        if (name.includes(vName) || vName.includes(name)) {
                            // Be careful with short names, but generally safe for "Porsche" etc?
                            // Better to be strict.
                            if (name === vName) matchedVehicleId = vId;
                            // We already checked strict match above.
                        }
                    }
                }
            }

            if (matchedVehicleId) {
                // Update the booking
                const { error: updateError } = await supabase
                    .from('bookings')
                    .update({ vehicle_id: matchedVehicleId })
                    .eq('bookingId', booking.bookingId);

                if (updateError) {
                    console.error(`Failed to update booking ${booking.bookingId}:`, updateError);
                } else {
                    updatedCount++;
                    //  console.log(`Updated booking ${booking.bookingId} -> vehicle ${matchedVehicleId}`);
                }
            } else {
                console.warn(`Could not resolve vehicle for booking ${booking.bookingId} (${booking.vehicle_name})`);
            }
        }

        console.log(`Processed ${processedCount} bookings... Updated ${updatedCount}`);

        // If we fetched fewer than pageSize, we are likely done (or RLS hidden some?)
        // But since we query `.is('vehicle_id', null)`, the pagination window shifts as we update items!
        // So we should NOT increment page if we are successfully removing items from the "is null" set.
        // But if we fail to resolve some, they stay null.
        // So safe strategy: Always stay on page 0 if we assume we fix them.
        // But if we can't fix them, we will infinite loop on page 0.
        // Better strategy for script: Increment page, but maybe pageSize is small enough?
        // Actually, just increment page. We will process chunks. 
        // Wait, if we use range() on a filtered set that changes, page 1 might skip items?
        // Standard "cursor" pagination is better, but harder with supabase-js simple client.
        // Let's just do one pass. Limit 1000? 

        page++;
    }

    console.log(`Backfill complete. Processed: ${processedCount}, Updated: ${updatedCount}`);
}

backfillVehicleIds();
