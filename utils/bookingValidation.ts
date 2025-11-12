import { supabase } from '../supabaseClient';

export interface BookingConflict {
  pickup_date: string;
  dropoff_date: string;
  vehicle_name: string;
}

/**
 * Check if a vehicle is available for the requested dates
 * @param vehicleName - Name of the vehicle to check
 * @param pickupDate - Requested pickup date (ISO string)
 * @param dropoffDate - Requested dropoff date (ISO string)
 * @returns Array of conflicting bookings, empty if no conflicts
 */
export async function checkVehicleAvailability(
  vehicleName: string,
  pickupDate: string,
  dropoffDate: string
): Promise<BookingConflict[]> {
  try {
    const requestedPickup = new Date(pickupDate);
    const requestedDropoff = new Date(dropoffDate);

    // Query all bookings for this vehicle from bookings table (main website)
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('pickup_date, dropoff_date, vehicle_name, status')
      .eq('vehicle_name', vehicleName)
      .in('status', ['confirmed', 'pending']) // Only check active bookings
      .order('pickup_date', { ascending: true });

    if (error) {
      console.error('Error checking vehicle availability:', error);
      throw error;
    }

    // Query all reservations for this vehicle from reservations table (admin panel)
    // We need to get the vehicle by matching display_name
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('display_name', vehicleName)
      .single();

    let reservations = [];
    if (vehicle) {
      const { data: reservationData, error: reservationError } = await supabase
        .from('reservations')
        .select('start_at, end_at, vehicle_id, status')
        .eq('vehicle_id', vehicle.id)
        .in('status', ['confirmed', 'pending', 'active'])
        .order('start_at', { ascending: true });

      if (reservationError) {
        console.error('Error checking reservations:', reservationError);
      } else {
        reservations = reservationData || [];
      }
    }

    // Check for date conflicts
    const conflicts: BookingConflict[] = [];

    // Helper function to check if dates overlap
    const hasConflict = (existingStart: Date, existingEnd: Date) => {
      return (
        (requestedPickup >= existingStart && requestedPickup < existingEnd) || // Starts during existing
        (requestedDropoff > existingStart && requestedDropoff <= existingEnd) || // Ends during existing
        (requestedPickup <= existingStart && requestedDropoff >= existingEnd) // Completely contains existing
      );
    };

    // Check bookings table conflicts
    if (bookings && bookings.length > 0) {
      for (const booking of bookings) {
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

    // Check reservations table conflicts (from admin panel)
    if (reservations.length > 0) {
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
    // Get bookings from main website
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('pickup_date, dropoff_date')
      .eq('vehicle_name', vehicleName)
      .in('status', ['confirmed', 'pending'])
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
          start: new Date(booking.pickup_date),
          end: new Date(booking.dropoff_date),
        });
      });
    }

    // Add reservations
    if (reservations.length > 0) {
      reservations.forEach((reservation) => {
        unavailableDates.push({
          start: new Date(reservation.start_at),
          end: new Date(reservation.end_at),
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
  const [h, m] = time.split(':').map(Number);
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

    // Query all car wash bookings for the same date with succeeded/completed/paid payment
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('service_type', 'car_wash')
      .in('payment_status', ['succeeded', 'completed', 'paid']);

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
      const bookingDate = new Date(booking.appointment_date).toISOString().split('T')[0];
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
        const bookingDate = new Date(booking.appointment_date);
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
