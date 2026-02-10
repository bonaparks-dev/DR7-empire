-- ============================================================
-- CREDIT WALLET RECOVERY MIGRATION
-- Date: 2026-02-10
-- Purpose: Restore correct credit balances from transaction history
-- ============================================================

-- STEP 1: Diagnostic — show current state BEFORE changes
-- Run this SELECT first to see what we're working with:
--
-- SELECT ucb.user_id, ucb.balance AS current_balance,
--   COALESCE(SUM(CASE WHEN ct.transaction_type = 'credit' THEN ct.amount ELSE 0 END), 0) AS total_credits,
--   COALESCE(SUM(CASE WHEN ct.transaction_type = 'debit' THEN ct.amount ELSE 0 END), 0) AS total_debits,
--   COALESCE(SUM(CASE WHEN ct.transaction_type = 'credit' THEN ct.amount ELSE 0 END), 0)
--     - COALESCE(SUM(CASE WHEN ct.transaction_type = 'debit' THEN ct.amount ELSE 0 END), 0) AS correct_balance
-- FROM user_credit_balance ucb
-- LEFT JOIN credit_transactions ct ON ct.user_id = ucb.user_id
-- GROUP BY ucb.user_id, ucb.balance
-- ORDER BY ucb.balance DESC;

-- ============================================================
-- STEP 2: Recalculate and restore correct balances
--         from credit_transactions history
-- ============================================================
UPDATE user_credit_balance ucb
SET
  balance = calc.correct_balance,
  last_updated = NOW()
FROM (
  SELECT
    user_id,
    COALESCE(SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END), 0)
    AS correct_balance
  FROM credit_transactions
  GROUP BY user_id
) calc
WHERE ucb.user_id = calc.user_id
  AND ucb.balance != calc.correct_balance;

-- Also handle users who have credit_wallet_purchases with payment_status = 'succeeded'
-- but NO matching credit_transaction (i.e., addCredits silently failed after RLS drop)
INSERT INTO credit_transactions (user_id, transaction_type, amount, balance_after, description, reference_id, created_at)
SELECT
  cwp.user_id,
  'credit',
  cwp.credit_amount,
  0, -- will be recalculated below
  'Acquisto crediti (recupero) - ' || cwp.package_name,
  cwp.id::text,
  COALESCE(cwp.payment_completed_at, cwp.created_at)
FROM credit_wallet_purchases cwp
WHERE cwp.payment_status IN ('succeeded', 'completed', 'paid')
  AND NOT EXISTS (
    SELECT 1 FROM credit_transactions ct
    WHERE ct.user_id = cwp.user_id
      AND ct.reference_id = cwp.id::text
      AND ct.transaction_type = 'credit'
  )
  AND cwp.credit_amount > 0;

-- Recalculate balances AGAIN after inserting missing transactions
UPDATE user_credit_balance ucb
SET
  balance = calc.correct_balance,
  last_updated = NOW()
FROM (
  SELECT
    user_id,
    COALESCE(SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END), 0)
    AS correct_balance
  FROM credit_transactions
  GROUP BY user_id
) calc
WHERE ucb.user_id = calc.user_id;

-- Create balance rows for users who have transactions but no balance row
INSERT INTO user_credit_balance (user_id, balance, last_updated)
SELECT
  ct.user_id,
  COALESCE(SUM(CASE WHEN ct.transaction_type = 'credit' THEN ct.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN ct.transaction_type = 'debit' THEN ct.amount ELSE 0 END), 0),
  NOW()
FROM credit_transactions ct
WHERE NOT EXISTS (
  SELECT 1 FROM user_credit_balance ucb WHERE ucb.user_id = ct.user_id
)
GROUP BY ct.user_id
ON CONFLICT (user_id) DO NOTHING;

-- Fix balance_after on recovered transactions
UPDATE credit_transactions ct
SET balance_after = sub.running_balance
FROM (
  SELECT
    id,
    SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END)
      OVER (PARTITION BY user_id ORDER BY created_at, id) AS running_balance
  FROM credit_transactions
) sub
WHERE ct.id = sub.id AND ct.balance_after = 0;

-- ============================================================
-- STEP 3: Restore RLS policies needed for the app to work
-- ============================================================

-- Users need to SELECT their own balance
CREATE POLICY IF NOT EXISTS "Users can read own balance"
ON user_credit_balance
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users need to SELECT their own transactions
CREATE POLICY IF NOT EXISTS "Users can read own transactions"
ON credit_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================================
-- STEP 4: Create add_credits RPC (SECURITY DEFINER)
--         so addCredits works without direct UPDATE policy
-- ============================================================
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT 'purchase'
)
RETURNS TABLE(success BOOLEAN, new_balance NUMERIC, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Lock row to prevent race conditions
  SELECT balance INTO v_current_balance
  FROM user_credit_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    -- Create new balance row
    v_new_balance := p_amount;
    INSERT INTO user_credit_balance (user_id, balance, last_updated)
    VALUES (p_user_id, v_new_balance, NOW());
  ELSE
    v_new_balance := v_current_balance + p_amount;
    UPDATE user_credit_balance
    SET balance = v_new_balance, last_updated = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- Record transaction
  INSERT INTO credit_transactions (user_id, transaction_type, amount, balance_after, description, reference_id, reference_type, created_at)
  VALUES (p_user_id, 'credit', p_amount, v_new_balance, p_description, p_reference_id, p_reference_type, NOW());

  RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, 0::NUMERIC, SQLERRM::TEXT;
END;
$$;

-- ============================================================
-- STEP 5: Verify — run this after to confirm balances are correct
-- ============================================================
-- SELECT ucb.user_id, ucb.balance,
--   (SELECT count(*) FROM credit_transactions ct WHERE ct.user_id = ucb.user_id) AS transaction_count
-- FROM user_credit_balance ucb
-- WHERE ucb.balance > 0
-- ORDER BY ucb.balance DESC;
