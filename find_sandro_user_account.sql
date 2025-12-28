-- Find Sandro Pisceddu's user account
-- Email: pisceddasandro87@gmail.com

-- Get his user ID from auth.users
SELECT 
  id as user_id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'pisceddasandro87@gmail.com';

-- Check if he has any bookings at all (with his user_id)
-- First get his user_id from the query above, then run:
-- SELECT * FROM bookings WHERE user_id = 'USER_ID_HERE';

-- Check if he has any credit wallet balance
SELECT 
  user_id,
  balance,
  last_updated
FROM user_credit_balance
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'pisceddasandro87@gmail.com');

-- Check if he has any credit transactions
SELECT 
  id,
  created_at,
  amount,
  transaction_type,
  description
FROM credit_transactions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'pisceddasandro87@gmail.com')
ORDER BY created_at DESC;
