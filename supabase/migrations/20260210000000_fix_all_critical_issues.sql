-- Migration: Fix critical DB issues found in codebase review
-- Date: 2026-02-10

-- ============================================================
-- 1. FIX book_with_credits RPC - restore all top-level fields
--    The 20260209_fix_credit_wallet_purchases.sql migration
--    accidentally reverted this to an old version missing
--    customer_name, customer_email, customer_phone, etc.
-- ============================================================
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

  -- Lock row for atomic transaction
  SELECT balance INTO v_current_balance
  FROM user_credit_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  IF v_current_balance < v_amount_eur THEN
    RAISE EXCEPTION 'Credito insufficiente. Disponibile: €%, Richiesto: €%', v_current_balance, v_amount_eur;
  END IF;

  v_new_balance := v_current_balance - v_amount_eur;

  -- Deduct credits
  UPDATE user_credit_balance
  SET balance = v_new_balance, last_updated = NOW()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, balance_after, description, service_type, created_at
  ) VALUES (
    p_user_id, 'debit', v_amount_eur, v_new_balance,
    'Noleggio ' || p_vehicle_name || ' - ' || (p_booking_payload->>'pickup_date') || ' to ' || (p_booking_payload->>'dropoff_date'),
    'car_rental', NOW()
  );

  -- Insert booking with ALL required top-level fields
  INSERT INTO public.bookings (
    user_id, vehicle_name, vehicle_type, vehicle_image_url,
    pickup_date, dropoff_date, pickup_location, dropoff_location,
    price_total, currency, status, payment_status, payment_method,
    booking_source, booked_at, booking_details,
    customer_name, customer_email, customer_phone,
    deposit_amount, vehicle_id, insurance_option, booking_usage_zone
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
    CASE WHEN p_booking_payload->>'vehicle_id' IS NOT NULL AND p_booking_payload->>'vehicle_id' != ''
         THEN (p_booking_payload->>'vehicle_id')::uuid ELSE NULL END,
    p_booking_payload->>'insurance_option',
    p_booking_payload->>'booking_usage_zone'
  ) RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'new_balance', v_new_balance
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Prenotazione fallita: %', SQLERRM;
END;
$$;

-- ============================================================
-- 2. FIX RLS: Remove user UPDATE policy on user_credit_balance
--    Users should NOT be able to directly update their balance.
--    All balance changes must go through SECURITY DEFINER RPCs.
-- ============================================================
DROP POLICY IF EXISTS "Users can update own balance" ON user_credit_balance;

-- Keep only SELECT and INSERT (for initial row creation if needed)
-- The book_with_credits RPC runs as SECURITY DEFINER so it bypasses RLS

-- Also remove user INSERT policy on credit_transactions
-- (only the RPC should create these)
DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;

-- ============================================================
-- 3. FIX Nexi callback fields: add missing columns to bookings
--    nexi-callback.js writes nexi_transaction_id and
--    payment_completed_at but these columns don't exist.
--    Also add nexi_order_id which CarBookingWizard tries to set.
-- ============================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS nexi_order_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS nexi_transaction_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_error_message TEXT;

-- Index for nexi_order_id lookups (used in nexi-callback.js)
CREATE INDEX IF NOT EXISTS idx_bookings_nexi_order_id ON bookings(nexi_order_id);
