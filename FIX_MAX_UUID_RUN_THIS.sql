-- ⚠️ RUN THIS IN SUPABASE SQL EDITOR TO FIX CAR WASH BOOKING ERROR
-- This fixes the "function max(uuid) does not exist" error

-- 1. Fix check_unified_vehicle_availability function
CREATE OR REPLACE FUNCTION check_unified_vehicle_availability(
  p_vehicle_name text,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS TABLE(
  is_available boolean,
  conflicting_booking_id uuid,
  conflict_message text
) AS $$
DECLARE
  v_conflict_count integer;
  v_conflict_id uuid;
  v_conflict_source text;
  v_conflict_status text;
BEGIN
  -- First, clean up expired holds
  PERFORM release_expired_holds();

  -- Check for conflicts
  SELECT
    COUNT(*),
    (ARRAY_AGG(id ORDER BY created_at DESC))[1], -- FIXED: use ARRAY_AGG instead of MAX
    (ARRAY_AGG(booking_source ORDER BY created_at DESC))[1],
    (ARRAY_AGG(status ORDER BY created_at DESC))[1]
  INTO
    v_conflict_count,
    v_conflict_id,
    v_conflict_source,
    v_conflict_status
  FROM public.bookings
  WHERE vehicle_name = p_vehicle_name
    AND service_type IS DISTINCT FROM 'car_wash'
    AND id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      (status IN ('confirmed', 'pending') AND payment_status IN ('succeeded', 'completed', 'paid'))
      OR status = 'held'
    )
    AND (
      (p_start_time >= pickup_date AND p_start_time < dropoff_date) OR
      (p_end_time > pickup_date AND p_end_time <= dropoff_date) OR
      (p_start_time <= pickup_date AND p_end_time >= dropoff_date)
    );

  IF v_conflict_count > 0 THEN
    RETURN QUERY SELECT
      false,
      v_conflict_id,
      format('Vehicle already %s via %s (Booking ID: %s)',
        CASE WHEN v_conflict_status = 'held' THEN 'held' ELSE 'booked' END,
        v_conflict_source,
        v_conflict_id
      );
  ELSE
    RETURN QUERY SELECT true, NULL::uuid, NULL::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix check_unified_carwash_availability function
CREATE OR REPLACE FUNCTION check_unified_carwash_availability(
  p_date date,
  p_time text,
  p_duration_hours numeric,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS TABLE(
  is_available boolean,
  conflicting_booking_id uuid,
  conflict_message text
) AS $$
DECLARE
  v_conflict_count integer;
  v_conflict_id uuid;
  v_conflict_source text;
  v_conflict_time text;
  requested_start_minutes integer;
  requested_end_minutes integer;
BEGIN
  -- First, clean up expired holds
  PERFORM release_expired_holds();

  -- Convert time to minutes
  requested_start_minutes := EXTRACT(HOUR FROM p_time::TIME) * 60 + EXTRACT(MINUTE FROM p_time::TIME);
  requested_end_minutes := requested_start_minutes + (p_duration_hours * 60);

  -- Check for conflicts
  SELECT
    COUNT(*),
    (ARRAY_AGG(id ORDER BY created_at DESC))[1], -- FIXED: use ARRAY_AGG instead of MAX
    (ARRAY_AGG(booking_source ORDER BY created_at DESC))[1],
    (ARRAY_AGG(appointment_time ORDER BY created_at DESC))[1]
  INTO
    v_conflict_count,
    v_conflict_id,
    v_conflict_source,
    v_conflict_time
  FROM public.bookings
  WHERE service_type = 'car_wash'
    AND DATE(appointment_date) = p_date
    AND id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      (status IN ('confirmed', 'pending') AND payment_status IN ('succeeded', 'completed', 'paid'))
      OR status = 'held'
    )
    AND (
      (EXTRACT(HOUR FROM appointment_time::TIME) * 60 + EXTRACT(MINUTE FROM appointment_time::TIME)) < requested_end_minutes
      AND
      (EXTRACT(HOUR FROM appointment_time::TIME) * 60 + EXTRACT(MINUTE FROM appointment_time::TIME) +
       (CEIL((price_total / 100.0) / 25.0) * 60)) > requested_start_minutes
    );

  IF v_conflict_count > 0 THEN
    RETURN QUERY SELECT
      false,
      v_conflict_id,
      format('Car wash slot already %s at %s via %s (Booking ID: %s)',
        CASE WHEN EXISTS (
          SELECT 1 FROM public.bookings
          WHERE id = v_conflict_id AND status = 'held'
        ) THEN 'held' ELSE 'booked' END,
        v_conflict_time,
        v_conflict_source,
        v_conflict_id
      );
  ELSE
    RETURN QUERY SELECT true, NULL::uuid, NULL::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
