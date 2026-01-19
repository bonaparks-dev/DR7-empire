import { supabase } from '../supabaseClient';

export interface BookingConflict {
  pickup_date: string;
  dropoff_date: string;
  vehicle_name: string;
}

export interface VehicleUnavailabilityInfo {
  isPartiallyUnavailable: boolean;
  unavailableFrom?: string;
  unavailableUntil?: string;
  unavailableFromTime?: string;
  unavailableUntilTime?: string;
  reason?: string;
  availableAfter?: string;
}

/**
 * Helper to safely parse dates for all browsers (especially Safari)
 * Replaces space with T in ISO-like strings: "2023-01-01 10:00:00" -> "2023-01-01T10:00:00"
 */
export function safeDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) return dateStr;
  if (!dateStr) return new Date();

  // If it's a string like "YYYY-MM-DD HH:mm:ss", replace space with T
  if (typeof dateStr === 'string' && dateStr.includes(' ')) {
    return new Date(dateStr.replace(' ', 'T'));
  }

  return new Date(dateStr);
}

/**
 * Check if any vehicle in a group is available for the requested dates
 * @param vehicles - Array of vehicle objects { name: string, id: string } to check
 * @param pickupDate - Requested pickup date (ISO string)
 * @param dropoffDate - Requested dropoff date (ISO string)
 * @returns Object with availability info and first available vehicle name/id
 */
export async function checkGroupedVehicleAvailability(
  vehicles: Array<{ name: string; id: string }>,
  pickupDate: string,
  dropoffDate: string
): Promise<{ isAvailable: boolean; availableVehicleName?: string; availableVehicleId?: string; conflicts?: BookingConflict[]; closestAvailableDate?: Date }> {
  try {
    const requestedPickup = safeDate(pickupDate);
    const requestedDropoff = safeDate(dropoffDate);
    const BUFFER_TIME_MS = 90 * 60 * 1000;

    // Helper to check conflict
    const hasConflict = (existingStart: Date, existingEnd: Date) => {
      const existingEndWithBuffer = new Date(existingEnd.getTime() + BUFFER_TIME_MS);
      return (
        (requestedPickup >= existingStart && requestedPickup < existingEndWithBuffer) ||
        (requestedDropoff > existingStart && requestedDropoff <= existingEndWithBuffer) ||
        (requestedPickup <= existingStart && requestedDropoff >= existingEndWithBuffer)
      );
    };

    // 1. Fetch ALL bookings for this vehicle name (group name)
    // We assume all vehicles in the group share the same "vehicle_name" in bookings if booked generally
    // Or they might have specific names. But 'vehicles' input usually share a display name or we check individually?
    // Actually, usually they share the main name. Let's assume we check for the *name of the first vehicle* essentially?
    // Or we should query for ANY of the names in the group.

    // Simplification: We query bookings where vehicle_name matches ANY of the group's names
    const names = Array.from(new Set(vehicles.map(v => v.name)));
    const ids = vehicles.map(v => v.id);

    // Fetch bookings for these names
    const { data: bookings } = await supabase
      .from('bookings')
      .select('pickup_date, dropoff_date, vehicle_name, booking_details')
      .in('vehicle_name', names)
      .neq('status', 'cancelled');

    // Fetch reservations for these IDs
    const { data: reservations } = await supabase
      .from('reservations')
      .select('start_at, end_at, vehicle_id, vehicle_name') // vehicle_name for fallback
      .in('vehicle_id', ids)
      .in('status', ['confirmed', 'pending', 'active']);

    // 2. Identify Unavailable Vehicles (Specific ID conflicts)
    const blockedVehicleIds = new Set<string>();
    let genericConflictCount = 0;
    const relevantConflicts: BookingConflict[] = [];

    // Process Specific ID conflicts first
    if (bookings) {
      for (const b of bookings) {
        const p = safeDate(b.pickup_date);
        const d = safeDate(b.dropoff_date);
        if (hasConflict(p, d)) {
          const bookedId = (b.booking_details as any)?.vehicle_id;
          if (bookedId && ids.includes(bookedId)) {
            blockedVehicleIds.add(bookedId);
          } else {
            // Generic conflict (no ID or ID not in list but name matches)
            genericConflictCount++;
          }
          relevantConflicts.push({ pickup_date: b.pickup_date, dropoff_date: b.dropoff_date, vehicle_name: b.vehicle_name });
        }
      }
    }

    if (reservations) {
      for (const r of reservations) {
        const s = safeDate(r.start_at);
        const e = safeDate(r.end_at);
        if (hasConflict(s, e)) {
          if (r.vehicle_id && ids.includes(r.vehicle_id)) {
            blockedVehicleIds.add(r.vehicle_id);
          } else {
            // Should generally not happen for admin reservations, but treat as generic if ID missing
            genericConflictCount++;
          }
          relevantConflicts.push({ pickup_date: r.start_at, dropoff_date: r.end_at, vehicle_name: r.vehicle_name || 'Reservation' });
        }
      }
    }

    // 3. Filter Candidates
    const candidates = vehicles.filter(v => !blockedVehicleIds.has(v.id));

    // 4. Apply Generic Conflicts (pool reduction)
    // We have 'genericConflictCount' bookings that take up *some* slot but we don't know which.
    // So we subtract them from the remaining candidates.
    const availableCount = candidates.length - genericConflictCount;

    if (availableCount > 0) {
      // We have at least one car left!
      // Return the first candidate that effectively "survives" the subtraction
      // (Any of the candidates is valid, as the generic bookings don't care which one they take)
      const winner = candidates[0];
      return {
        isAvailable: true,
        availableVehicleName: winner.name,
        availableVehicleId: winner.id
      };
    }

    // Not available
    // For close-date suggestion, we can just use the end of the last conflict found
    // (Simplified logic)
    let closestAvailableDate: Date | undefined;
    if (relevantConflicts.length > 0) {
      // Sort by end date descending to find the latest blocker? 
      // No, we want the earliest hole. That's complex. 
      // Just return end of the first conflict + buffer for now as a naive suggestion
      const lastConflict = relevantConflicts.sort((a, b) => new Date(a.dropoff_date).getTime() - new Date(b.dropoff_date).getTime())[0];
      closestAvailableDate = new Date(safeDate(lastConflict.dropoff_date).getTime() + (90 * 60 * 1000));
    }

    return {
      isAvailable: false,
      conflicts: relevantConflicts,
      closestAvailableDate
    };

  } catch (error) {
    console.error('Error checking grouped vehicle availability:', error);
    throw error;
  }
}

