-- Atomic function to handle credit payment and booking in one transaction
CREATE OR REPLACE FUNCTION book_with_credits(
  p_user_id UUID,
  p_amount_cents INTEGER, -- Booking price in cents
  p_vehicle_name TEXT, -- For transaction description
  p_booking_payload JSONB -- Complete booking data object
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_amount_eur NUMERIC;
  v_new_balance NUMERIC;
  v_booking_id UUID;
  v_booking_data JSONB;
BEGIN
  -- 1. Convert cents to EUR
  v_amount_eur := p_amount_cents / 100.0;
  
  -- 2. Lock and check user balance
  SELECT balance INTO v_current_balance
  FROM user_credit_balance
  WHERE user_id = p_user_id
  FOR UPDATE; -- Prevent race conditions

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  IF v_current_balance < v_amount_eur THEN
    RAISE EXCEPTION 'Insufficient credit balance. Available: €%, Required: €%', v_current_balance, v_amount_eur;
  END IF;

  -- 3. Deduct Credits
  v_new_balance := v_current_balance - v_amount_eur;

  UPDATE user_credit_balance
  SET 
    balance = v_new_balance,
    last_updated = NOW()
  WHERE user_id = p_user_id;

  -- 4. Record Credit Transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    created_at
  ) VALUES (
    p_user_id,
    'debit',
    v_amount_eur,
    v_new_balance,
    'Noleggio ' || p_vehicle_name || ' - ' || (p_booking_payload->>'pickup_date') || ' to ' || (p_booking_payload->>'dropoff_date'),
    NOW()
  );

  -- 5. Insert Booking
  -- Construct the booking insert from the payload
  -- We assume p_booking_payload matches the bookings table columns
  INSERT INTO public.bookings (
    user_id,
    vehicle_name,
    vehicle_type,
    vehicle_image_url,
    pickup_date,
    dropoff_date,
    pickup_location,
    dropoff_location,
    price_total,
    currency,
    status,
    payment_status,
    payment_method,
    booking_source,
    booked_at,
    booking_details
  ) VALUES (
    (p_booking_payload->>'user_id')::uuid,
    p_booking_payload->>'vehicle_name',
    p_booking_payload->>'vehicle_type',
    p_booking_payload->>'vehicle_image_url',
    (p_booking_payload->>'pickup_date')::timestamptz,
    (p_booking_payload->>'dropoff_date')::timestamptz,
    p_booking_payload->>'pickup_location',
    p_booking_payload->>'dropoff_location',
    (p_booking_payload->>'price_total')::numeric,
    p_booking_payload->>'currency',
    'confirmed', -- Status confirmed (payment already succeeded)
    'succeeded', -- Payment succeeded (we just deducted it)
    'credit',
    COALESCE(p_booking_payload->>'booking_source', 'website'),
    NOW(),
    p_booking_payload->'booking_details'
  ) RETURNING id INTO v_booking_id;

  -- Return success and booking ID
  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'new_balance', v_new_balance
  );

EXCEPTION WHEN OTHERS THEN
  -- All changes (balance update, transaction insert, booking insert) are rolled back automatically
  RAISE EXCEPTION 'Booking failed: %', SQLERRM;
END;
$$;
