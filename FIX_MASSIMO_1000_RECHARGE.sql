-- FIX: Massimo Runchina - Ricarica €1000 (Premium 1000) non risultata
-- Il pagamento è andato a buon fine ma i crediti non sono stati aggiunti al saldo
-- Package: Premium 1000 → €1500 ricevuti (€1000 + 50% bonus)
-- Email: massimorunchina69@gmail.com
--
-- ISTRUZIONI: Esegui questo script nel Supabase SQL Editor

-- Step 1: Verifica lo stato attuale prima della correzione
SELECT
  '=== STATO ATTUALE ===' as info,
  u.email,
  u.id as user_id,
  COALESCE(ucb.balance, 0) as saldo_attuale,
  ucb.last_updated
FROM auth.users u
LEFT JOIN user_credit_balance ucb ON ucb.user_id = u.id
WHERE u.email = 'massimorunchina69@gmail.com';

-- Step 2: Verifica se esiste un acquisto pending/processing per questo importo
SELECT
  '=== ACQUISTI WALLET ===' as info,
  id,
  package_name,
  recharge_amount,
  received_amount,
  payment_status,
  nexi_order_id,
  created_at
FROM credit_wallet_purchases
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com')
ORDER BY created_at DESC
LIMIT 10;

-- Step 3: Aggiungi i €1500 crediti mancanti
DO $$
DECLARE
  v_user_id UUID;
  v_current_balance NUMERIC := 0;
  v_new_balance NUMERIC;
BEGIN
  -- Trova user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'massimorunchina69@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utente massimorunchina69@gmail.com non trovato';
  END IF;

  -- Ottieni saldo attuale
  SELECT COALESCE(balance, 0) INTO v_current_balance
  FROM user_credit_balance
  WHERE user_id = v_user_id;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  RAISE NOTICE 'Saldo attuale: €%', v_current_balance;

  -- Calcola nuovo saldo
  v_new_balance := v_current_balance + 1500;

  -- Aggiorna saldo
  INSERT INTO user_credit_balance (user_id, balance, last_updated)
  VALUES (v_user_id, v_new_balance, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = v_new_balance,
    last_updated = NOW();

  -- Registra la transazione
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    reference_type,
    created_at
  ) VALUES (
    v_user_id,
    'credit',
    1500,
    v_new_balance,
    'Ricarica Premium 1.000 - Correzione manuale (1000€ → 1500€)',
    'wallet_purchase_fix',
    NOW()
  );

  -- Aggiorna l'acquisto a 'succeeded' se è rimasto pending/processing
  UPDATE credit_wallet_purchases
  SET payment_status = 'succeeded',
      payment_completed_at = COALESCE(payment_completed_at, NOW())
  WHERE user_id = v_user_id
    AND recharge_amount = 1000
    AND payment_status IN ('pending', 'processing')
    AND created_at > NOW() - INTERVAL '7 days';

  RAISE NOTICE 'Crediti aggiunti! Nuovo saldo: €%', v_new_balance;
END $$;

-- Step 4: Verifica il risultato
SELECT
  '=== SALDO AGGIORNATO ===' as info,
  u.email,
  ucb.balance as nuovo_saldo,
  ucb.last_updated
FROM user_credit_balance ucb
JOIN auth.users u ON u.id = ucb.user_id
WHERE u.email = 'massimorunchina69@gmail.com';

-- Step 5: Mostra ultime transazioni
SELECT
  created_at,
  transaction_type,
  amount,
  balance_after,
  description
FROM credit_transactions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com')
ORDER BY created_at DESC
LIMIT 5;
