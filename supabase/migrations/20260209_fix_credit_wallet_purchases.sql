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
