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

    // Query all bookings for this vehicle
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

    if (!bookings || bookings.length === 0) {
      return []; // No conflicts, vehicle is available
    }

    // Check for date conflicts
    const conflicts: BookingConflict[] = [];

    for (const booking of bookings) {
      const existingPickup = new Date(booking.pickup_date);
      const existingDropoff = new Date(booking.dropoff_date);

      // Check if dates overlap
      // Conflict occurs if:
      // 1. New booking starts during existing booking
      // 2. New booking ends during existing booking
      // 3. New booking completely contains existing booking
      const hasConflict =
        (requestedPickup >= existingPickup && requestedPickup < existingDropoff) || // Starts during existing
        (requestedDropoff > existingPickup && requestedDropoff <= existingDropoff) || // Ends during existing
        (requestedPickup <= existingPickup && requestedDropoff >= existingDropoff); // Completely contains existing

      if (hasConflict) {
        conflicts.push({
          pickup_date: booking.pickup_date,
          dropoff_date: booking.dropoff_date,
          vehicle_name: booking.vehicle_name,
        });
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

    if (!bookings || bookings.length === 0) {
      return [];
    }

    return bookings.map((booking) => ({
      start: new Date(booking.pickup_date),
      end: new Date(booking.dropoff_date),
    }));
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
