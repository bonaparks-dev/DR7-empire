DO $$
DECLARE
  v_user_email TEXT := 'massimorunchina69@gmail.com';
  v_user_id UUID;
  v_vehicle_name TEXT := 'Mercedes C63 S AMG';
  v_start_date TIMESTAMPTZ := '2025-12-30 12:00:00+01';
  v_end_date TIMESTAMPTZ := '2025-12-31 10:30:00+01';
  v_total_price_cents INTEGER := 18000; -- Approx €180 (10% off €200) - Adjust if needed but this is a reasonable estimate for paid amount
  v_booking_id UUID;
BEGIN
  -- 1. Get User ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User % not found', v_user_email;
  END IF;

  -- 2. Insert Booking
  INSERT INTO public.bookings (
    user_id,
    vehicle_name,
    pickup_date,
    dropoff_date,
    price_total,
    currency,
    status,
    payment_status,
    payment_method,
    booking_source,
    booked_at,
    booking_details
  ) VALUES (
    v_user_id,
    v_vehicle_name,
    v_start_date,
    v_end_date,
    v_total_price_cents,
    'EUR',
    'confirmed',
    'succeeded', -- Assume paid as user claims
    'credit',
    'admin', -- Marked as admin restoration
    NOW(),
    jsonb_build_object(
      'customer', jsonb_build_object(
        'email', v_user_email,
        'fullName', 'Massimo Runchina (Restored)'
      ),
      'restored_reason', 'Manual fix for missing credit booking'
    )
  ) RETURNING id INTO v_booking_id;

  RAISE NOTICE 'SUCCESS: Restored booking % for %', v_booking_id, v_user_email;
END $$;
