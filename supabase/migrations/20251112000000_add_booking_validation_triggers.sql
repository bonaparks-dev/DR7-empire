-- Add booking validation triggers to prevent conflicts at database level
-- This ensures both website bookings and admin panel entries respect availability

-- Function to check car wash time slot availability
CREATE OR REPLACE FUNCTION check_car_wash_availability()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INTEGER;
  requested_start_minutes INTEGER;
  requested_end_minutes INTEGER;
  requested_duration_hours NUMERIC;
BEGIN
  -- Only validate car wash bookings with succeeded payment
  IF NEW.service_type = 'car_wash' AND (NEW.payment_status = 'succeeded' OR TG_OP = 'INSERT') THEN

    -- Calculate service duration based on price (25€ = 1 hour)
    requested_duration_hours := CEIL((NEW.price_total / 100.0) / 25.0);

    -- Convert appointment time to minutes
    requested_start_minutes := EXTRACT(HOUR FROM NEW.appointment_time::TIME) * 60 +
                               EXTRACT(MINUTE FROM NEW.appointment_time::TIME);
    requested_end_minutes := requested_start_minutes + (requested_duration_hours * 60);

    -- Check for overlapping bookings on the same date
    SELECT COUNT(*) INTO conflict_count
    FROM bookings
    WHERE
      service_type = 'car_wash'
      AND payment_status = 'succeeded'
      AND DATE(appointment_date) = DATE(NEW.appointment_date)
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND (
        -- Check for time overlap
        (EXTRACT(HOUR FROM appointment_time::TIME) * 60 + EXTRACT(MINUTE FROM appointment_time::TIME)) < requested_end_minutes
        AND
        (EXTRACT(HOUR FROM appointment_time::TIME) * 60 + EXTRACT(MINUTE FROM appointment_time::TIME) +
         (CEIL((price_total / 100.0) / 25.0) * 60)) > requested_start_minutes
      );

    IF conflict_count > 0 THEN
      RAISE EXCEPTION 'Car wash time slot conflict: This time slot is already booked. Please choose a different time.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check car rental vehicle availability
CREATE OR REPLACE FUNCTION check_vehicle_availability()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Only validate car rental bookings
  IF (NEW.service_type IS NULL OR NEW.service_type != 'car_wash') AND
     NEW.vehicle_name IS NOT NULL AND
     NEW.pickup_date IS NOT NULL AND
     NEW.dropoff_date IS NOT NULL THEN

    -- Check for overlapping bookings for the same vehicle
    SELECT COUNT(*) INTO conflict_count
    FROM bookings
    WHERE
      vehicle_name = NEW.vehicle_name
      AND status IN ('confirmed', 'pending')
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND (
        -- Check for date overlap
        (NEW.pickup_date >= pickup_date AND NEW.pickup_date < dropoff_date) OR
        (NEW.dropoff_date > pickup_date AND NEW.dropoff_date <= dropoff_date) OR
        (NEW.pickup_date <= pickup_date AND NEW.dropoff_date >= dropoff_date)
      );

    IF conflict_count > 0 THEN
      RAISE EXCEPTION 'Vehicle availability conflict: This vehicle is already booked for the selected dates. Please choose different dates.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS validate_car_wash_booking ON bookings;
DROP TRIGGER IF EXISTS validate_vehicle_booking ON bookings;

-- Create triggers for INSERT and UPDATE
CREATE TRIGGER validate_car_wash_booking
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_car_wash_availability();

CREATE TRIGGER validate_vehicle_booking
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_vehicle_availability();

-- Add helpful comment
COMMENT ON FUNCTION check_car_wash_availability() IS 'Validates car wash bookings to prevent double-booking time slots';
COMMENT ON FUNCTION check_vehicle_availability() IS 'Validates car rental bookings to prevent double-booking vehicles';
