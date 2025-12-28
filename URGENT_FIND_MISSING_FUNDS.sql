-- 1. Find users whose credit balance was updated recently (last 24 hours)
SELECT 
  ucb.user_id, 
  au.email,
  au.raw_user_meta_data,
  ucb.balance, 
  ucb.last_updated
FROM user_credit_balance ucb
JOIN auth.users au ON ucb.user_id = au.id
WHERE ucb.last_updated > NOW() - INTERVAL '24 hours'
ORDER BY ucb.last_updated DESC;

-- 2. Find ALL recent credit transactions (last 20) regardless of text
SELECT 
  ct.id,
  ct.created_at,
  ct.amount,
  ct.description,
  au.email,
  ct.balance_after
FROM credit_transactions ct
LEFT JOIN auth.users au ON ct.user_id = au.id
ORDER BY ct.created_at DESC
LIMIT 20;
