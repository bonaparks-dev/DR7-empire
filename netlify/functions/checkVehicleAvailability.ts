import { Handler } from '@netlify/functions';
import { getCorsOrigin } from './utils/cors';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface Interval {
    start: Date;
    end: Date;
}

// Helper: Merge overlapping intervals
function mergeIntervals(intervals: Interval[]): Interval[] {
    if (intervals.length === 0) return [];

    const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
    const merged: Interval[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const last = merged[merged.length - 1];
        const current = sorted[i];

        if (current.start <= last.end) {
            last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
        } else {
            merged.push(current);
        }
    }

    return merged;
}

// Helper: Intersect two interval lists
function intersectIntervalLists(list1: Interval[], list2: Interval[]): Interval[] {
    const result: Interval[] = [];
    let i = 0, j = 0;

    while (i < list1.length && j < list2.length) {
        const start = new Date(Math.max(list1[i].start.getTime(), list2[j].start.getTime()));
        const end = new Date(Math.min(list1[i].end.getTime(), list2[j].end.getTime()));

        if (start < end) {
            result.push({ start, end });
        }

        if (list1[i].end.getTime() < list2[j].end.getTime()) {
            i++;
        } else {
            j++;
        }
    }

    return result;
}

/**
 * Netlify Function to check vehicle availability
 * For multiple vehicles with same name (e.g., 3 Panda White), returns conflicts only
 * when ALL vehicles are busy during the requested period
 */
