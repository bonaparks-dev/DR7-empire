import { Handler } from '@netlify/functions';
import { getCorsOrigin } from './utils/cors';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUFFER_TIME_MS = 90 * 60 * 1000; // 90 minutes

interface Interval {
    start: Date;
    end: Date;
}

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

function intersectIntervalLists(list1: Interval[], list2: Interval[]): Interval[] {
    const result: Interval[] = [];
    let i = 0, j = 0;
    while (i < list1.length && j < list2.length) {
        const start = new Date(Math.max(list1[i].start.getTime(), list2[j].start.getTime()));
        const end = new Date(Math.min(list1[i].end.getTime(), list2[j].end.getTime()));
        if (start < end) result.push({ start, end });
        if (list1[i].end.getTime() < list2[j].end.getTime()) i++;
        else j++;
    }
    return result;
}

/**
 * Check availability for ALL vehicles in a category for given pickup/dropoff dates.
 * Returns which vehicle groups are available and which specific vehicle IDs to use.
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
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { category, pickupDate, dropoffDate } = JSON.parse(event.body || '{}');

        if (!category || !pickupDate || !dropoffDate) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'category, pickupDate, and dropoffDate are required' }),
            };
        }

        const pickup = new Date(pickupDate);
        const dropoff = new Date(dropoffDate);

        // 1. Fetch all non-retired vehicles in this category
        const vehiclesUrl = `${SUPABASE_URL}/rest/v1/vehicles?select=id,display_name,plate,status,daily_rate,category,metadata&category=eq.${category}&status=neq.retired&order=display_name.asc`;
        const vehiclesResponse = await fetch(vehiclesUrl, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        const vehicles = await vehiclesResponse.json();

        if (!Array.isArray(vehicles) || vehicles.length === 0) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ availableVehicles: [], totalVehicles: 0 }),
            };
        }

        const allVehicleIds = vehicles.map((v: any) => v.id);
        const allPlates = vehicles.map((v: any) => v.plate).filter(Boolean);

        // 2. Fetch bookings overlapping the requested period
        const bookingsUrl = `${SUPABASE_URL}/rest/v1/bookings?select=pickup_date,dropoff_date,vehicle_id,vehicle_plate,service_type&vehicle_id=in.(${allVehicleIds.join(',')})&status=not.in.(cancelled,annullata,completed,completata,expired)&dropoff_date=gte.${pickup.toISOString()}&pickup_date=lte.${dropoff.toISOString()}`;
        const bookingsResponse = await fetch(bookingsUrl, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        let bookings = await bookingsResponse.json();

        // Also fetch by plate
        if (allPlates.length > 0) {
            const plateBookingsUrl = `${SUPABASE_URL}/rest/v1/bookings?select=pickup_date,dropoff_date,vehicle_id,vehicle_plate,service_type&vehicle_plate=in.(${allPlates.join(',')})&status=not.in.(cancelled,annullata,completed,completata,expired)&dropoff_date=gte.${pickup.toISOString()}&pickup_date=lte.${dropoff.toISOString()}`;
            const plateResponse = await fetch(plateBookingsUrl, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                },
            });
            const plateBookings = await plateResponse.json();
            if (Array.isArray(plateBookings)) {
                const seenKeys = new Set((bookings || []).map((b: any) => `${b.pickup_date}_${b.dropoff_date}_${b.vehicle_id}`));
                for (const pb of plateBookings) {
                    const key = `${pb.pickup_date}_${pb.dropoff_date}_${pb.vehicle_id}`;
                    if (!seenKeys.has(key)) {
                        bookings.push(pb);
                        seenKeys.add(key);
                    }
                }
            }
        }

        // 3. Fetch reservations overlapping the requested period
        const reservationsUrl = `${SUPABASE_URL}/rest/v1/reservations?select=start_at,end_at,vehicle_id,status&vehicle_id=in.(${allVehicleIds.join(',')})&status=not.in.(cancelled,annullata,completed,completata,expired)&end_at=gte.${pickup.toISOString()}&start_at=lte.${dropoff.toISOString()}`;
        const reservationsResponse = await fetch(reservationsUrl, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        const reservations = await reservationsResponse.json();

        // 4. Build busy intervals per vehicle
        const busyByVehicle: Map<string, Interval[]> = new Map();
        for (const v of vehicles) {
            busyByVehicle.set(v.id, []);
        }

        // Add maintenance/unavailability blocks from metadata
        for (const vehicle of vehicles) {
            if (!vehicle.metadata) continue;
            const { unavailable_from, unavailable_until, unavailable_from_time, unavailable_until_time } = vehicle.metadata;
            if (!unavailable_from) continue;
            const fromTime = unavailable_from_time || '00:00';
            const untilTime = unavailable_until_time || '23:59';
            const blockStart = new Date(`${unavailable_from}T${fromTime}:00`);
            const blockEnd = unavailable_until
                ? new Date(`${unavailable_until}T${untilTime}:00`)
                : new Date('2099-12-31T23:59:00');
            busyByVehicle.get(vehicle.id)!.push({ start: blockStart, end: blockEnd });
        }

        // Add bookings (buffer ONLY after, not before)
        if (Array.isArray(bookings)) {
            for (const b of bookings) {
                if (b.service_type === 'car_wash' || !b.vehicle_id) continue;
                const vehicleBusy = busyByVehicle.get(b.vehicle_id);
                if (vehicleBusy) {
                    vehicleBusy.push({
                        start: new Date(b.pickup_date),
                        end: new Date(new Date(b.dropoff_date).getTime() + BUFFER_TIME_MS),
                    });
                }
            }
        }

        // Add reservations
        if (Array.isArray(reservations)) {
            for (const r of reservations) {
                if (!r.vehicle_id) continue;
                const vehicleBusy = busyByVehicle.get(r.vehicle_id);
                if (vehicleBusy) {
                    vehicleBusy.push({
                        start: new Date(r.start_at),
                        end: new Date(new Date(r.end_at).getTime() + BUFFER_TIME_MS),
                    });
                }
            }
        }

        // 5. Group vehicles by display_group or display_name
        const normalizeKey = (str: string) => (str || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const groups: Map<string, any[]> = new Map();

        for (const v of vehicles) {
            const key = v.metadata?.display_group || normalizeKey(v.display_name);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(v);
        }

        // 6. For each group, check if at least one vehicle is available
        const requestedInterval: Interval = { start: pickup, end: dropoff };

        // Returns: false if available, or the earliest time it becomes available (ISO string) if busy same-day
        const getVehicleBusyInfo = (vehicleId: string): { busy: boolean; availableFrom?: string } => {
            const intervals = mergeIntervals(busyByVehicle.get(vehicleId) || []);
            for (const busy of intervals) {
                if (busy.start < requestedInterval.end && busy.end > requestedInterval.start) {
                    // Vehicle is busy — but check if it becomes available same day as pickup
                    const busyEndDate = busy.end.toISOString().split('T')[0];
                    const pickupDateStr = pickup.toISOString().split('T')[0];
                    if (busyEndDate === pickupDateStr && busy.end < requestedInterval.end) {
                        // Returns same day — vehicle available after busy.end
                        return { busy: true, availableFrom: busy.end.toISOString() };
                    }
                    return { busy: true };
                }
            }
            return { busy: false };
        };

        const availableVehicles: any[] = [];

        for (const [groupKey, members] of groups.entries()) {
            // Find fully available members
            const availableMembers = members.filter(m => {
                if (m.status !== 'available') return false;
                if (m.metadata?.booking_disabled) return false;
                return !getVehicleBusyInfo(m.id).busy;
            });

            // Find same-day available members (returning today)
            let availableFrom: string | null = null;
            if (availableMembers.length === 0) {
                for (const m of members) {
                    if (m.status !== 'available' || m.metadata?.booking_disabled) continue;
                    const info = getVehicleBusyInfo(m.id);
                    if (info.availableFrom) {
                        // Pick the earliest availableFrom across all vehicles in group
                        if (!availableFrom || info.availableFrom < availableFrom) {
                            availableFrom = info.availableFrom;
                        }
                    }
                }
            }

            if (availableMembers.length > 0 || availableFrom) {
                const representative = availableMembers[0] || members[0];
                availableVehicles.push({
                    vehicleId: representative.id,
                    vehicleIds: members.map((m: any) => m.id),
                    availableVehicleIds: availableMembers.map((m: any) => m.id),
                    plates: members.map((m: any) => m.plate).filter(Boolean),
                    displayName: representative.display_name,
                    displayGroup: groupKey,
                    dailyRate: representative.daily_rate,
                    category: representative.category,
                    metadata: representative.metadata,
                    availableCount: availableMembers.length,
                    totalCount: members.length,
                    ...(availableFrom && { availableFrom }),
                });
            }
        }

        console.log(`[checkCategoryAvailability] Category ${category}: ${availableVehicles.length}/${groups.size} groups available for ${pickupDate} - ${dropoffDate}`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                availableVehicles,
                totalGroups: groups.size,
                totalVehicles: vehicles.length,
                pickupDate,
                dropoffDate,
            }),
        };
    } catch (error: any) {
        console.error('[checkCategoryAvailability] Error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to check availability', details: error.message }),
        };
    }
};
