-- Atomic credit deduction RPC to prevent double-spending
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_transaction_type TEXT DEFAULT 'booking_payment'
)
RETURNS TABLE(success BOOLEAN, new_balance NUMERIC, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Lock the row and get current balance
  SELECT balance INTO v_current_balance
  FROM user_credit_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 'Wallet non trovato'::TEXT;
    RETURN;
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT false, v_current_balance, 'Credito insufficiente'::TEXT;
    RETURN;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- Update balance
  UPDATE user_credit_balance
  SET balance = v_new_balance, last_updated = NOW()
  WHERE user_id = p_user_id;

  -- Record transaction (amount is positive, transaction_type indicates direction)
  INSERT INTO credit_transactions (user_id, transaction_type, amount, description, reference_id, balance_after)
  VALUES (p_user_id, 'debit', p_amount, p_description, p_reference_id, v_new_balance);

  RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;
END;
$$;
