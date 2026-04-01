-- Exclude "Lavaggio Rientro" (internal return washes) from car wash availability checks
-- These should NOT block external car wash booking slots

CREATE OR REPLACE FUNCTION check_car_wash_availability()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INTEGER;
  requested_start_minutes INTEGER;
  requested_end_minutes INTEGER;
  requested_duration_hours NUMERIC;
BEGIN
  -- Only validate car wash bookings with succeeded/completed/paid payment
  IF NEW.service_type = 'car_wash' AND (NEW.payment_status IN ('succeeded', 'completed', 'paid') OR TG_OP = 'INSERT') THEN

    -- Skip validation for internal "Lavaggio Rientro" bookings
    IF NEW.customer_name = 'Lavaggio Rientro' OR NEW.guest_name = 'Lavaggio Rientro' THEN
      RETURN NEW;
    END IF;

    -- Calculate service duration based on price (25€ = 1 hour)
    requested_duration_hours := CEIL((NEW.price_total / 100.0) / 25.0);

    -- Convert appointment time to minutes
    requested_start_minutes := EXTRACT(HOUR FROM NEW.appointment_time::TIME) * 60 +
                               EXTRACT(MINUTE FROM NEW.appointment_time::TIME);
    requested_end_minutes := requested_start_minutes + (requested_duration_hours * 60);

    -- Check for overlapping bookings on the same date
    -- EXCLUDE "Lavaggio Rientro" from conflict detection
    SELECT COUNT(*) INTO conflict_count
    FROM bookings
    WHERE
      service_type = 'car_wash'
      AND payment_status IN ('succeeded', 'completed', 'paid')
      AND DATE(appointment_date) = DATE(NEW.appointment_date)
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND customer_name != 'Lavaggio Rientro'
      AND COALESCE(guest_name, '') != 'Lavaggio Rientro'
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
