-- FIX: credit_wallet_purchases - missing columns + missing RLS policies
-- The table was created without payment_method and nexi_order_id columns,
-- and only had SELECT RLS policies (no INSERT/UPDATE), causing
-- "Failed to save purchase record" error for all pack purchases.

-- 1. Add missing columns
ALTER TABLE credit_wallet_purchases
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'nexi';

ALTER TABLE credit_wallet_purchases
ADD COLUMN IF NOT EXISTS nexi_order_id TEXT;

ALTER TABLE credit_wallet_purchases
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;

ALTER TABLE credit_wallet_purchases
ADD COLUMN IF NOT EXISTS payment_error_message TEXT;

-- 2. Add INSERT policy so users can create purchase records
DROP POLICY IF EXISTS "Users can insert own purchases" ON credit_wallet_purchases;
CREATE POLICY "Users can insert own purchases" ON credit_wallet_purchases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Add UPDATE policy so users can update their own purchase records
DROP POLICY IF EXISTS "Users can update own purchases" ON credit_wallet_purchases;
CREATE POLICY "Users can update own purchases" ON credit_wallet_purchases
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Add index on nexi_order_id for payment callback lookups
CREATE INDEX IF NOT EXISTS idx_credit_wallet_purchases_nexi_order_id
ON credit_wallet_purchases(nexi_order_id);

-- ============================================================
-- FIX: credit_transactions missing service_type column
-- The book_with_credits RPC and deductCredits() both use this column
-- but it was never added to the table, causing credit bookings to fail
-- ============================================================
ALTER TABLE credit_transactions
ADD COLUMN IF NOT EXISTS service_type TEXT;

-- ============================================================
-- FIX: Recreate book_with_credits RPC (atomic credit booking)
-- This ensures the function exists and works correctly
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

  SELECT balance INTO v_current_balance
  FROM user_credit_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  IF v_current_balance < v_amount_eur THEN
    RAISE EXCEPTION 'Insufficient credit balance. Available: %, Required: %', v_current_balance, v_amount_eur;
  END IF;

  v_new_balance := v_current_balance - v_amount_eur;

  UPDATE user_credit_balance
  SET balance = v_new_balance, last_updated = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, balance_after, description, service_type, created_at
  ) VALUES (
    p_user_id, 'debit', v_amount_eur, v_new_balance,
    'Noleggio ' || p_vehicle_name, 'car_rental', NOW()
  );

  INSERT INTO public.bookings (
    user_id, vehicle_name, vehicle_type, vehicle_image_url,
    pickup_date, dropoff_date, pickup_location, dropoff_location,
    price_total, currency, status, payment_status, payment_method,
    booking_source, booked_at, booking_details
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
    'confirmed', 'succeeded', 'credit',
    COALESCE(p_booking_payload->>'booking_source', 'website'),
    NOW(),
    p_booking_payload->'booking_details'
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
