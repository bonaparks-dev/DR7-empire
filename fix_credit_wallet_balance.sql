-- Credit Wallet Balance Investigation and Fix
-- Run this in Supabase SQL Editor

-- 1. Check if the purchase was recorded
SELECT * FROM credit_wallet_purchases 
WHERE recharge_amount = 1000 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check the user's credit balance
SELECT * FROM user_credit_balance 
WHERE user_id = (
  SELECT user_id FROM credit_wallet_purchases 
  WHERE recharge_amount = 1000 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- 3. Check credit transactions for this user
SELECT * FROM credit_transactions 
WHERE user_id = (
  SELECT user_id FROM credit_wallet_purchases 
  WHERE recharge_amount = 1000 
  ORDER BY created_at DESC 
  LIMIT 1
)
ORDER BY created_at DESC;

-- 4. MANUAL FIX: Add the missing 1500€ credits
-- First, get the user_id and purchase_id
DO $$
DECLARE
  v_user_id UUID;
  v_purchase_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Get the most recent 1000€ purchase
  SELECT user_id, id INTO v_user_id, v_purchase_id
  FROM credit_wallet_purchases 
  WHERE recharge_amount = 1000 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Get current balance (or 0 if doesn't exist)
  SELECT COALESCE(balance, 0) INTO v_current_balance
  FROM user_credit_balance 
  WHERE user_id = v_user_id;

  -- Calculate new balance
  v_new_balance := v_current_balance + 1500;

  -- Update or insert balance
  INSERT INTO user_credit_balance (user_id, balance, last_updated)
  VALUES (v_user_id, v_new_balance, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = v_new_balance,
    last_updated = NOW();

  -- Record the transaction
  INSERT INTO credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    balance_after, 
    description, 
    reference_id, 
    reference_type,
    created_at
  ) VALUES (
    v_user_id,
    'credit',
    1500,
    v_new_balance,
    'Ricarica Power 1000 - Manual Fix',
    v_purchase_id,
    'credit_purchase',
    NOW()
  );

  RAISE NOTICE 'Credits added successfully. New balance: %', v_new_balance;
END $$;

-- 5. Verify the fix
SELECT 
  u.email,
  ucb.balance,
  ucb.last_updated
FROM user_credit_balance ucb
JOIN auth.users u ON u.id = ucb.user_id
WHERE ucb.user_id = (
  SELECT user_id FROM credit_wallet_purchases 
  WHERE recharge_amount = 1000 
  ORDER BY created_at DESC 
  LIMIT 1
);
