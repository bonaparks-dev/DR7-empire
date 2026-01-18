-- Check what data exists in customers_extended for lottery ticket buyers
-- This will help us understand why codice_fiscale is NULL

-- 1. Check specific customers from the results
SELECT 
  ce.user_id,
  ce.tipo_cliente,
  ce.nome,
  ce.cognome,
  ce.codice_fiscale,
  ce.partita_iva,
  ce.indirizzo,
  ce.pec,
  ce.telefono,
  ce.email,
  ce.ragione_sociale,
  au.email as auth_email
FROM customers_extended ce
JOIN auth.users au ON ce.user_id = au.id
WHERE au.email IN (
  'andrea.caria@dcrsrls.it',
  'desmokelu@gmail.com'
);

-- 2. Check ALL fields in customers_extended for these users
SELECT *
FROM customers_extended ce
JOIN auth.users au ON ce.user_id = au.id
WHERE au.email IN (
  'andrea.caria@dcrsrls.it',
  'desmokelu@gmail.com'
);

-- 3. Count how many lottery customers have filled out each field
SELECT 
  COUNT(*) as total_customers,
  COUNT(ce.codice_fiscale) as has_codice_fiscale,
  COUNT(ce.partita_iva) as has_partita_iva,
  COUNT(ce.indirizzo) as has_indirizzo,
  COUNT(ce.pec) as has_pec,
  COUNT(ce.telefono) as has_telefono
FROM commercial_operation_tickets cot
JOIN auth.users au ON cot.email = au.email
LEFT JOIN customers_extended ce ON au.id = ce.user_id
WHERE ce.id IS NOT NULL;

-- 4. Show sample of what data IS available
SELECT 
  cot.email,
  cot.full_name,
  ce.tipo_cliente,
  ce.nome,
  ce.cognome,
  ce.codice_fiscale,
  ce.indirizzo,
  ce.telefono,
  ce.email as ce_email
FROM commercial_operation_tickets cot
JOIN auth.users au ON cot.email = au.email
JOIN customers_extended ce ON au.id = ce.user_id
ORDER BY cot.purchase_date DESC
LIMIT 20;
