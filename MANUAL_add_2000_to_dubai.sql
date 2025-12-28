DO $$
DECLARE
  v_target_email TEXT := 'dubai.rent7.0srl@gmail.com';
  v_amount NUMERIC := 2000;
  v_user_id UUID;
  v_current_balance NUMERIC; -- Remove initialization here to be safe, though it doesn't matter if overwritten
  v_new_balance NUMERIC;
BEGIN
  -- 1. Get User ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_target_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', v_target_email;
  END IF;

  -- 2. Get Current Balance safely
  -- If row exists, get balance. If not, return 0.
  v_current_balance := COALESCE(
    (SELECT balance FROM user_credit_balance WHERE user_id = v_user_id),
    0
  );

  -- 3. Calculate New Balance
  v_new_balance := v_current_balance + v_amount;

  -- 4. Update/Insert Balance
  INSERT INTO user_credit_balance (user_id, balance, last_updated)
  VALUES (v_user_id, v_new_balance, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    balance = v_new_balance,
    last_updated = NOW();

  -- 5. Record Transaction
  INSERT INTO credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    balance_after, 
    description, 
    created_at
  ) VALUES (
    v_user_id,
    'credit',
    v_amount,
    v_new_balance,
    'Manual Credit Addition of €' || v_amount,
    NOW()
  );

  RAISE NOTICE 'SUCCESS: Added €% to %. New Balance: €%', v_amount, v_target_email, v_new_balance;
END $$;
