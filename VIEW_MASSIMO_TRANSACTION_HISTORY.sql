-- VIEW MASSIMO'S TRANSACTION HISTORY (AS HE SEES IT)
-- This shows exactly what appears in his account's transaction history

SELECT 
  '=== TRANSACTION HISTORY (User View) ===' as display_section,
  TO_CHAR(ct.created_at, 'DD/MM/YYYY HH24:MI') as date_time,
  CASE 
    WHEN ct.transaction_type = 'credit' THEN '✅ CREDIT'
    ELSE '❌ DEBIT'
  END as type,
  CASE 
    WHEN ct.transaction_type = 'credit' THEN '+€' || ct.amount::TEXT
    ELSE '-€' || ct.amount::TEXT
  END as amount,
  ct.description,
  '€' || ct.balance_after::TEXT as balance_after
FROM credit_transactions ct
WHERE ct.user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com')
ORDER BY ct.created_at DESC
LIMIT 20;

-- Show current balance
SELECT 
  '=== CURRENT BALANCE ===' as display_section,
  '€' || ucb.balance::TEXT as saldo_disponibile,
  TO_CHAR(ucb.last_updated, 'DD/MM/YYYY HH24:MI') as last_updated
FROM user_credit_balance ucb
WHERE ucb.user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com');

-- Count total transactions visible to user
SELECT 
  '=== TRANSACTION COUNT ===' as display_section,
  COUNT(*) as total_transactions_in_history,
  COUNT(CASE WHEN transaction_type = 'credit' THEN 1 END) as credits,
  COUNT(CASE WHEN transaction_type = 'debit' THEN 1 END) as debits
FROM credit_transactions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'massimorunchina69@gmail.com');
