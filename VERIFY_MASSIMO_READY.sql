-- QUICK CHECK: Verify Massimo's database configuration is correct
-- Run this in Supabase SQL Editor

SELECT 
    '=== MASSIMO RUNCHINA CONFIGURATION ===' as status;

-- 1. Check customer record
SELECT 
    id,
    email,
    full_name,
    residency_zone,
    phone
FROM customers_extended
WHERE email = 'massimorunchina69@gmail.com';

-- 2. Update residency_zone if needed (ensures no restrictions)
UPDATE customers_extended
SET residency_zone = 'NON_RESIDENTE'
WHERE email = 'massimorunchina69@gmail.com'
  AND (residency_zone IS NULL OR residency_zone != 'NON_RESIDENTE');

-- 3. Check credit wallet balance
SELECT 
    cw.user_id,
    cw.balance as "Credit Balance (€)",
    ce.full_name,
    ce.email
FROM credit_wallets cw
JOIN customers_extended ce ON cw.user_id = ce.id
WHERE ce.email = 'massimorunchina69@gmail.com';

SELECT '✅ Configuration complete - Massimo can now book!' as status;
