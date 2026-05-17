import { Handler } from '@netlify/functions';
import { getCorsOrigin } from './utils/cors';
import { getRentalBufferMs } from './utils/loadAutomations';

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
        const body = JSON.parse(event.body || '{}');
        const vehicleName = body.vehicleName;
        const pickupDate = body.pickupDate;
        const dropoffDate = body.dropoffDate;
        // Support both targetVehicleId (single) and vehicleIds (array)
        const targetVehicleId = body.targetVehicleId;
        const vehicleIdsFromBody: string[] | undefined = body.vehicleIds;

        if (!vehicleName || !pickupDate || !dropoffDate) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required parameters' }),
            };
        }

        // Buffer post-noleggio da Centralina Pro > Automazioni (default 75 min).
        const BUFFER_TIME_MS = await getRentalBufferMs();
        const requestedPickup = new Date(pickupDate);
        const requestedDropoff = new Date(dropoffDate);

        // Get ALL vehicles with this name (not just the first one!)
        const vehiclesResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/vehicles?select=id,plate,metadata,status&display_name=ilike.${encodeURIComponent(vehicleName.trim())}*&status=neq.retired`,
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

        // Determine which vehicle IDs to check: explicit list > targetVehicleId > all by name
        const vehicleIds = vehicleIdsFromBody && vehicleIdsFromBody.length > 0
            ? vehicleIdsFromBody
            : targetVehicleId
                ? [targetVehicleId]
                : vehicles.map((v: any) => v.id);

        // Get plates for the target vehicles (for plate-based matching)
        const targetPlates = vehicles
            .filter((v: any) => vehicleIds.includes(v.id))
            .map((v: any) => v.plate)
            .filter(Boolean);

        // 2026-05-17 BULLETPROOF REWRITE: una sola query AMPIA (date window
        // ± 90 giorni intorno al requested), poi filtriamo client-side.
        // Cosi' eliminiamo ogni rischio di PostgREST `in.()` o `ilike.*`
        // che falliva silenziosamente quando:
        //   - service_type valeva "rental" invece di "car_rental"
        //   - vehicle_id era NULL su bookings creati da admin
        //   - vehicle_plate aveva spazi/caratteri non-ASCII
        //   - vehicle_name aveva caratteri da URL-encode
        // Match client-side: vehicle_id IN ids OR vehicle_plate IN plates
        // OR vehicle_name = name (case-insensitive trim).
        // 2026-05-17: ridotto da ±90 a ±14 giorni perche' con 22 macchine
        // in parallelo il fetch andava in AbortError (timeout 8s). Una
        // booking rilevante per la finestra richiesta sara' sempre dentro
        // a ±14 giorni dal pickup/dropoff (le rental DR7 sono al massimo
        // poche settimane).
        const windowStart = new Date(Math.min(requestedPickup.getTime(), requestedDropoff.getTime()) - 14 * 24 * 60 * 60 * 1000).toISOString();
        const windowEnd = new Date(Math.max(requestedPickup.getTime(), requestedDropoff.getTime()) + 14 * 24 * 60 * 60 * 1000).toISOString();
        const wideUrl = `${SUPABASE_URL}/rest/v1/bookings?select=pickup_date,dropoff_date,vehicle_id,vehicle_plate,vehicle_name,customer_name,status,service_type&status=not.in.(cancelled,annullata,completed,completata,expired)&pickup_date=gte.${windowStart}&pickup_date=lte.${windowEnd}&order=pickup_date.asc`;
        console.log('[checkVehicleAvailability] wideUrl:', wideUrl);

        const wideResp = await fetch(wideUrl, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        const allBookingsInWindow = await wideResp.json();
        console.log('[checkVehicleAvailability] wide query returned', Array.isArray(allBookingsInWindow) ? allBookingsInWindow.length : 'NOT ARRAY', 'rows');

        // Client-side filter — match if vehicle_id, plate, OR name matches.
        // Skip Lavaggio Rientro (covered by buffer) and TEST plates.
        const targetVehicleIdSet = new Set(vehicleIds.map((id: string) => String(id).toLowerCase()));
        const targetPlateSet = new Set(targetPlates.map((p: string) => String(p).trim().toUpperCase()));
        const targetNameNorm = String(vehicleName || '').trim().toLowerCase();
        const TEST_PLATES_SET = new Set(['TEST000', 'TEST002']);

        let bookings: any[] = [];
        if (Array.isArray(allBookingsInWindow)) {
            for (const b of allBookingsInWindow) {
                if (b.customer_name === 'Lavaggio Rientro') continue;
                const plateNorm = String(b.vehicle_plate || '').trim().toUpperCase();
                if (TEST_PLATES_SET.has(plateNorm)) continue;
                const bookingIdNorm = String(b.vehicle_id || '').toLowerCase();
                const bookingNameNorm = String(b.vehicle_name || '').trim().toLowerCase();
                const matchById = !!bookingIdNorm && targetVehicleIdSet.has(bookingIdNorm);
                const matchByPlate = !!plateNorm && targetPlateSet.has(plateNorm);
                const matchByName = !!targetNameNorm && bookingNameNorm === targetNameNorm;
                if (matchById || matchByPlate || matchByName) {
                    // Forza la booking sul primo vehicle_id del pool cosi'
                    // entra nel busyByVehicle map anche se aveva vehicle_id null.
                    if (!b.vehicle_id && vehicleIds[0]) {
                        b.vehicle_id = vehicleIds[0];
                    }
                    bookings.push(b);
                }
            }
        }
        console.log('[checkVehicleAvailability] after client-side filter:', bookings.length, 'matching bookings');

        // Fetch reservations for ALL these vehicles
        const reservationsUrl = `${SUPABASE_URL}/rest/v1/reservations?select=start_at,end_at,vehicle_id&vehicle_id=in.(${vehicleIds.join(',')})&status=not.in.(cancelled,annullata,completed,completata,expired)&order=start_at.asc`;

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

        console.log('[checkVehicleAvailability] vehicleIds:', vehicleIds);
        console.log('[checkVehicleAvailability] bookings found:', Array.isArray(bookings) ? bookings.length : 'not array', bookings);
        console.log('[checkVehicleAvailability] busyByVehicle entries:', busyByVehicle.size);
        console.log('[checkVehicleAvailability] allBusyIntervals:', allBusyIntervals.map(i => ({ start: i.start.toISOString(), end: i.end.toISOString() })));
        console.log('[checkVehicleAvailability] requested:', requestedPickup.toISOString(), '→', requestedDropoff.toISOString());

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

        // CROSS-VEHICLE HANDOVER GAP (15 min) — staff can only handle one pickup/return
        // at a time. Mirrors admin's vehicleAvailability.ts CROSS_VEHICLE_GAP_MINUTES rule.
        // Test plates (TEST000/TEST002) are excluded so test bookings never block real ones.
        const CROSS_VEHICLE_GAP_MS = 15 * 60 * 1000;
        const TEST_PLATES = new Set(['TEST000', 'TEST002']);
        const isTestPlate = (plate: string | null | undefined): boolean =>
            !!plate && TEST_PLATES.has(plate.replace(/\s+/g, '').toUpperCase());

        // Fetch any active car_rental booking whose pickup OR dropoff sits within ±1h of
        // our requested pickup or dropoff (1h margin around the 15-min check window).
        const crossWindowStart = new Date(Math.min(requestedPickup.getTime(), requestedDropoff.getTime()) - 60 * 60 * 1000).toISOString();
        const crossWindowEnd = new Date(Math.max(requestedPickup.getTime(), requestedDropoff.getTime()) + 60 * 60 * 1000).toISOString();
        const crossUrl = `${SUPABASE_URL}/rest/v1/bookings?select=id,pickup_date,dropoff_date,vehicle_id,vehicle_plate,vehicle_name,customer_name,service_type,status,payment_status&status=not.in.(cancelled,annullata,completed,completata,expired)&service_type=eq.car_rental&or=(and(pickup_date.gte.${crossWindowStart},pickup_date.lte.${crossWindowEnd}),and(dropoff_date.gte.${crossWindowStart},dropoff_date.lte.${crossWindowEnd}))`;

        try {
            const crossResp = await fetch(crossUrl, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                },
            });
            const crossBookings = await crossResp.json();

            if (Array.isArray(crossBookings)) {
                const myPickup = requestedPickup.getTime();
                const myDropoff = requestedDropoff.getTime();

                for (const b of crossBookings) {
                    // Same-vehicle conflicts already handled by the per-vehicle buffer above
                    if (b.vehicle_id && vehicleIds.includes(b.vehicle_id)) continue;
                    if (isTestPlate(b.vehicle_plate)) continue;
                    if (b.status === 'pending_payment' && b.payment_status === 'expired') continue;

                    const otherPickup = new Date(b.pickup_date).getTime();
                    const otherDropoff = new Date(b.dropoff_date).getTime();

                    const pairs: Array<[number, number]> = [
                        [myPickup, otherPickup],
                        [myPickup, otherDropoff],
                        [myDropoff, otherPickup],
                        [myDropoff, otherDropoff],
                    ];

                    const tooClose = pairs.some(([a, c]) => Math.abs(a - c) < CROSS_VEHICLE_GAP_MS);
                    if (tooClose) {
                        conflicts.push({
                            pickup_date: b.pickup_date,
                            dropoff_date: b.dropoff_date,
                            vehicle_name: b.vehicle_name || b.vehicle_plate || 'altro veicolo',
                            cross_vehicle_gap: true,
                        });
                        break;
                    }
                }
            }
        } catch (crossErr) {
            console.error('[checkVehicleAvailability] cross-vehicle gap check failed:', crossErr);
            // Soft-fail — don't block bookings if the cross-gap query errors out
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

        // Find next booking AFTER the requested period (for "must return by" message)
        let nextBookingStart: string | null = null;
        if (Array.isArray(bookings)) {
            for (const b of bookings) {
                const bStart = new Date(b.pickup_date);
                if (bStart > requestedPickup) {
                    // Subtract buffer so customer must return BEFORE the buffer window
                    const mustReturnBy = new Date(bStart.getTime() - BUFFER_TIME_MS);
                    if (!nextBookingStart || mustReturnBy.toISOString() < nextBookingStart) {
                        nextBookingStart = mustReturnBy.toISOString();
                    }
                }
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                conflicts,
                totalVehicles: vehicleIds.length,
                ...(availableFrom && { availableFrom }),
                ...(nextBookingStart && { nextBookingStart }),
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
