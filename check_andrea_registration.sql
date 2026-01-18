-- Check customers_extended table for andreiii1710@icloud.com
SELECT 
  id,
  tipo_cliente,
  nome,
  cognome,
  email,
  telefono,
  codice_fiscale,
  indirizzo,
  source,
  created_at
FROM customers_extended
WHERE email = 'andreiii1710@icloud.com'
   OR telefono LIKE '%1710%'
   OR LOWER(nome) LIKE '%andre%'
ORDER BY created_at DESC;

-- Check auth.users table
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'andreiii1710@icloud.com';

-- Check for any customer with similar data (in case email wasn't captured)
SELECT 
  id,
  tipo_cliente,
  nome,
  cognome,
  email,
  telefono,
  codice_fiscale,
  source,
  created_at
FROM customers_extended
WHERE created_at > '2026-01-09'::date
  AND source = 'website_form'
ORDER BY created_at DESC
LIMIT 20;
