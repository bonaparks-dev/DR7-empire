-- COMPREHENSIVE DIAGNOSTIC FOR MASSIMO RUNCHINA'S CREDIT WALLET
-- Email: massimorunchina69@gmail.com
-- Issue: Balance shows €494.70 instead of expected €799.80
-- Missing: C63 S rental, Membership renewal (€90), M4 booking (€305)

-- ============================================================
-- SECTION 1: USER IDENTIFICATION
-- ============================================================
SELECT 
  '=== USER INFORMATION ===' as section,
  id as user_id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  created_at as account_created
FROM auth.users 
WHERE email = 'massimorunchina69@gmail.com';

-- ============================================================
-- SECTION 2: CURRENT CREDIT BALANCE
-- ============================================================
SELECT 
  '=== CURRENT CREDIT BALANCE ===' as section,
  ucb.balance as current_balance_eur,
  ucb.last_updated,
  CASE 
    WHEN ucb.balance = 494.70 THEN '❌ INCORRECT (showing bug value)'
    WHEN ucb.balance = 799.80 THEN '✅ CORRECT (expected value)'
    ELSE '⚠️  UNEXPECTED VALUE'
  END as status
FROM user_credit_balance ucb
WHERE ucb.user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com');

-- ============================================================
-- SECTION 3: ALL CREDIT TRANSACTIONS (CHRONOLOGICAL)
-- ============================================================
SELECT 
  '=== ALL CREDIT TRANSACTIONS ===' as section,
  ct.created_at,
  ct.transaction_type,
  ct.amount as amount_eur,
  ct.balance_after as balance_after_eur,
  ct.description,
  ct.reference_type,
  ct.reference_id
FROM credit_transactions ct
WHERE ct.user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com')
ORDER BY ct.created_at ASC;

-- ============================================================
-- SECTION 4: CREDIT WALLET PURCHASES
-- ============================================================
SELECT 
  '=== CREDIT WALLET PURCHASES ===' as section,
  cwp.created_at,
  cwp.package_name,
  cwp.recharge_amount as paid_eur,
  cwp.received_amount as received_eur,
  cwp.bonus_amount as bonus_eur,
  cwp.payment_status,
  cwp.id as purchase_id
FROM credit_wallet_purchases cwp
WHERE cwp.user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com')
ORDER BY cwp.created_at DESC;

-- ============================================================
-- SECTION 5: ALL BOOKINGS (RENTALS)
-- ============================================================
SELECT 
  '=== ALL BOOKINGS ===' as section,
  b.created_at,
  b.vehicle_name,
  b.pickup_date,
  b.dropoff_date,
  b.price_total / 100.0 as price_eur,
  b.payment_method,
  b.payment_status,
  b.status as booking_status,
  b.id as booking_id
FROM bookings b
WHERE b.user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com')
ORDER BY b.created_at DESC;

-- ============================================================
-- SECTION 6: MEMBERSHIP PURCHASES
-- ============================================================
SELECT 
  '=== MEMBERSHIP PURCHASES ===' as section,
  mp.created_at,
  mp.tier_name,
  mp.price / 100.0 as price_eur,
  mp.payment_method,
  mp.payment_status,
  mp.id as purchase_id
FROM membership_purchases mp
WHERE mp.user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com')
ORDER BY mp.created_at DESC;

-- ============================================================
-- SECTION 7: BALANCE CALCULATION VERIFICATION
-- ============================================================
WITH user_info AS (
  SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com'
),
credits_sum AS (
  SELECT COALESCE(SUM(amount), 0) as total_credits
  FROM credit_transactions
  WHERE user_id = (SELECT id FROM user_info)
    AND transaction_type = 'credit'
),
debits_sum AS (
  SELECT COALESCE(SUM(amount), 0) as total_debits
  FROM credit_transactions
  WHERE user_id = (SELECT id FROM user_info)
    AND transaction_type = 'debit'
),
current_balance AS (
  SELECT COALESCE(balance, 0) as balance
  FROM user_credit_balance
  WHERE user_id = (SELECT id FROM user_info)
)
SELECT 
  '=== BALANCE CALCULATION CHECK ===' as section,
  c.total_credits as total_credits_eur,
  d.total_debits as total_debits_eur,
  (c.total_credits - d.total_debits) as calculated_balance_eur,
  cb.balance as stored_balance_eur,
  CASE 
    WHEN (c.total_credits - d.total_debits) = cb.balance THEN '✅ CONSISTENT'
    ELSE '❌ MISMATCH - Database inconsistency!'
  END as consistency_check,
  (cb.balance - (c.total_credits - d.total_debits)) as difference_eur
FROM credits_sum c, debits_sum d, current_balance cb;

-- ============================================================
-- SECTION 8: IDENTIFY MISSING TRANSACTIONS
-- ============================================================
-- Check for bookings paid with credit that don't have corresponding debit transactions
SELECT 
  '=== BOOKINGS WITHOUT DEBIT TRANSACTIONS ===' as section,
  b.created_at as booking_date,
  b.vehicle_name,
  b.price_total / 100.0 as price_eur,
  b.payment_method,
  b.payment_status,
  b.id as booking_id,
  '⚠️  MISSING DEBIT TRANSACTION' as issue
FROM bookings b
WHERE b.user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com')
  AND b.payment_method = 'credit'
  AND b.payment_status IN ('succeeded', 'paid')
  AND NOT EXISTS (
    SELECT 1 FROM credit_transactions ct
    WHERE ct.user_id = b.user_id
      AND ct.transaction_type = 'debit'
      AND ct.reference_id = b.id
  )
ORDER BY b.created_at DESC;

-- Check for memberships paid with credit that don't have corresponding debit transactions
SELECT 
  '=== MEMBERSHIPS WITHOUT DEBIT TRANSACTIONS ===' as section,
  mp.created_at as purchase_date,
  mp.tier_name,
  mp.price / 100.0 as price_eur,
  mp.payment_method,
  mp.payment_status,
  mp.id as purchase_id,
  '⚠️  MISSING DEBIT TRANSACTION' as issue
FROM membership_purchases mp
WHERE mp.user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com')
  AND mp.payment_method = 'credit_wallet'
  AND mp.payment_status IN ('succeeded', 'paid', 'completed')
  AND NOT EXISTS (
    SELECT 1 FROM credit_transactions ct
    WHERE ct.user_id = mp.user_id
      AND ct.transaction_type = 'debit'
      AND ct.reference_id = mp.id
  )
ORDER BY mp.created_at DESC;

-- ============================================================
-- SECTION 9: SUMMARY & RECOMMENDATIONS
-- ============================================================
SELECT 
  '=== DIAGNOSTIC SUMMARY ===' as section,
  'Run this script to identify:' as info,
  '1. Current balance vs expected balance' as check_1,
  '2. All credit additions and deductions' as check_2,
  '3. Missing debit transactions for bookings/memberships' as check_3,
  '4. Database consistency between transactions and balance' as check_4;
