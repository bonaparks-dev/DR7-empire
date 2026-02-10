import { Handler } from '@netlify/functions';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUFFER_TIME_MS = 90 * 60 * 1000; // 90 minutes

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

// Helper: Intersect two interval lists (when BOTH lists have a busy period)
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
 * Calculate earliest available datetime for a vehicle or vehicle group
 * For multiple vehicles (e.g., 3 Panda White), only shows unavailable when ALL are busy
 * Single source of truth for availability
 */
export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://dr7empire.com',
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
        const { vehicleName, vehicleIds } = JSON.parse(event.body || '{}');

        if (!vehicleName && (!vehicleIds || vehicleIds.length === 0)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'vehicleName or vehicleIds is required' }),
            };
        }

        // Resolve vehicle IDs if only name provided
        let resolvedIds: string[] = vehicleIds || [];

        if (resolvedIds.length === 0 && vehicleName) {
            const vehiclesResponse = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?select=id&display_name=eq.${encodeURIComponent(vehicleName)}`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                },
            });

            const vehicles = await vehiclesResponse.json();
            if (!vehicles || vehicles.length === 0) {
                const now = new Date();
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        isAvailable: true,
                        earliestAvailableDate: now.toISOString().split('T')[0],
                        earliestAvailableTime: now.toTimeString().slice(0, 5),
                        earliestAvailableDatetime: now.toISOString(),
                    }),
                };
            }

            resolvedIds = vehicles.map((v: any) => v.id);
        }

        // Query bookings
        const bookingsUrl = `${SUPABASE_URL}/rest/v1/bookings?select=pickup_date,dropoff_date,vehicle_id&status=not.in.(cancelled,annullata,completed,completata)&vehicle_id=in.(${resolvedIds.join(',')})&order=pickup_date.asc`;

        const bookingsResponse = await fetch(bookingsUrl, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const bookings = await bookingsResponse.json();

        // Query reservations
        const reservationsUrl = `${SUPABASE_URL}/rest/v1/reservations?select=start_at,end_at,vehicle_id&vehicle_id=in.(${resolvedIds.join(',')})&status=in.(confirmed,pending,active)&order=start_at.asc`;

        const reservationsResponse = await fetch(reservationsUrl, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const reservations = await reservationsResponse.json();

        const now = new Date();

        // Build busy intervals PER VEHICLE
        const busyByVehicle: Map<string, Interval[]> = new Map();

        // Initialize all vehicles with empty intervals
        for (const vehicleId of resolvedIds) {
            busyByVehicle.set(vehicleId, []);
        }

        // Add bookings to respective vehicles
        if (bookings && Array.isArray(bookings)) {
            bookings.forEach((b: any) => {
                if (!b.vehicle_id) return;
                const end = new Date(b.dropoff_date);
                if (end < now) return; // Skip past bookings

                const vehicleBusy = busyByVehicle.get(b.vehicle_id) || [];
                vehicleBusy.push({
                    start: new Date(b.pickup_date),
                    end: new Date(end.getTime() + BUFFER_TIME_MS)
                });
                busyByVehicle.set(b.vehicle_id, vehicleBusy);
            });
        }

        // Add reservations to respective vehicles
        if (reservations && Array.isArray(reservations)) {
            reservations.forEach((r: any) => {
                if (!r.vehicle_id) return;
                const end = new Date(r.end_at);
                if (end < now) return; // Skip past reservations

                const vehicleBusy = busyByVehicle.get(r.vehicle_id) || [];
                vehicleBusy.push({
                    start: new Date(r.start_at),
                    end: new Date(end.getTime() + BUFFER_TIME_MS)
                });
                busyByVehicle.set(r.vehicle_id, vehicleBusy);
            });
        }

        // Merge intervals for each vehicle
        for (const [vehicleId, intervals] of busyByVehicle.entries()) {
            busyByVehicle.set(vehicleId, mergeIntervals(intervals));
        }

        // Find when ALL vehicles are busy (intersection)
        // The group is only unavailable when ALL vehicles are simultaneously busy
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

        // Check availability
        if (allBusyIntervals.length === 0) {
            // No time when ALL vehicles are busy - available now
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    isAvailable: true,
                    earliestAvailableDate: now.toISOString().split('T')[0],
                    earliestAvailableTime: now.toTimeString().slice(0, 5),
                    earliestAvailableDatetime: now.toISOString(),
                }),
            };
        }

        // Find if we're currently in an all-busy period
        const currentBusyPeriod = allBusyIntervals.find(c => now >= c.start && now < c.end);

        if (!currentBusyPeriod) {
            // Not in an all-busy period - at least one vehicle is available now
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    isAvailable: true,
                    earliestAvailableDate: now.toISOString().split('T')[0],
                    earliestAvailableTime: now.toTimeString().slice(0, 5),
                    earliestAvailableDatetime: now.toISOString(),
                }),
            };
        }

        // Currently ALL vehicles are busy - show when at least one becomes available
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                isAvailable: false,
                earliestAvailableDate: currentBusyPeriod.end.toISOString().split('T')[0],
                earliestAvailableTime: currentBusyPeriod.end.toTimeString().slice(0, 5),
                earliestAvailableDatetime: currentBusyPeriod.end.toISOString(),
            }),
        };

    } catch (error) {
        console.error('Error calculating earliest availability:', error);
        const now = new Date();
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                isAvailable: true,
                earliestAvailableDate: now.toISOString().split('T')[0],
                earliestAvailableTime: now.toTimeString().slice(0, 5),
                earliestAvailableDatetime: now.toISOString(),
            }),
        };
    }
};
