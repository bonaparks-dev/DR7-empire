-- ========================================
-- MASSIMO RUNCHINA VIP CONFIGURATION
-- ========================================
-- Ensures Massimo has:
-- 1. NON_RESIDENTE status (no geographic restrictions)
-- 2. Sufficient credit wallet balance
-- 3. All necessary customer data

-- Step 1: Check current configuration
SELECT 
    '=== CURRENT MASSIMO CONFIGURATION ===' as info;

SELECT 
    id,
    email,
    full_name,
    residency_zone,
    phone,
    created_at
FROM customers_extended
WHERE email = 'massimorunchina69@gmail.com';

-- Step 2: Check credit wallet balance
SELECT 
    cw.user_id,
    cw.balance,
    cw.last_updated,
    ce.full_name
FROM credit_wallets cw
JOIN customers_extended ce ON cw.user_id = ce.id
WHERE ce.email = 'massimorunchina69@gmail.com';

-- Step 3: Update residency_zone to NON_RESIDENTE (no restrictions)
UPDATE customers_extended
SET residency_zone = 'NON_RESIDENTE'
WHERE email = 'massimorunchina69@gmail.com'
  AND residency_zone != 'NON_RESIDENTE';

-- Step 4: Verify the update
SELECT 
    '=== UPDATED CONFIGURATION ===' as info;

SELECT 
    id,
    email,
    full_name,
    residency_zone,
    phone
FROM customers_extended
WHERE email = 'massimorunchina69@gmail.com';

-- Step 5: Show recent bookings with pricing
SELECT 
    '=== RECENT BOOKINGS (Last 3) ===' as info;

SELECT 
    b.id,
    b.pickup_date,
    b.dropoff_date,
    b.total_price,
    b.payment_status,
    b.payment_method,
    b.created_at
FROM bookings b
JOIN customers_extended ce ON b.user_id = ce.id
WHERE ce.email = 'massimorunchina69@gmail.com'
ORDER BY b.created_at DESC
LIMIT 3;