/**
 * Check if a vehicle is available for the requested dates
 * Also enforces 1h30 buffer between bookings
 * @param vehicleName - Name of the vehicle to check
 * @param pickupDate - Requested pickup date (ISO string)
 * @param dropoffDate - Requested dropoff date (ISO string)
 * @param targetVehicleId - Optional specific vehicle ID to check against (if stored in booking_details)
 * @returns Array of conflicting bookings, empty if no conflicts
 */
export async function checkVehicleAvailability(
  vehicleName: string,
  pickupDate: string,
  dropoffDate: string,
  targetVehicleId?: string
): Promise<BookingConflict[]> {
  try {
    const requestedPickup = safeDate(pickupDate);
    const requestedDropoff = safeDate(dropoffDate);

    // Buffer time in milliseconds (1h30 = 90 minutes)
    const BUFFER_TIME_MS = 90 * 60 * 1000;

    // Get vehicle plate - this is the most reliable way to match bookings
    // Targa (license plate) is unique and doesn't have spacing/capitalization issues
    const { data: vehicleData } = await supabase
      .from('vehicles')
      .select('plate')
      .eq('display_name', vehicleName)
      .single();

    const vehiclePlate = vehicleData?.plate;

    // Query bookings - prioritize matching by license plate (targa)
    // Only fall back to name matching if plate is not available
    let query = supabase
      .from('bookings')
      .select('pickup_date, dropoff_date, vehicle_name, vehicle_plate, status, booking_source, booking_details')
      .neq('status', 'cancelled')
      .order('pickup_date', { ascending: true });

    if (vehiclePlate) {
      // PRIMARY: Match by license plate (most reliable)
      query = query.eq('vehicle_plate', vehiclePlate);
    } else {
      // FALLBACK: Match by name only if no plate available
      // Use case-insensitive partial matching to handle spacing/capitalization
      query = query.ilike('vehicle_name', `%${vehicleName.trim()}%`);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error checking vehicle availability:', error);
      throw error;
    }

    // Query all reservations for this vehicle from reservations table (admin panel)
    // We need to get the vehicle by matching display_name
    // Admin reservations are explicitly linked to vehicle_id usually, but here we query by name first?
    // Actually, Admin reservations rely on vehicle_id in the table 'reservations'.
    // If we have targetVehicleId, we should use that to filter reservations precisely.
    // If NOT, we have to look up by name.

    let reservations: any[] = [];

    if (targetVehicleId) {
      // If we know the ID, we can query reservations directly by vehicle_id
      const { data: reservationData, error: reservationError } = await supabase
        .from('reservations')
        .select('start_at, end_at, vehicle_id, status')
        .eq('vehicle_id', targetVehicleId)
        .in('status', ['confirmed', 'pending', 'active'])
        .order('start_at', { ascending: true });

      if (!reservationError && reservationData) {
        reservations = reservationData;
      }
    } else {
      // Fallback: look up by name
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('id')
        .eq('display_name', vehicleName)
        .single();

      if (vehicle) {
        const { data: reservationData, error: reservationError } = await supabase
          .from('reservations')
          .select('start_at, end_at, vehicle_id, status')
          .eq('vehicle_id', vehicle.id)
          .in('status', ['confirmed', 'pending', 'active'])
          .order('start_at', { ascending: true });

        if (!reservationError && reservationData) {
          reservations = reservationData;
        }
      }
    }

    // Check for date conflicts
    const conflicts: BookingConflict[] = [];

    // Helper function to check if dates overlap (including 1h30 buffer)
    const hasConflict = (existingStart: Date, existingEnd: Date) => {
      // Add 1h30 buffer after the existing booking ends
      const existingEndWithBuffer = new Date(existingEnd.getTime() + BUFFER_TIME_MS);

      return (
        (requestedPickup >= existingStart && requestedPickup < existingEndWithBuffer) || // Starts during existing + buffer
        (requestedDropoff > existingStart && requestedDropoff <= existingEndWithBuffer) || // Ends during existing + buffer
        (requestedPickup <= existingStart && requestedDropoff >= existingEndWithBuffer) // Completely contains existing + buffer
      );
    };

    // Check bookings table conflicts
    if (bookings && bookings.length > 0) {
      for (const booking of bookings) {
        // Smart filtering:
        // If we are checking for a specific vehicle ID (targetVehicleId):
        // - We ignore bookings that represent a DIFFERENT vehicle ID (bookedId != targetId)
        // - We MUST count bookings that have NO vehicle ID (legacy/name-only bookings) as conflicts to be safe
        // - We MUST count bookings that MATCH our ID

        if (targetVehicleId) {
          // Check if booking has a specific ID stored in details
          const bookedId = (booking.booking_details as any)?.vehicle_id;

          // If booking has a specific ID and it's DIFFERENT from target, it's NOT a conflict for this specific car
          if (bookedId && bookedId !== targetVehicleId) {
            continue;
          }
        }

        const existingPickup = safeDate(booking.pickup_date);
        const existingDropoff = safeDate(booking.dropoff_date);

        if (hasConflict(existingPickup, existingDropoff)) {
          conflicts.push({
            pickup_date: booking.pickup_date,
            dropoff_date: booking.dropoff_date,
            vehicle_name: booking.vehicle_name,
          });
        }
      }
    }

    // Check reservations table conflicts (from admin panel)
    if (reservations.length > 0) {
      for (const reservation of reservations) {
        const existingStart = safeDate(reservation.start_at);
        const existingEnd = safeDate(reservation.end_at);

        if (hasConflict(existingStart, existingEnd)) {
          conflicts.push({
            pickup_date: reservation.start_at,
            dropoff_date: reservation.end_at,
            vehicle_name: vehicleName,
          });
        }
      }
    }

    return conflicts;
  } catch (error) {
    console.error('Error in checkVehicleAvailability:', error);
    throw error;
  }
}

