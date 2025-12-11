-- ADD 1500€ CREDITS TO MASSIMO RUNCHINA
-- Email: massimorunchina69@gmail.com
-- Ready to run - just copy and paste into Supabase SQL Editor

-- Step 1: Find Massimo's user ID
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'massimorunchina69@gmail.com';
  v_current_balance NUMERIC := 0;
  v_new_balance NUMERIC;
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users 
  WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', v_user_email;
  END IF;

  RAISE NOTICE 'Found user: % (ID: %)', v_user_email, v_user_id;

  -- Get current balance if exists (default to 0)
  SELECT COALESCE(balance, 0) INTO v_current_balance
  FROM user_credit_balance 
  WHERE user_id = v_user_id;

  -- If no row exists, v_current_balance will be NULL, so ensure it's 0
  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  RAISE NOTICE 'Current balance: €%', v_current_balance;

  -- Calculate new balance (add 1500€) - ensure it's never NULL
  v_new_balance := COALESCE(v_current_balance, 0) + 1500;

  RAISE NOTICE 'New balance will be: €%', v_new_balance;

  -- Insert or update balance
  INSERT INTO user_credit_balance (user_id, balance, last_updated)
  VALUES (v_user_id, v_new_balance, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = v_new_balance,
    last_updated = NOW();

  RAISE NOTICE 'Updated balance to: €%', v_new_balance;

  -- Record the credit transaction
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
    1500,
    v_new_balance,
    'Ricarica Power 1000 - Manual Credit Addition (1000€ → 1500€)',
    NOW()
  );

  RAISE NOTICE 'Transaction recorded';

  -- Create purchase record for tracking
  INSERT INTO credit_wallet_purchases (
    user_id,
    package_id,
    package_name,
    package_series,
    recharge_amount,
    received_amount,
    bonus_amount,
    bonus_percentage,
    payment_status,
    currency,
    customer_name,
    customer_email,
    created_at
  ) VALUES (
    v_user_id,
    'power-1000',
    'Power 1000',
    'POWER SERIES',
    1000,
    1500,
    500,
    50,
    'paid',
    'EUR',
    'Massimo Runchina',
    v_user_email,
    NOW()
  );

  RAISE NOTICE 'Purchase record created';
  RAISE NOTICE '✅ SUCCESS! Massimo Runchina now has €% in credit wallet', v_new_balance;
END $$;

-- Verify the credits were added
SELECT 
  u.email,
  u.id as user_id,
  ucb.balance as credit_balance,
  ucb.last_updated
FROM user_credit_balance ucb
JOIN auth.users u ON u.id = ucb.user_id
WHERE u.email = 'massimorunchina69@gmail.com';

-- Show recent transactions
SELECT 
  created_at,
  transaction_type,
  amount,
  balance_after,
  description
FROM credit_transactions ct
WHERE ct.user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com')
ORDER BY created_at DESC
LIMIT 5;
