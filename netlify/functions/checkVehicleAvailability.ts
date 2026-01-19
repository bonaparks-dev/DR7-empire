import { Handler } from '@netlify/functions';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Netlify Function to check vehicle availability
 * Proxies requests to Supabase to avoid browser HTTP/2 errors
 */
export const handler: Handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    // Handle preflight
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

        // Get vehicle plate for reliable matching
        const vehicleResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/vehicles?select=plate&display_name=eq.${encodeURIComponent(vehicleName)}`,
            {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const vehicleData = await vehicleResponse.json();
        const vehiclePlate = vehicleData?.[0]?.plate;

        // Query bookings
        let bookingsUrl = `${SUPABASE_URL}/rest/v1/bookings?select=pickup_date,dropoff_date,vehicle_name,vehicle_plate,status,booking_source,booking_details&status=neq.cancelled&order=pickup_date.asc`;

        if (vehiclePlate) {
            bookingsUrl += `&vehicle_plate=eq.${encodeURIComponent(vehiclePlate)}`;
        } else {
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

        // Get vehicle ID for reservations query
        const vehicleIdResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/vehicles?select=id&display_name=eq.${encodeURIComponent(vehicleName)}`,
            {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const vehicleIdData = await vehicleIdResponse.json();
        const vehicleId = targetVehicleId || vehicleIdData?.[0]?.id;

        let reservations = [];
        if (vehicleId) {
            const reservationsResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/reservations?select=start_at,end_at,vehicle_id,status&vehicle_id=eq.${vehicleId}&status=in.(confirmed,pending,active)&order=start_at.asc`,
                {
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            reservations = await reservationsResponse.json();
        }

        // Process conflicts (same logic as bookingValidation.ts)
        const BUFFER_TIME_MS = 90 * 60 * 1000;
        const requestedPickup = new Date(pickupDate);
        const requestedDropoff = new Date(dropoffDate);
        const conflicts = [];

        const hasConflict = (existingStart: Date, existingEnd: Date) => {
            const existingEndWithBuffer = new Date(existingEnd.getTime() + BUFFER_TIME_MS);
            return (
                (requestedPickup >= existingStart && requestedPickup < existingEndWithBuffer) ||
                (requestedDropoff > existingStart && requestedDropoff <= existingEndWithBuffer) ||
                (requestedPickup <= existingStart && requestedDropoff >= existingEndWithBuffer)
            );
        };

        // Check bookings
        if (bookings && Array.isArray(bookings)) {
            for (const booking of bookings) {
                if (targetVehicleId) {
                    const bookedId = booking.booking_details?.vehicle_id;
                    if (bookedId && bookedId !== targetVehicleId) {
                        continue;
                    }
                }

                const existingPickup = new Date(booking.pickup_date);
                const existingDropoff = new Date(booking.dropoff_date);

                if (hasConflict(existingPickup, existingDropoff)) {
                    conflicts.push({
                        pickup_date: booking.pickup_date,
                        dropoff_date: booking.dropoff_date,
                        vehicle_name: booking.vehicle_name,
                    });
                }
            }
        }

        // Check reservations
        if (reservations && Array.isArray(reservations)) {
            for (const reservation of reservations) {
                const existingStart = new Date(reservation.start_at);
                const existingEnd = new Date(reservation.end_at);

                if (hasConflict(existingStart, existingEnd)) {
                    conflicts.push({
                        pickup_date: reservation.start_at,
                        dropoff_date: reservation.end_at,
                        vehicle_name: vehicleName,
                    });
                }
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ conflicts }),
        };

    } catch (error) {
        console.error('Error checking availability:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                conflicts: [] // Return empty conflicts on error to not block user
            }),
        };
    }
};