/**
 * Get all unavailable date ranges for a vehicle
 * @param vehicleName - Name of the vehicle
 * @returns Array of date ranges that are blocked
 */
export async function getUnavailableDateRanges(vehicleName: string): Promise<Array<{ start: Date; end: Date }>> {
  try {
    // Get bookings from main website + admin panel
    // Admin bookings should ALWAYS block slots regardless of payment/status
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('pickup_date, dropoff_date')
      .eq('vehicle_name', vehicleName)
      .neq('status', 'cancelled') // Only exclude cancelled bookings
      .order('pickup_date', { ascending: true });

    if (error) {
      console.error('Error fetching unavailable dates:', error);
      throw error;
    }

    // Get reservations from admin panel
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('display_name', vehicleName)
      .single();

    let reservations = [];
    if (vehicle) {
      const { data: reservationData, error: reservationError } = await supabase
        .from('reservations')
        .select('start_at, end_at')
        .eq('vehicle_id', vehicle.id)
        .in('status', ['confirmed', 'pending', 'active'])
        .order('start_at', { ascending: true });

      if (!reservationError && reservationData) {
        reservations = reservationData;
      }
    }

    // Combine both bookings and reservations
    const unavailableDates: Array<{ start: Date; end: Date }> = [];

    // Add bookings
    if (bookings && bookings.length > 0) {
      bookings.forEach((booking) => {
        unavailableDates.push({
          start: safeDate(booking.pickup_date),
          end: safeDate(booking.dropoff_date),
        });
      });
    }

    // Add reservations
    if (reservations.length > 0) {
      reservations.forEach((reservation) => {
        unavailableDates.push({
          start: safeDate(reservation.start_at),
          end: safeDate(reservation.end_at),
        });
      });
    }

    return unavailableDates;
  } catch (error) {
    console.error('Error in getUnavailableDateRanges:', error);
    throw error;
  }
}

