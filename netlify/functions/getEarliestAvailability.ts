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

        if (!vehicleName) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'vehicleName is required' }),
            };
        }

        // 1. Resolve Vehicle Plates if IDs are provided
        // This ensures stricter matching than just name
        let vehiclePlates: string[] = [];
        if (vehicleIds && vehicleIds.length > 0) {
            const { data: vehicles, error: vehiclesError } = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?select=plate&id=in.(${vehicleIds.join(',')})`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                },
            }).then(r => r.json().then(data => ({ data, error: !r.ok ? data : null })));

            if (vehicles && vehicles.length > 0) {
                vehiclePlates = vehicles.map((v: any) => v.plate).filter((p: any) => p);
            }
        }

        // 2. Query bookings
        // Prioritize Plate matching if available, otherwise fallback to Name (but strive for precision)
        let bookingsUrl = `${SUPABASE_URL}/rest/v1/bookings?select=pickup_date,dropoff_date,vehicle_name,vehicle_plate&status=neq.cancelled&order=dropoff_date.desc`;

        if (vehiclePlates.length > 0) {
            // Precise match by plate
            bookingsUrl += `&vehicle_plate=in.(${vehiclePlates.join(',')})`;
        } else {
            // Fallback to name match (legacy/fallback behavior)
            bookingsUrl += `&vehicle_name=ilike.%25${encodeURIComponent(vehicleName)}%25`;
        }

        const bookingsResponse = await fetch(bookingsUrl, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const bookings = await bookingsResponse.json();

        // 3. Query reservations if we have vehicle IDs
        let reservations = [];
        if (vehicleIds && vehicleIds.length > 0) {
            const reservationsUrl = `${SUPABASE_URL}/rest/v1/reservations?select=start_at,end_at,vehicle_id&vehicle_id=in.(${vehicleIds.join(',')})&status=in.(confirmed,pending,active)&order=end_at.desc`;

            const reservationsResponse = await fetch(reservationsUrl, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                },
            });

            reservations = await reservationsResponse.json();
        }

        // 4. Find latest conflict
        let latestEndTime: Date | null = null;
        const now = new Date();

        // Check bookings
        if (bookings && Array.isArray(bookings) && bookings.length > 0) {
            // Find the MAX end date, not just the first one (since we might have multiple cars in a group)
            // But usually we just want the latest one that is in the future relative to NOW?
            // Actually, we want the absolute latest end time.

            for (const b of bookings) {
                const end = new Date(b.dropoff_date);
                if (!latestEndTime || end > latestEndTime) {
                    latestEndTime = end;
                }
            }
        }

        // Check reservations
        if (reservations && Array.isArray(reservations) && reservations.length > 0) {
            for (const r of reservations) {
                const end = new Date(r.end_at);
                if (!latestEndTime || end > latestEndTime) {
                    latestEndTime = end;
                }
            }
        }

        // 5. Determine Availability
        // If no conflicts OR latest conflict is in the past -> Available Now
        let isAvailable = true;
        let earliestDate = now;

        if (latestEndTime) {
            // Add buffer
            const availableTime = new Date(latestEndTime.getTime() + BUFFER_TIME_MS);

            // If the calculated available time is in the future, then it's currently unavailable
            if (availableTime > now) {
                isAvailable = false;
                earliestDate = availableTime;
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                isAvailable,
                earliestAvailableDate: earliestDate.toISOString().split('T')[0],
                earliestAvailableTime: earliestDate.toTimeString().slice(0, 5),
                earliestAvailableDatetime: earliestDate.toISOString(),
            }),
        };

    } catch (error) {
        console.error('Error calculating earliest availability:', error);
        // Return available on error to not block user
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
