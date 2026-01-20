import { Handler } from '@netlify/functions';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUFFER_TIME_MS = 90 * 60 * 1000; // 90 minutes

/**
 * Calculate earliest available datetime for a vehicle or vehicle group
 * Single source of truth for availability
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
        const { vehicleName, vehicleIds } = JSON.parse(event.body || '{}');

        if (!vehicleName && (!vehicleIds || vehicleIds.length === 0)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'vehicleName or vehicleIds is required' }),
            };
        }

        // Query bookings using vehicle_id (strict FK relationship)
        let bookingsUrl = `${SUPABASE_URL}/rest/v1/bookings?select=pickup_date,dropoff_date,vehicle_id&status=neq.cancelled&order=pickup_date.asc`;

        if (vehicleIds && vehicleIds.length > 0) {
            // Precise match by vehicle_id (preferred)
            bookingsUrl += `&vehicle_id=in.(${vehicleIds.join(',')})`;
        } else {
            // Fallback: resolve vehicle_id from name first
            const vehiclesResponse = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?select=id&display_name=eq.${encodeURIComponent(vehicleName)}`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                },
            });

            const vehicles = await vehiclesResponse.json();
            if (!vehicles || vehicles.length === 0) {
                // No vehicle found - return available to not block
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

            const resolvedIds = vehicles.map((v: any) => v.id);
            bookingsUrl += `&vehicle_id=in.(${resolvedIds.join(',')})`;
        }

        const bookingsResponse = await fetch(bookingsUrl, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const bookings = await bookingsResponse.json();

        // Query reservations if we have vehicle IDs
        let reservations = [];
        const idsToCheck = vehicleIds && vehicleIds.length > 0 ? vehicleIds : [];

        if (idsToCheck.length > 0) {
            const reservationsUrl = `${SUPABASE_URL}/rest/v1/reservations?select=start_at,end_at,vehicle_id&vehicle_id=in.(${idsToCheck.join(',')})&status=in.(confirmed,pending,active)&order=start_at.asc`;

            const reservationsResponse = await fetch(reservationsUrl, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                },
            });

            reservations = await reservationsResponse.json();
        }

        // Combine and sort all conflicts by start time
        const allConflicts: Array<{ start: Date; end: Date }> = [];
        const now = new Date();

        // Add bookings
        if (bookings && Array.isArray(bookings)) {
            bookings.forEach((b: any) => {
                const end = new Date(b.dropoff_date);
                // Only include future or current bookings
                if (end >= now) {
                    allConflicts.push({
                        start: new Date(b.pickup_date),
                        end: new Date(end.getTime() + BUFFER_TIME_MS)
                    });
                }
            });
        }

        // Add reservations
        if (reservations && Array.isArray(reservations)) {
            reservations.forEach((r: any) => {
                const end = new Date(r.end_at);
                if (end >= now) {
                    allConflicts.push({
                        start: new Date(r.start_at),
                        end: new Date(end.getTime() + BUFFER_TIME_MS)
                    });
                }
            });
        }

        // Sort by start time
        allConflicts.sort((a, b) => a.start.getTime() - b.start.getTime());

        // Check if available NOW (no current conflicts)
        if (allConflicts.length === 0) {
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

        // Check if currently in a conflict
        const currentConflict = allConflicts.find(c => now >= c.start && now < c.end);

        if (currentConflict) {
            // Currently unavailable - return when it becomes available
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    isAvailable: false,
                    earliestAvailableDate: currentConflict.end.toISOString().split('T')[0],
                    earliestAvailableTime: currentConflict.end.toTimeString().slice(0, 5),
                    earliestAvailableDatetime: currentConflict.end.toISOString(),
                }),
            };
        }

        // Not currently in conflict - available now
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
