import { Handler } from '@netlify/functions';
import { getCorsOrigin } from './utils/cors';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUFFER_TIME_MS = 90 * 60 * 1000; // 90 minutes

interface TimeWindow {
    start: string; // ISO timestamp
    end: string;   // ISO timestamp
}

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

        // Move the pointer that ends first
        if (list1[i].end.getTime() < list2[j].end.getTime()) {
            i++;
        } else {
            j++;
        }
    }

    return result;
}

/**
 * Compute free availability windows (gaps) between bookings
 * For multiple vehicles (e.g., 3 Panda White), only shows unavailable when ALL are busy
 * Returns array of time windows where at least one vehicle can be booked
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
        const { vehicleIds, startDate, endDate } = JSON.parse(event.body || '{}');

        if (!vehicleIds || vehicleIds.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'vehicleIds is required' }),
            };
        }

        const now = new Date();
        const horizonStart = startDate ? new Date(startDate) : now;
        const horizonEnd = endDate ? new Date(endDate) : new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        // Fetch all bookings for these vehicles in the time range
        const bookingsUrl = `${SUPABASE_URL}/rest/v1/bookings?select=pickup_date,dropoff_date,vehicle_id,service_type&vehicle_id=in.(${vehicleIds.join(',')})&status=not.in.(cancelled,annullata,completed,completata)&dropoff_date=gte.${horizonStart.toISOString()}&pickup_date=lte.${horizonEnd.toISOString()}`;

        const bookingsResponse = await fetch(bookingsUrl, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const bookings = await bookingsResponse.json();

        // Fetch reservations
        const reservationsUrl = `${SUPABASE_URL}/rest/v1/reservations?select=start_at,end_at,vehicle_id,status&vehicle_id=in.(${vehicleIds.join(',')})&status=not.in.(cancelled,annullata,completed,completata)&end_at=gte.${horizonStart.toISOString()}&start_at=lte.${horizonEnd.toISOString()}`;

        const reservationsResponse = await fetch(reservationsUrl, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const reservations = await reservationsResponse.json();

        // Debug logging
        console.log('Availability Windows Debug:', {
            vehicleIds,
            bookingsCount: bookings?.length || 0,
            reservationsCount: reservations?.length || 0,
        });

        // Step 1: Build busy intervals PER VEHICLE
        const busyByVehicle: Map<string, Interval[]> = new Map();

        // Initialize all vehicles with empty intervals
        for (const vehicleId of vehicleIds) {
            busyByVehicle.set(vehicleId, []);
        }

        // Add bookings to respective vehicles
        if (bookings && Array.isArray(bookings)) {
            bookings.forEach((b: any) => {
                // Skip car wash bookings
                if (b.service_type === 'car_wash') return;
                if (!b.vehicle_id) return;

                const vehicleBusy = busyByVehicle.get(b.vehicle_id) || [];
                vehicleBusy.push({
                    start: new Date(b.pickup_date),
                    end: new Date(new Date(b.dropoff_date).getTime() + BUFFER_TIME_MS)
                });
                busyByVehicle.set(b.vehicle_id, vehicleBusy);
            });
        }

        // Add reservations to respective vehicles
        if (reservations && Array.isArray(reservations)) {
            reservations.forEach((r: any) => {
                if (!r.vehicle_id) return;

                const vehicleBusy = busyByVehicle.get(r.vehicle_id) || [];
                vehicleBusy.push({
                    start: new Date(r.start_at),
                    end: new Date(new Date(r.end_at).getTime() + BUFFER_TIME_MS)
                });
                busyByVehicle.set(r.vehicle_id, vehicleBusy);
            });
        }

        // Step 2: Merge intervals for each vehicle
        for (const [vehicleId, intervals] of busyByVehicle.entries()) {
            busyByVehicle.set(vehicleId, mergeIntervals(intervals));
        }

        // Step 3: Find when ALL vehicles are busy (intersection)
        // The group is only unavailable when ALL vehicles are simultaneously busy
        let allBusyIntervals: Interval[] = [];

        const vehicleIntervalsList = Array.from(busyByVehicle.values());

        if (vehicleIntervalsList.length === 0) {
            // No vehicles - nothing busy
            allBusyIntervals = [];
        } else if (vehicleIntervalsList.length === 1) {
            // Single vehicle - its busy times are the group's busy times
            allBusyIntervals = vehicleIntervalsList[0];
        } else {
            // Multiple vehicles - find intersection (when ALL are busy)
            // Start with the first vehicle's busy times
            allBusyIntervals = vehicleIntervalsList[0];

            // Intersect with each subsequent vehicle's busy times
            for (let i = 1; i < vehicleIntervalsList.length; i++) {
                allBusyIntervals = intersectIntervalLists(allBusyIntervals, vehicleIntervalsList[i]);
            }
        }

        // Step 4: Compute free windows (complement of allBusyIntervals)
        const freeWindows: TimeWindow[] = [];
        const searchStart = new Date(Math.max(now.getTime(), horizonStart.getTime()));

        if (allBusyIntervals.length === 0) {
            // No time when ALL vehicles are busy - entire horizon is free
            freeWindows.push({
                start: searchStart.toISOString(),
                end: horizonEnd.toISOString()
            });
        } else {
            // Check availability before first all-busy period
            if (searchStart < allBusyIntervals[0].start) {
                freeWindows.push({
                    start: searchStart.toISOString(),
                    end: allBusyIntervals[0].start.toISOString()
                });
            }

            // Windows between all-busy periods
            for (let i = 0; i < allBusyIntervals.length - 1; i++) {
                const gapStart = allBusyIntervals[i].end;
                const gapEnd = allBusyIntervals[i + 1].start;

                if (gapEnd.getTime() - gapStart.getTime() > 60 * 60 * 1000) {
                    freeWindows.push({
                        start: gapStart.toISOString(),
                        end: gapEnd.toISOString()
                    });
                }
            }

            // Window after last all-busy period
            const lastEnd = allBusyIntervals[allBusyIntervals.length - 1].end;
            if (lastEnd < horizonEnd) {
                freeWindows.push({
                    start: lastEnd.toISOString(),
                    end: horizonEnd.toISOString()
                });
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                freeWindows,
                busyIntervals: allBusyIntervals.map(b => ({
                    start: b.start.toISOString(),
                    end: b.end.toISOString()
                })),
                totalVehicles: vehicleIds.length,
                totalFreeWindows: freeWindows.length
            }),
        };

    } catch (error) {
        console.error('Error computing availability windows:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to compute availability windows',
                details: error instanceof Error ? error.message : String(error)
            }),
        };
    }
};
