-- ============================================================
-- Idempotent Welcome Bonus RPC
-- Credits €10 to a user's wallet exactly once.
-- Uses reference_type = 'welcome_bonus' to prevent duplicates.
-- ============================================================
CREATE OR REPLACE FUNCTION grant_welcome_bonus(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, already_granted BOOLEAN, new_balance NUMERIC, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bonus_amount NUMERIC := 10.00;
  v_existing_count INT;
  v_result RECORD;
BEGIN
  -- Check if this user already received the welcome bonus
  SELECT COUNT(*) INTO v_existing_count
  FROM credit_transactions
  WHERE user_id = p_user_id
    AND reference_type = 'welcome_bonus';

  IF v_existing_count > 0 THEN
    -- Already granted — return without doing anything
    RETURN QUERY
      SELECT true, true,
        COALESCE((SELECT balance FROM user_credit_balance WHERE user_id = p_user_id), 0::NUMERIC),
        NULL::TEXT;
    RETURN;
  END IF;

  -- Grant the bonus via add_credits
  SELECT * INTO v_result
  FROM add_credits(
    p_user_id,
    v_bonus_amount,
    'Bonus Benvenuto Wallet €10',
    'welcome_bonus_' || p_user_id::TEXT,
    'welcome_bonus'
  );

  RETURN QUERY SELECT v_result.success, false, v_result.new_balance, v_result.error_message;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, false, 0::NUMERIC, SQLERRM::TEXT;
END;
$$;
