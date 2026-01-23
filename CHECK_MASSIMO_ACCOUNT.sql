-- CHECK IF MASSIMO RUNCHINA ACCOUNT EXISTS
-- Email: massimorunchina69@gmail.com

-- Step 1: Check if user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'massimorunchina69@gmail.com';

-- Step 2: Check if user has a credit balance record
SELECT 
  user_id,
  balance,
  last_updated
FROM user_credit_balance
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com');

-- Step 3: Check if user has any bookings
SELECT 
  id,
  vehicle_name,
  pickup_date,
  price_total,
  payment_status,
  created_at
FROM bookings
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com')
ORDER BY created_at DESC
LIMIT 5;

-- Step 4: Check if user exists in customers_extended
SELECT 
  id,
  email,
  full_name,
  phone,
  created_at
FROM customers_extended
WHERE email = 'massimorunchina69@gmail.com';
