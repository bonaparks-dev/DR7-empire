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

        // Query bookings
        let bookingsUrl = `${SUPABASE_URL}/rest/v1/bookings?select=pickup_date,dropoff_date,vehicle_name,vehicle_plate&status=neq.cancelled&order=dropoff_date.desc`;

        // Filter by vehicle name
        bookingsUrl += `&vehicle_name=ilike.%25${encodeURIComponent(vehicleName)}%25`;

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

        // Find latest conflict
        let latestEndTime: Date | null = null;

        // Check bookings
        if (bookings && Array.isArray(bookings) && bookings.length > 0) {
            const latestBooking = bookings[0]; // Already sorted desc
            latestEndTime = new Date(latestBooking.dropoff_date);
        }

        // Check reservations
        if (reservations && Array.isArray(reservations) && reservations.length > 0) {
            const latestReservation = reservations[0]; // Already sorted desc
            const reservationEnd = new Date(latestReservation.end_at);

            if (!latestEndTime || reservationEnd > latestEndTime) {
                latestEndTime = reservationEnd;
            }
        }

        // If no conflicts, available now
        if (!latestEndTime) {
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

        // Calculate earliest available (latest end + buffer)
        const earliestAvailable = new Date(latestEndTime.getTime() + BUFFER_TIME_MS);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                isAvailable: false,
                earliestAvailableDate: earliestAvailable.toISOString().split('T')[0],
                earliestAvailableTime: earliestAvailable.toTimeString().slice(0, 5),
                earliestAvailableDatetime: earliestAvailable.toISOString(),
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