/**
 * Check if a vehicle has partial-day unavailability (e.g., at mechanic for a few hours)
 * @param vehicleName - Name of the vehicle
 * @param requestedDate - Date to check (YYYY-MM-DD format)
 * @param requestedPickupTime - Optional pickup time to check (HH:MM format)
 * @returns Unavailability info if vehicle is partially unavailable
 */
export async function checkVehiclePartialUnavailability(
  vehicleName: string,
  requestedDate: string,
  requestedPickupTime?: string
): Promise<VehicleUnavailabilityInfo> {
  try {
    // Get vehicle data with metadata
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('display_name', vehicleName)
      .single();

    if (error || !vehicle) {
      return { isPartiallyUnavailable: false };
    }

    // Check if vehicle is marked as unavailable
    if (vehicle.status !== 'unavailable') {
      return { isPartiallyUnavailable: false };
    }

    const metadata = vehicle.metadata as any;
    const unavailableFrom = metadata?.unavailable_from;
    const unavailableUntil = metadata?.unavailable_until;
    const unavailableFromTime = metadata?.unavailable_from_time;
    const unavailableUntilTime = metadata?.unavailable_until_time;
    const reason = metadata?.unavailable_reason;

    // If no date range specified, vehicle is fully unavailable
    if (!unavailableFrom || !unavailableUntil) {
      return { isPartiallyUnavailable: false };
    }

    // Check if requested date falls within unavailability range
    const requested = safeDate(requestedDate);
    const fromDate = safeDate(unavailableFrom);
    const untilDate = safeDate(unavailableUntil);

    // Normalize dates to midnight for comparison
    requested.setHours(0, 0, 0, 0);
    fromDate.setHours(0, 0, 0, 0);
    untilDate.setHours(0, 0, 0, 0);

    const isInRange = requested >= fromDate && requested <= untilDate;

    if (!isInRange) {
      return { isPartiallyUnavailable: false };
    }

    // If times are specified, it's partial-day unavailability
    // Check that times are valid strings with content
    const hasValidTimes = unavailableFromTime &&
      unavailableUntilTime &&
      typeof unavailableFromTime === 'string' &&
      typeof unavailableUntilTime === 'string' &&
      unavailableFromTime.trim() !== '' &&
      unavailableUntilTime.trim() !== '';

    if (hasValidTimes) {
      // Add 1h30 buffer to unavailability end time (same as booking buffer)
      const BUFFER_MINUTES = 90;
      const unavailableEndMinutes = timeToMinutes(unavailableUntilTime);
      const availableAfterMinutes = unavailableEndMinutes + BUFFER_MINUTES;

      // Convert back to HH:MM format
      const hours = Math.floor(availableAfterMinutes / 60);
      const minutes = availableAfterMinutes % 60;
      const availableAfterTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      // If pickup time is provided, check if it conflicts with unavailability + buffer
      if (requestedPickupTime && typeof requestedPickupTime === 'string') {
        const pickupMinutes = timeToMinutes(requestedPickupTime);

        // If pickup time is before the vehicle becomes available (including buffer), show warning
        if (pickupMinutes < availableAfterMinutes) {
          return {
            isPartiallyUnavailable: true,
            unavailableFrom,
            unavailableUntil,
            unavailableFromTime,
            unavailableUntilTime,
            reason,
            availableAfter: availableAfterTime
          };
        }
        // Pickup time is after vehicle becomes available (with buffer) - no warning needed
        return { isPartiallyUnavailable: false };
      }

      // No pickup time provided - just indicate partial unavailability with buffer
      return {
        isPartiallyUnavailable: true,
        unavailableFrom,
        unavailableUntil,
        unavailableFromTime,
        unavailableUntilTime,
        reason,
        availableAfter: availableAfterTime
      };
    }

    // Full-day unavailability (no times specified)
    return { isPartiallyUnavailable: false };
  } catch (error) {
    console.error('Error checking vehicle partial unavailability:', error);
    return { isPartiallyUnavailable: false };
  }
}

