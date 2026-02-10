import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Booking {
  id: string;
  service_type?: string;
  vehicle_name?: string;
  pickup_date?: string;
  dropoff_date?: string;
  appointment_date?: string;
  appointment_time?: string;
  status: string;
  payment_status?: string;
  price_total: number;
  hold_expires_at?: string;
  held_by?: string;
  booking_source?: string;
  [key: string]: any;
}

interface UseRealtimeBookingsOptions {
  serviceType?: 'car_rental' | 'car_wash' | 'all';
  date?: string; // For filtering by specific date
  vehicleName?: string; // For filtering by specific vehicle
  autoRefresh?: boolean; // Auto-refresh on changes
}

interface UseRealtimeBookingsReturn {
  bookings: Booking[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isSlotAvailable: (params: {
    serviceType: 'car_rental' | 'car_wash';
    vehicleName?: string;
    startTime?: string;
    endTime?: string;
    date?: string;
    time?: string;
    durationHours?: number;
  }) => Promise<{ available: boolean; message?: string }>;
}

export function useRealtimeBookings(
  options: UseRealtimeBookingsOptions = {}
): UseRealtimeBookingsReturn {
  const { serviceType = 'all', date, vehicleName, autoRefresh = true } = options;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch bookings from database
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Select only specific columns to avoid PostgREST issues with the 79-column bookings table
      const columns = 'id,service_type,service_name,appointment_date,appointment_time,price_total,status,payment_status,payment_method,customer_name,customer_email,customer_phone,booking_source,created_at,vehicle_name,vehicle_id,pickup_date,dropoff_date,deposit_amount,insurance_option,booking_usage_zone';

      let query = supabase
        .from('bookings')
        .select(columns);

      // Apply filters - commenting out service_type filter due to PostgREST bug
      // We'll filter in JavaScript instead
      // if (serviceType === 'car_rental') {
      //   query = query.is('service_type', null).not('vehicle_name', 'is', null);
      // } else if (serviceType === 'car_wash') {
      //   query = query.eq('service_type', 'car_wash');
      // }

      if (vehicleName) {
        query = query.eq('vehicle_name', vehicleName);
      }

      if (date && serviceType === 'car_wash') {
        // For car wash, filter by appointment date
        query = query.gte('appointment_date', `${date}T00:00:00`)
                     .lte('appointment_date', `${date}T23:59:59`);
      } else if (date && serviceType === 'car_rental') {
        // For car rental, filter by pickup/dropoff date range
        query = query.or(`pickup_date.lte.${date}T23:59:59,dropoff_date.gte.${date}T00:00:00`);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Filter in JavaScript to avoid PostgREST query issues
      const filtered = (data || []).filter(booking => {
        // Filter by service type
        let matchesService = true;
        if (serviceType === 'car_rental') {
          matchesService = !booking.service_type || booking.service_type !== 'car_wash';
        } else if (serviceType === 'car_wash') {
          matchesService = booking.service_type === 'car_wash';
        }

        // Only include bookings with valid status and payment_status
        const validStatus = ['confirmed', 'pending', 'held'].includes(booking.status);
        const validPayment = ['succeeded', 'completed', 'paid', 'pending'].includes(booking.payment_status);

        return matchesService && validStatus && validPayment;
      });

      setBookings(filtered);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [serviceType, date, vehicleName]);

  // Check if a slot is available
  const isSlotAvailable = useCallback(async (params: {
    serviceType: 'car_rental' | 'car_wash';
    vehicleName?: string;
    startTime?: string;
    endTime?: string;
    date?: string;
    time?: string;
    durationHours?: number;
  }): Promise<{ available: boolean; message?: string }> => {
    try {
      if (params.serviceType === 'car_rental') {
        if (!params.vehicleName || !params.startTime || !params.endTime) {
          throw new Error('Vehicle name, start time, and end time are required for car rental');
        }

        const { data, error } = await supabase.rpc('check_unified_vehicle_availability', {
          p_vehicle_name: params.vehicleName,
          p_start_time: params.startTime,
          p_end_time: params.endTime,
        });

        if (error) throw error;

        return {
          available: data?.[0]?.is_available || false,
          message: data?.[0]?.conflict_message,
        };
      } else {
        // Car wash
        if (!params.date || !params.time || !params.durationHours) {
          throw new Error('Date, time, and duration are required for car wash');
        }

        const { data, error } = await supabase.rpc('check_unified_carwash_availability', {
          p_date: params.date,
          p_time: params.time,
          p_duration_hours: params.durationHours,
        });

        if (error) throw error;

        return {
          available: data?.[0]?.is_available || false,
          message: data?.[0]?.conflict_message,
        };
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      return {
        available: false,
        message: 'Error checking availability',
      };
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    // Initial fetch
    fetchBookings();

    if (!autoRefresh) return;

    // Set up real-time channel
    const realtimeChannel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          console.log('📡 Real-time booking change:', payload);

          // Refetch all bookings to ensure consistency
          fetchBookings();
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    setChannel(realtimeChannel);

    // Cleanup
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [fetchBookings, autoRefresh]);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    isSlotAvailable,
  };
}

// Hook specifically for car wash availability
export function useCarWashAvailability(date?: string) {
  const { bookings, loading, isSlotAvailable, refetch } = useRealtimeBookings({
    serviceType: 'car_wash',
    date,
    autoRefresh: true,
  });

  const getAvailableSlots = useCallback((
    servicePriceEuros: number,
    selectedDate: string
  ): { time: string; available: boolean; reason?: string }[] => {
    const allSlots = [
      '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45',
      '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45',
      '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45',
      '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45'
    ];

    // Calculate duration: €25=1h, €49=2h, €75=3h, €99=4h
    let durationHours = 1;
    if (servicePriceEuros <= 25) durationHours = 1;
    else if (servicePriceEuros <= 49) durationHours = 2;
    else if (servicePriceEuros <= 75) durationHours = 3;
    else durationHours = 4;

    // 2 washers = allow up to 2 concurrent bookings
    const MAX_CONCURRENT_WASHES = 2;

    return allSlots.map(time => {
      const slotStart = timeToMinutes(time);
      const slotEnd = slotStart + (durationHours * 60);

      let overlappingCount = 0;
      for (const booking of bookings) {
        if (!booking.appointment_time) continue;

        const bookingStart = timeToMinutes(booking.appointment_time);
        const bookingPriceEuros = booking.price_total / 100;
        let bookingDuration = 1;
        if (bookingPriceEuros <= 25) bookingDuration = 1;
        else if (bookingPriceEuros <= 49) bookingDuration = 2;
        else if (bookingPriceEuros <= 75) bookingDuration = 3;
        else bookingDuration = 4;
        const bookingEnd = bookingStart + (bookingDuration * 60);

        if (slotStart < bookingEnd && slotEnd > bookingStart) {
          overlappingCount++;
        }
      }

      const full = overlappingCount >= MAX_CONCURRENT_WASHES;
      return {
        time,
        available: !full,
        reason: full ? 'Already booked' : undefined,
      };
    });
  }, [bookings]);

  return {
    bookings,
    loading,
    getAvailableSlots,
    isSlotAvailable,
    refetch,
  };
}

// Hook specifically for vehicle availability
export function useVehicleAvailability(vehicleName?: string) {
  const { bookings, loading, isSlotAvailable, refetch } = useRealtimeBookings({
    serviceType: 'car_rental',
    vehicleName,
    autoRefresh: true,
  });

  const isVehicleAvailable = useCallback(async (
    vehicle: string,
    startDate: string,
    endDate: string
  ): Promise<{ available: boolean; message?: string }> => {
    return isSlotAvailable({
      serviceType: 'car_rental',
      vehicleName: vehicle,
      startTime: startDate,
      endTime: endDate,
    });
  }, [isSlotAvailable]);

  return {
    bookings,
    loading,
    isVehicleAvailable,
    refetch,
  };
}

// Helper function
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
