-- Fix book_with_credits to store all necessary top-level fields
-- Previously missing: customer_name, customer_email, customer_phone, deposit_amount, vehicle_id, insurance_option
CREATE OR REPLACE FUNCTION book_with_credits(
  p_user_id UUID,
  p_amount_cents INTEGER,
  p_vehicle_name TEXT,
  p_booking_payload JSONB
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
BEGIN
  v_amount_eur := p_amount_cents / 100.0;

  SELECT balance INTO v_current_balance
  FROM user_credit_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  IF v_current_balance < v_amount_eur THEN
    RAISE EXCEPTION 'Insufficient credit balance. Available: €%, Required: €%', v_current_balance, v_amount_eur;
  END IF;

  v_new_balance := v_current_balance - v_amount_eur;

  UPDATE user_credit_balance
  SET
    balance = v_new_balance,
    last_updated = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, balance_after, description, created_at
  ) VALUES (
    p_user_id, 'debit', v_amount_eur, v_new_balance,
    'Noleggio ' || p_vehicle_name || ' - ' || (p_booking_payload->>'pickup_date') || ' to ' || (p_booking_payload->>'dropoff_date'),
    NOW()
  );

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
    booking_details,
    customer_name,
    customer_email,
    customer_phone,
    deposit_amount,
    vehicle_id,
    insurance_option,
    booking_usage_zone
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
    'confirmed',
    'succeeded',
    'credit',
    COALESCE(p_booking_payload->>'booking_source', 'website'),
    NOW(),
    p_booking_payload->'booking_details',
    p_booking_payload->>'customer_name',
    p_booking_payload->>'customer_email',
    p_booking_payload->>'customer_phone',
    (p_booking_payload->>'deposit_amount')::numeric,
    (p_booking_payload->>'vehicle_id')::uuid,
    p_booking_payload->>'insurance_option',
    p_booking_payload->>'booking_usage_zone'
  ) RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'new_balance', v_new_balance
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Booking failed: %', SQLERRM;
END;
$$;
