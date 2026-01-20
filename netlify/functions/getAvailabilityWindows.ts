import { Handler } from '@netlify/functions';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUFFER_TIME_MS = 90 * 60 * 1000; // 90 minutes

interface TimeWindow {
    start: string; // ISO timestamp
    end: string;   // ISO timestamp
}

/**
 * Compute free availability windows (gaps) between bookings
 * Returns array of time windows where vehicle can be booked
 */
export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
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
        const bookingsUrl = `${SUPABASE_URL}/rest/v1/bookings?select=pickup_date,dropoff_date,vehicle_id&vehicle_id=in.(${vehicleIds.join(',')})&status=neq.cancelled&dropoff_date=gte.${horizonStart.toISOString()}&pickup_date=lte.${horizonEnd.toISOString()}`;

        const bookingsResponse = await fetch(bookingsUrl, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const bookings = await bookingsResponse.json();

        // Fetch reservations
        const reservationsUrl = `${SUPABASE_URL}/rest/v1/reservations?select=start_at,end_at,vehicle_id&vehicle_id=in.(${vehicleIds.join(',')})&status=in.(confirmed,pending,active)&end_at=gte.${horizonStart.toISOString()}&start_at=lte.${horizonEnd.toISOString()}`;

        const reservationsResponse = await fetch(reservationsUrl, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const reservations = await reservationsResponse.json();

        // Step 1: Create busy intervals
        const busyIntervals: Array<{ start: Date; end: Date }> = [];

        if (bookings && Array.isArray(bookings)) {
            bookings.forEach((b: any) => {
                busyIntervals.push({
                    start: new Date(b.pickup_date),
                    end: new Date(new Date(b.dropoff_date).getTime() + BUFFER_TIME_MS)
                });
            });
        }

        if (reservations && Array.isArray(reservations)) {
            reservations.forEach((r: any) => {
                busyIntervals.push({
                    start: new Date(r.start_at),
                    end: new Date(new Date(r.end_at).getTime() + BUFFER_TIME_MS)
                });
            });
        }

        // Step 2: Sort by start time
        busyIntervals.sort((a, b) => a.start.getTime() - b.start.getTime());

        // Step 3: Merge overlapping/touching intervals
        const mergedBusy: Array<{ start: Date; end: Date }> = [];

        for (const interval of busyIntervals) {
            if (mergedBusy.length === 0) {
                mergedBusy.push(interval);
            } else {
                const last = mergedBusy[mergedBusy.length - 1];
                // If current interval starts before or at the end of last interval, merge
                if (interval.start <= last.end) {
                    last.end = new Date(Math.max(last.end.getTime(), interval.end.getTime()));
                } else {
                    mergedBusy.push(interval);
                }
            }
        }

        // Step 4: Compute free windows (gaps)
        const freeWindows: TimeWindow[] = [];
        const searchStart = new Date(Math.max(now.getTime(), horizonStart.getTime()));

        if (mergedBusy.length === 0) {
            // No bookings at all - entire horizon is free
            freeWindows.push({
                start: searchStart.toISOString(),
                end: horizonEnd.toISOString()
            });
        } else {
            // Check if we're currently in a booking
            const currentBooking = mergedBusy.find(b => now >= b.start && now < b.end);

            if (currentBooking) {
                // Currently in a booking - first free window starts after it ends
                // Skip to gaps between bookings
            } else {
                // Not in a booking - check if there's availability before first booking
                if (now < mergedBusy[0].start) {
                    // Available NOW until first booking starts
                    freeWindows.push({
                        start: now.toISOString(),
                        end: mergedBusy[0].start.toISOString()
                    });
                }
            }

            // Windows between bookings
            for (let i = 0; i < mergedBusy.length - 1; i++) {
                const gapStart = mergedBusy[i].end;
                const gapEnd = mergedBusy[i + 1].start;

                // Only include if gap is meaningful (> 1 hour)
                if (gapEnd.getTime() - gapStart.getTime() > 60 * 60 * 1000) {
                    freeWindows.push({
                        start: gapStart.toISOString(),
                        end: gapEnd.toISOString()
                    });
                }
            }

            // Window after last booking
            const lastEnd = mergedBusy[mergedBusy.length - 1].end;
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
                busyIntervals: mergedBusy.map(b => ({
                    start: b.start.toISOString(),
                    end: b.end.toISOString()
                })),
                totalBookings: busyIntervals.length,
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
