-- ============================================================
-- Idempotent Welcome Bonus RPC
-- Credits €10 to a user's wallet exactly once.
-- Uses reference_type = 'welcome_bonus' to prevent duplicates.
-- Writes directly to avoid UUID cast issue in add_credits.
-- ============================================================
CREATE OR REPLACE FUNCTION grant_welcome_bonus(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, already_granted BOOLEAN, new_balance NUMERIC, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bonus_amount NUMERIC := 10.00;
  v_existing_count INT;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Check if this user already received the welcome bonus
  SELECT COUNT(*) INTO v_existing_count
  FROM credit_transactions
  WHERE user_id = p_user_id
    AND reference_type = 'welcome_bonus';

  IF v_existing_count > 0 THEN
    RETURN QUERY
      SELECT true, true,
        COALESCE((SELECT balance FROM user_credit_balance WHERE user_id = p_user_id), 0::NUMERIC),
        NULL::TEXT;
    RETURN;
  END IF;

  -- Lock row to prevent race conditions
  SELECT balance INTO v_current_balance
  FROM user_credit_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    v_new_balance := v_bonus_amount;
    INSERT INTO user_credit_balance (user_id, balance, last_updated)
    VALUES (p_user_id, v_new_balance, NOW());
  ELSE
    v_new_balance := v_current_balance + v_bonus_amount;
    UPDATE user_credit_balance
    SET balance = v_new_balance, last_updated = NOW()
    WHERE user_id = p_user_id;
  END IF;

  INSERT INTO credit_transactions (user_id, transaction_type, amount, balance_after, description, reference_id, reference_type, created_at)
  VALUES (p_user_id, 'credit', v_bonus_amount, v_new_balance, 'Bonus Benvenuto Wallet €10', p_user_id, 'welcome_bonus', NOW());

  RETURN QUERY SELECT true, false, v_new_balance, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, false, 0::NUMERIC, SQLERRM::TEXT;
END;
$$;