export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': getCorsOrigin(event.headers['origin']),
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const { vehicleName, pickupDate, dropoffDate, targetVehicleId } = JSON.parse(event.body || '{}');

        if (!vehicleName || !pickupDate || !dropoffDate) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required parameters' }),
            };
        }

        const BUFFER_TIME_MS = 90 * 60 * 1000;
        const requestedPickup = new Date(pickupDate);
        const requestedDropoff = new Date(dropoffDate);

        // Get ALL vehicles with this name (not just the first one!)
        const vehiclesResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/vehicles?select=id,plate,metadata&display_name=ilike.${encodeURIComponent(vehicleName.trim())}*`,
            {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const vehicles = await vehiclesResponse.json();

        if (!vehicles || vehicles.length === 0) {
            // No vehicles found - no conflicts
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ conflicts: [] }),
            };
        }

        // If targetVehicleId specified, only check that one vehicle
        const vehicleIds = targetVehicleId
            ? [targetVehicleId]
            : vehicles.map((v: any) => v.id);

        // Get plates for the target vehicles (for plate-based matching)
        const targetPlates = targetVehicleId
            ? vehicles.filter((v: any) => v.id === targetVehicleId).map((v: any) => v.plate).filter(Boolean)
            : vehicles.map((v: any) => v.plate).filter(Boolean);

        // Fetch bookings by vehicle_id
        const bookingsUrl = `${SUPABASE_URL}/rest/v1/bookings?select=pickup_date,dropoff_date,vehicle_id,vehicle_plate,vehicle_name&status=not.in.(cancelled,annullata,completed,completata)&vehicle_id=in.(${vehicleIds.join(',')})&order=pickup_date.asc`;

        const bookingsResponse = await fetch(bookingsUrl, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        let bookings = await bookingsResponse.json();

        // Also fetch bookings by plate (targa) to catch mismatched vehicle_id
        if (targetPlates.length > 0) {
            const plateBookingsUrl = `${SUPABASE_URL}/rest/v1/bookings?select=pickup_date,dropoff_date,vehicle_id,vehicle_plate,vehicle_name&status=not.in.(cancelled,annullata,completed,completata)&vehicle_plate=in.(${targetPlates.join(',')})&order=pickup_date.asc`;
            const plateResponse = await fetch(plateBookingsUrl, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                },
            });
            const plateBookings = await plateResponse.json();

            // Merge and deduplicate
            if (Array.isArray(plateBookings)) {
                const seenKeys = new Set((bookings || []).map((b: any) => `${b.pickup_date}_${b.dropoff_date}_${b.vehicle_id}`));
                for (const pb of plateBookings) {
                    const key = `${pb.pickup_date}_${pb.dropoff_date}_${pb.vehicle_id}`;
                    if (!seenKeys.has(key)) {
                        // Map plate booking to the correct vehicle_id
                        const plateVehicle = vehicles.find((v: any) => v.plate === pb.vehicle_plate);
                        if (plateVehicle) {
                            pb.vehicle_id = plateVehicle.id;
                        }
                        bookings.push(pb);
                        seenKeys.add(key);
                    }
                }
            }
        }

        // Fetch reservations for ALL these vehicles
        const reservationsUrl = `${SUPABASE_URL}/rest/v1/reservations?select=start_at,end_at,vehicle_id&vehicle_id=in.(${vehicleIds.join(',')})&status=not.in.(cancelled,annullata,completed,completata)&order=start_at.asc`;

        const reservationsResponse = await fetch(reservationsUrl, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const reservations = await reservationsResponse.json();

        // Build busy intervals PER VEHICLE
        const busyByVehicle: Map<string, Interval[]> = new Map();

        // Initialize all vehicles with empty intervals
        for (const vehicleId of vehicleIds) {
            busyByVehicle.set(vehicleId, []);
        }

        // Add maintenance/unavailability blocks from vehicle metadata
        const vehicleLookup = targetVehicleId
            ? vehicles.filter((v: any) => v.id === targetVehicleId)
            : vehicles;
        for (const vehicle of vehicleLookup) {
            if (!vehicle.metadata) continue;
            const { unavailable_from, unavailable_until, unavailable_from_time, unavailable_until_time } = vehicle.metadata;
            if (!unavailable_from) continue;
            const fromTime = unavailable_from_time || '00:00';
            const untilTime = unavailable_until_time || '23:59';
            const blockStart = new Date(`${unavailable_from}T${fromTime}:00`);
            const blockEnd = unavailable_until
                ? new Date(`${unavailable_until}T${untilTime}:00`)
                : new Date('2099-12-31T23:59:00');
            const vehicleBusy = busyByVehicle.get(vehicle.id) || [];
            vehicleBusy.push({ start: blockStart, end: blockEnd });
            busyByVehicle.set(vehicle.id, vehicleBusy);
        }

        // Add bookings to respective vehicles
        if (bookings && Array.isArray(bookings)) {
            for (const booking of bookings) {
                if (!booking.vehicle_id) continue;

                const vehicleBusy = busyByVehicle.get(booking.vehicle_id) || [];
                vehicleBusy.push({
                    start: new Date(booking.pickup_date),
                    end: new Date(new Date(booking.dropoff_date).getTime() + BUFFER_TIME_MS)
                });
                busyByVehicle.set(booking.vehicle_id, vehicleBusy);
            }
        }

        // Add reservations to respective vehicles
        if (reservations && Array.isArray(reservations)) {
            for (const reservation of reservations) {
                if (!reservation.vehicle_id) continue;

                const vehicleBusy = busyByVehicle.get(reservation.vehicle_id) || [];
                vehicleBusy.push({
                    start: new Date(reservation.start_at),
                    end: new Date(new Date(reservation.end_at).getTime() + BUFFER_TIME_MS)
                });
                busyByVehicle.set(reservation.vehicle_id, vehicleBusy);
            }
        }

        // Merge intervals for each vehicle
        for (const [vehicleId, intervals] of busyByVehicle.entries()) {
            busyByVehicle.set(vehicleId, mergeIntervals(intervals));
        }

        // Find when ALL vehicles are busy (intersection)
        let allBusyIntervals: Interval[] = [];

        const vehicleIntervalsList = Array.from(busyByVehicle.values());

        if (vehicleIntervalsList.length === 0) {
            allBusyIntervals = [];
        } else if (vehicleIntervalsList.length === 1) {
            allBusyIntervals = vehicleIntervalsList[0];
        } else {
            // Multiple vehicles - find intersection (when ALL are busy)
            allBusyIntervals = vehicleIntervalsList[0];

            for (let i = 1; i < vehicleIntervalsList.length; i++) {
                allBusyIntervals = intersectIntervalLists(allBusyIntervals, vehicleIntervalsList[i]);
            }
        }

        // Check if requested period overlaps with any all-busy period
        const conflicts: any[] = [];

        for (const busyPeriod of allBusyIntervals) {
            const hasConflict =
                (requestedPickup >= busyPeriod.start && requestedPickup < busyPeriod.end) ||
                (requestedDropoff > busyPeriod.start && requestedDropoff <= busyPeriod.end) ||
                (requestedPickup <= busyPeriod.start && requestedDropoff >= busyPeriod.end);

            if (hasConflict) {
                conflicts.push({
                    pickup_date: busyPeriod.start.toISOString(),
                    dropoff_date: busyPeriod.end.toISOString(),
                    vehicle_name: vehicleName,
                    all_vehicles_busy: true
                });
            }
        }

        // Check if any conflict ends same day as requested pickup → availableFrom
        // Use Rome timezone for date comparison (Italy = UTC+1 or UTC+2)
        let availableFrom: string | null = null;
        if (conflicts.length > 0) {
            const toRomeDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' });
            const pickupRomeDate = toRomeDate(requestedPickup);
            for (const c of conflicts) {
                const busyEnd = new Date(c.dropoff_date);
                const busyEndRomeDate = toRomeDate(busyEnd);
                console.log(`[availableFrom] pickup=${pickupRomeDate}, busyEnd=${busyEndRomeDate} (${c.dropoff_date}), requestedDropoff=${requestedDropoff.toISOString()}`);
                if (busyEndRomeDate === pickupRomeDate && busyEnd < requestedDropoff) {
                    if (!availableFrom || c.dropoff_date < availableFrom) {
                        availableFrom = c.dropoff_date;
                    }
                }
            }
            console.log(`[availableFrom] result: ${availableFrom}`);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                conflicts,
                totalVehicles: vehicleIds.length,
                ...(availableFrom && { availableFrom }),
                message: conflicts.length === 0
                    ? `At least 1 of ${vehicleIds.length} ${vehicleName} is available`
                    : availableFrom
                        ? `${vehicleName} available from ${availableFrom}`
                        : `All ${vehicleIds.length} ${vehicleName} are busy during requested period`
            }),
        };

    } catch (error) {
        console.error('Error checking availability:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                conflicts: []
            }),
        };
    }
};
