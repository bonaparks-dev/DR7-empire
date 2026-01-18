-- FIX MASSIMO RUNCHINA'S CREDIT WALLET TRANSACTION HISTORY
-- Email: massimorunchina69@gmail.com
-- Issue: Credit balance is CORRECT (€799.80) but transaction history is incomplete
-- Missing from history: C63 S rental, Membership renewal (€90), M4 booking (€305)

-- ============================================================
-- STEP 1: VERIFY CURRENT STATE
-- ============================================================
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'massimorunchina69@gmail.com';
  v_current_balance NUMERIC;
  v_c63_booking_id UUID;
  v_m4_booking_id UUID;
  v_membership_id UUID;
  v_transaction_count INTEGER;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users 
  WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User % not found', v_user_email;
  END IF;

  RAISE NOTICE '✓ Found user: % (ID: %)', v_user_email, v_user_id;

  -- Get current balance
  SELECT COALESCE(balance, 0) INTO v_current_balance
  FROM user_credit_balance 
  WHERE user_id = v_user_id;

  RAISE NOTICE 'Current balance: €% (CORRECT)', v_current_balance;

  -- Count existing transactions
  SELECT COUNT(*) INTO v_transaction_count
  FROM credit_transactions
  WHERE user_id = v_user_id;

  RAISE NOTICE 'Existing transactions in history: %', v_transaction_count;

  -- ============================================================
  -- STEP 2: FIND BOOKINGS/MEMBERSHIPS WITHOUT TRANSACTION RECORDS
  -- ============================================================
  RAISE NOTICE '';
  RAISE NOTICE '=== SEARCHING FOR MISSING TRANSACTION HISTORY ENTRIES ===';

  -- Find C63 S booking (if exists and missing from history)
  SELECT b.id INTO v_c63_booking_id
  FROM bookings b
  WHERE b.user_id = v_user_id
    AND b.vehicle_name ILIKE '%C63%'
    AND b.payment_method = 'credit'
    AND b.payment_status IN ('succeeded', 'paid', 'completed')
    AND NOT EXISTS (
      SELECT 1 FROM credit_transactions ct
      WHERE ct.user_id = b.user_id
        AND ct.transaction_type = 'debit'
        AND ct.reference_id = b.id
    )
  ORDER BY b.created_at DESC
  LIMIT 1;

  IF v_c63_booking_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  C63 S booking found but NOT in transaction history: %', v_c63_booking_id;
  ELSE
    RAISE NOTICE '✓ C63 S booking is in transaction history (or doesn''t exist)';
  END IF;

  -- Find M4 booking (if exists and missing from history)
  SELECT b.id INTO v_m4_booking_id
  FROM bookings b
  WHERE b.user_id = v_user_id
    AND b.vehicle_name ILIKE '%M4%'
    AND b.payment_method = 'credit'
    AND b.payment_status IN ('succeeded', 'paid', 'completed')
    AND NOT EXISTS (
      SELECT 1 FROM credit_transactions ct
      WHERE ct.user_id = b.user_id
        AND ct.transaction_type = 'debit'
        AND ct.reference_id = b.id
    )
  ORDER BY b.created_at DESC
  LIMIT 1;

  IF v_m4_booking_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  M4 booking found but NOT in transaction history: %', v_m4_booking_id;
  ELSE
    RAISE NOTICE '✓ M4 booking is in transaction history (or doesn''t exist)';
  END IF;

  -- Find membership renewal (€90) if exists and missing from history
  SELECT mp.id INTO v_membership_id
  FROM membership_purchases mp
  WHERE mp.user_id = v_user_id
    AND mp.price = 9000  -- €90 in cents
    AND mp.payment_method = 'credit'
    AND mp.payment_status IN ('succeeded', 'paid', 'completed')
    AND NOT EXISTS (
      SELECT 1 FROM credit_transactions ct
      WHERE ct.user_id = mp.user_id
        AND ct.transaction_type = 'debit'
        AND ct.reference_id = mp.id
    )
  ORDER BY mp.created_at DESC
  LIMIT 1;

  IF v_membership_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  Membership renewal (€90) found but NOT in transaction history: %', v_membership_id;
  ELSE
    RAISE NOTICE '✓ Membership renewal is in transaction history (or doesn''t exist)';
  END IF;

  -- ============================================================
  -- STEP 3: ADD MISSING TRANSACTION HISTORY ENTRIES
  -- ============================================================
  -- NOTE: We do NOT modify the balance since it's already correct
  -- We only add the transaction records for history visibility
  
  RAISE NOTICE '';
  RAISE NOTICE '=== ADDING MISSING TRANSACTION HISTORY ENTRIES ===';
  RAISE NOTICE 'NOTE: Balance will NOT be changed (already correct at €%)', v_current_balance;

  -- Add C63 S transaction record if missing
  IF v_c63_booking_id IS NOT NULL THEN
    DECLARE
      v_c63_amount NUMERIC;
      v_c63_date TIMESTAMPTZ;
    BEGIN
      SELECT price_total / 100.0, created_at INTO v_c63_amount, v_c63_date
      FROM bookings WHERE id = v_c63_booking_id;

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
        'debit',
        v_c63_amount,
        v_current_balance,  -- Use current balance (already correct)
        'Noleggio Mercedes C63 S AMG',
        v_c63_booking_id,
        'booking',
        v_c63_date
      );

      RAISE NOTICE '✓ Added C63 S to transaction history: -€%', v_c63_amount;
    END;
  END IF;

  -- Add M4 transaction record if missing
  IF v_m4_booking_id IS NOT NULL THEN
    DECLARE
      v_m4_amount NUMERIC;
      v_m4_date TIMESTAMPTZ;
    BEGIN
      SELECT price_total / 100.0, created_at INTO v_m4_amount, v_m4_date
      FROM bookings WHERE id = v_m4_booking_id;

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
        'debit',
        v_m4_amount,
        v_current_balance,  -- Use current balance (already correct)
        'Noleggio BMW M4',
        v_m4_booking_id,
        'booking',
        v_m4_date
      );

      RAISE NOTICE '✓ Added M4 to transaction history: -€%', v_m4_amount;
    END;
  END IF;

  -- Add membership transaction record if missing
  IF v_membership_id IS NOT NULL THEN
    DECLARE
      v_membership_amount NUMERIC := 90.00;
      v_membership_date TIMESTAMPTZ;
    BEGIN
      SELECT created_at INTO v_membership_date
      FROM membership_purchases WHERE id = v_membership_id;

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
        'debit',
        v_membership_amount,
        v_current_balance,  -- Use current balance (already correct)
        'Rinnovo Iscrizione',
        v_membership_id,
        'membership',
        v_membership_date
      );

      RAISE NOTICE '✓ Added membership renewal to transaction history: -€%', v_membership_amount;
    END;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=== COMPLETE ===';
  RAISE NOTICE '✅ Transaction history updated';
  RAISE NOTICE '✅ Balance remains correct at €%', v_current_balance;

END $$;

-- ============================================================
-- VERIFICATION: Show complete transaction history
-- ============================================================
SELECT 
  '=== COMPLETE TRANSACTION HISTORY ===' as section,
  ct.created_at,
  ct.transaction_type,
  CASE 
    WHEN ct.transaction_type = 'credit' THEN '+€' || ct.amount::TEXT
    ELSE '-€' || ct.amount::TEXT
  END as amount,
  '€' || ct.balance_after::TEXT as balance_after,
  ct.description
FROM credit_transactions ct
WHERE ct.user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com')
ORDER BY ct.created_at DESC;

-- Show final balance confirmation
SELECT 
  '=== FINAL BALANCE CONFIRMATION ===' as section,
  u.email,
  '€' || ucb.balance::TEXT as balance,
  ucb.last_updated
FROM user_credit_balance ucb
JOIN auth.users u ON u.id = ucb.user_id
WHERE u.email = 'massimorunchina69@gmail.com';
