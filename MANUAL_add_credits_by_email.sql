-- MANUAL FIX: Add 1500€ credits to specific customer
-- Replace 'customer@email.com' with the actual customer's email

-- Step 1: Find the customer's user_id by email
SELECT id, email FROM auth.users WHERE email = 'customer@email.com';

-- Step 2: Manually add 1500€ credits (replace 'USER_ID_HERE' with the actual UUID from Step 1)
DO $$
DECLARE
  v_user_id UUID := 'USER_ID_HERE'; -- REPLACE THIS WITH ACTUAL USER ID
  v_current_balance NUMERIC := 0;
  v_new_balance NUMERIC;
BEGIN
  -- Get current balance if exists
  SELECT COALESCE(balance, 0) INTO v_current_balance
  FROM user_credit_balance 
  WHERE user_id = v_user_id;

  -- Calculate new balance (add 1500€)
  v_new_balance := v_current_balance + 1500;

  -- Insert or update balance
  INSERT INTO user_credit_balance (user_id, balance, last_updated)
  VALUES (v_user_id, v_new_balance, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = v_new_balance,
    last_updated = NOW();

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
    'Manual Credit Addition - Power 1000 Package (1000€ → 1500€)',
    NOW()
  );

  -- Also create a purchase record for tracking
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
    NOW()
  );

  RAISE NOTICE 'SUCCESS! Added 1500€ credits. New balance: €%', v_new_balance;
END $$;

-- Step 3: Verify the credits were added
SELECT 
  u.email,
  ucb.balance,
  ucb.last_updated
FROM user_credit_balance ucb
JOIN auth.users u ON u.id = ucb.user_id
WHERE ucb.user_id = 'USER_ID_HERE'; -- REPLACE WITH SAME USER ID

-- Step 4: Check transaction history
SELECT 
  created_at,
  transaction_type,
  amount,
  balance_after,
  description
FROM credit_transactions
WHERE user_id = 'USER_ID_HERE' -- REPLACE WITH SAME USER ID
ORDER BY created_at DESC;
