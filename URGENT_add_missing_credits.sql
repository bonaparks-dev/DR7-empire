-- IMMEDIATE FIX: Add 1500€ credits to customer who purchased 1000€ package
-- Run this in Supabase SQL Editor AFTER running the table creation script

-- Step 1: Find the customer's most recent 1000€ purchase
SELECT 
  id as purchase_id,
  user_id,
  customer_email,
  customer_name,
  created_at,
  payment_status
FROM credit_wallet_purchases 
WHERE recharge_amount = 1000 
ORDER BY created_at DESC 
LIMIT 1;

-- Step 2: Check their current balance (should be 0)
SELECT 
  ucb.user_id,
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

-- Step 3: MANUALLY ADD THE 1500€ CREDITS
DO $$
DECLARE
  v_user_id UUID;
  v_purchase_id UUID;
  v_current_balance NUMERIC := 0;
  v_new_balance NUMERIC;
  v_customer_email TEXT;
BEGIN
  -- Get the most recent 1000€ purchase details
  SELECT user_id, id, customer_email 
  INTO v_user_id, v_purchase_id, v_customer_email
  FROM credit_wallet_purchases 
  WHERE recharge_amount = 1000 
  ORDER BY created_at DESC 
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No 1000€ purchase found';
  END IF;

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
    reference_id, 
    reference_type,
    created_at
  ) VALUES (
    v_user_id,
    'credit',
    1500,
    v_new_balance,
    'Ricarica Power 1000 - Manual Credit Addition',
    v_purchase_id,
    'credit_purchase',
    NOW()
  );

  RAISE NOTICE 'SUCCESS! Added 1500€ credits to user % (%). New balance: €%', 
    v_customer_email, v_user_id, v_new_balance;
END $$;

-- Step 4: VERIFY the fix worked
SELECT 
  u.email,
  u.id as user_id,
  ucb.balance as current_balance,
  ucb.last_updated
FROM user_credit_balance ucb
JOIN auth.users u ON u.id = ucb.user_id
WHERE ucb.user_id = (
  SELECT user_id FROM credit_wallet_purchases 
  WHERE recharge_amount = 1000 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Step 5: Check transaction history
SELECT 
  ct.created_at,
  ct.transaction_type,
  ct.amount,
  ct.balance_after,
  ct.description
FROM credit_transactions ct
WHERE ct.user_id = (
  SELECT user_id FROM credit_wallet_purchases 
  WHERE recharge_amount = 1000 
  ORDER BY created_at DESC 
  LIMIT 1
)
ORDER BY ct.created_at DESC;