/**
 * Calculate the number of days between two dates (inclusive)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days
 */
export function calculateDays(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Helper to get service duration in hours based on price
 * Each 25€ = 1 hour (€25=1h, €49=2h, €75=3h, €99=4h)
 * @param priceInEuros - Service price in euros
 * @returns Duration in hours
 */
function getServiceDurationInHours(priceInEuros: number): number {
  return Math.ceil(priceInEuros / 25);
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 * @param time - Time string in HH:MM format
 * @returns Minutes since midnight
 */
function timeToMinutes(time: string): number {
  if (!time || typeof time !== 'string') {
    console.error('Invalid time format:', time);
    return 0;
  }

  const parts = time.split(':');
  if (parts.length !== 2) {
    console.error('Invalid time format (expected HH:MM):', time);
    return 0;
  }

  const [h, m] = parts.map(Number);
  if (isNaN(h) || isNaN(m)) {
    console.error('Invalid time values:', time);
    return 0;
  }

  return h * 60 + m;
}

/**
 * Check if a car wash time slot is available
 * @param appointmentDate - Date of appointment (YYYY-MM-DD format)
 * @param appointmentTime - Time of appointment (HH:MM format)
 * @param servicePriceInEuros - Price of the service in euros
 * @param excludeBookingId - Optional booking ID to exclude from check (for edits)
 * @returns Object with isAvailable flag and conflict info
 */
export async function checkCarWashAvailability(
  appointmentDate: string,
  appointmentTime: string,
  servicePriceInEuros: number,
  excludeBookingId?: string
): Promise<{ isAvailable: boolean; conflictingBooking?: any; message?: string }> {
  try {
    // Get the duration for the requested service
    const requestedDuration = getServiceDurationInHours(servicePriceInEuros);
    const requestedStartMinutes = timeToMinutes(appointmentTime);
    const requestedEndMinutes = requestedStartMinutes + (requestedDuration * 60);

    // Query all car wash bookings for the same date
    // Admin bookings should ALWAYS block slots regardless of payment/status
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('service_type', 'car_wash')
      .neq('status', 'cancelled'); // Only exclude cancelled bookings

    // Filter by date (appointment_date contains full timestamp, so we need to filter by date part)
    const { data: allBookings, error } = await query;

    if (error) {
      console.error('Error checking car wash availability:', error);
      throw error;
    }

    // Filter by date in code since appointment_date comparison needs special handling
    const bookingsOnDate = (allBookings || []).filter(booking => {
      // Exclude the booking being edited
      if (excludeBookingId && booking.id === excludeBookingId) {
        return false;
      }

      if (!booking.appointment_date) return false;
      const bookingDate = safeDate(booking.appointment_date).toISOString().split('T')[0];
      return bookingDate === appointmentDate;
    });

    // Check for time conflicts
    for (const booking of bookingsOnDate) {
      if (!booking.appointment_time || !booking.price_total) continue;

      const bookingStartMinutes = timeToMinutes(booking.appointment_time);
      const bookingDuration = getServiceDurationInHours(booking.price_total / 100);
      const bookingEndMinutes = bookingStartMinutes + (bookingDuration * 60);

      // Check if there's any overlap
      const hasOverlap = (
        requestedStartMinutes < bookingEndMinutes &&
        requestedEndMinutes > bookingStartMinutes
      );

      if (hasOverlap) {
        const bookingDate = safeDate(booking.appointment_date);
        return {
          isAvailable: false,
          conflictingBooking: booking,
          message: `❌ Questo orario non è disponibile. È già prenotato dalle ${booking.appointment_time} per ${bookingDuration} ora/e.`
        };
      }
    }

    return { isAvailable: true };
  } catch (error) {
    console.error('Error in checkCarWashAvailability:', error);
    throw error;
  }
}
