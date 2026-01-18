-- Query to find all lottery ticket purchases and their associated customer data
-- This will help us understand what data exists and where it's stored

-- 1. Check tickets with user accounts
SELECT 
  cot.id,
  cot.email,
  cot.full_name,
  cot.customer_phone,
  cot.ticket_number,
  cot.user_id,
  cot.purchase_date,
  cot.customer_data,
  -- Get auth.users data
  au.email as auth_email,
  au.created_at as account_created,
  -- Get customers_extended data
  ce.tipo_cliente,
  ce.codice_fiscale,
  ce.partita_iva,
  ce.indirizzo,
  ce.pec,
  ce.telefono,
  ce.nome,
  ce.cognome,
  ce.ragione_sociale
FROM commercial_operation_tickets cot
LEFT JOIN auth.users au ON cot.user_id = au.id
LEFT JOIN customers_extended ce ON au.id = ce.user_id
ORDER BY cot.purchase_date DESC
LIMIT 20;

-- 2. Count tickets with vs without user_id
SELECT 
  CASE 
    WHEN user_id IS NOT NULL THEN 'Has user_id'
    ELSE 'No user_id'
  END as status,
  COUNT(*) as count
FROM commercial_operation_tickets
GROUP BY CASE WHEN user_id IS NOT NULL THEN 'Has user_id' ELSE 'No user_id' END;

-- 3. Check if customers_extended records exist for ticket buyers
SELECT DISTINCT ON (cot.email)
  cot.email,
  cot.full_name,
  (SELECT COUNT(*) FROM commercial_operation_tickets WHERE email = cot.email) as ticket_count,
  cot.user_id,
  ce.id as has_customer_extended,
  ce.tipo_cliente as customer_type,
  ce.codice_fiscale,
  ce.partita_iva,
  ce.pec
FROM commercial_operation_tickets cot
LEFT JOIN auth.users au ON cot.email = au.email
LEFT JOIN customers_extended ce ON au.id = ce.user_id
ORDER BY cot.email, cot.purchase_date DESC;

-- 4. Find tickets where user_id is NULL but auth.users exists
SELECT 
  cot.id,
  cot.email,
  cot.full_name,
  cot.user_id as ticket_user_id,
  au.id as auth_user_id,
  ce.id as customer_extended_id
FROM commercial_operation_tickets cot
LEFT JOIN auth.users au ON cot.email = au.email
LEFT JOIN customers_extended ce ON au.id = ce.user_id
WHERE cot.user_id IS NULL
  AND au.id IS NOT NULL
ORDER BY cot.purchase_date DESC;
