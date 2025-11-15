-- Fix Car Wash Duration Calculation
-- Update database functions to use exact duration mapping:
-- €25 = 1 hour (LAVAGGIO COMPLETO)
-- €49 = 2 hours (LAVAGGIO TOP)
-- €75 = 3 hours (LAVAGGIO VIP)
-- €99 = 4 hours (LAVAGGIO DR7 LUXURY)

-- Helper function to calculate duration from price
CREATE OR REPLACE FUNCTION get_carwash_duration_hours(price_euros numeric)
RETURNS integer AS $$
BEGIN
  IF price_euros <= 25 THEN
    RETURN 1;
  ELSIF price_euros <= 49 THEN
    RETURN 2;
  ELSIF price_euros <= 75 THEN
    RETURN 3;
  ELSE
    RETURN 4;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the car wash availability check function
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
    MAX(id),
    MAX(booking_source),
    MAX(appointment_time)
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
      -- Only count bookings that are actually blocking
      (status IN ('confirmed', 'pending') AND payment_status IN ('succeeded', 'completed', 'paid'))
      OR status = 'held'
    )
    AND (
      -- Check for time overlap using the new duration function
      (EXTRACT(HOUR FROM appointment_time::TIME) * 60 + EXTRACT(MINUTE FROM appointment_time::TIME)) < requested_end_minutes
      AND
      (EXTRACT(HOUR FROM appointment_time::TIME) * 60 + EXTRACT(MINUTE FROM appointment_time::TIME) +
       (get_carwash_duration_hours(price_total / 100.0) * 60)) > requested_start_minutes
    );

  IF v_conflict_count > 0 THEN
    RETURN QUERY SELECT
      false,
      v_conflict_id,
      format('Time slot already occupied at %s via %s', v_conflict_time, v_conflict_source);
  ELSE
    RETURN QUERY SELECT true, NULL::uuid, NULL::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the car wash availability trigger
CREATE OR REPLACE FUNCTION check_car_wash_availability()
RETURNS TRIGGER AS $$
DECLARE
  v_check RECORD;
  requested_duration_hours NUMERIC;
BEGIN
  -- Only validate car wash bookings
  IF NEW.service_type = 'car_wash' AND
     NEW.appointment_date IS NOT NULL AND
     NEW.appointment_time IS NOT NULL AND
     NEW.status IN ('confirmed', 'pending', 'held') AND
     (NEW.payment_status IN ('succeeded', 'completed', 'paid') OR NEW.status = 'held' OR TG_OP = 'INSERT') THEN

    -- Calculate service duration using new exact mapping
    requested_duration_hours := get_carwash_duration_hours(NEW.price_total / 100.0);

    -- Use unified availability check
    SELECT * INTO v_check
    FROM check_unified_carwash_availability(
      DATE(NEW.appointment_date),
      NEW.appointment_time,
      requested_duration_hours,
      NEW.id
    );

    IF NOT v_check.is_available THEN
      RAISE EXCEPTION '%', v_check.conflict_message;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION get_carwash_duration_hours IS 'Maps car wash price to duration: €25=1h, €49=2h, €75=3h, €99=4h';
