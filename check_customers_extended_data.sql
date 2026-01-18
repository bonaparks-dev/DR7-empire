-- Query to check what data exists in customers_extended for recent registrations
-- Run this in your Supabase SQL Editor

-- 1. Check Andrea Pilia's complete data
SELECT 
  'Andrea Pilia' as user_name,
  ce.id as customer_id,
  ce.user_id,
  ce.tipo_cliente,
  ce.nome,
  ce.cognome,
  ce.email,
  ce.telefono,
  ce.codice_fiscale,
  ce.indirizzo,
  ce.citta_residenza,
  ce.provincia_residenza,
  ce.codice_postale,
  ce.source,
  ce.created_at,
  au.email as auth_email,
  au.raw_user_meta_data
FROM customers_extended ce
JOIN auth.users au ON ce.user_id = au.id
WHERE au.email = 'andreiii1710@icloud.com';

-- 2. Check all recent registrations (last 7 days) and their data completeness
SELECT 
  au.email,
  au.created_at as registration_date,
  au.raw_user_meta_data->>'fullName' as metadata_fullname,
  au.raw_user_meta_data->>'phone' as metadata_phone,
  ce.id as has_customer_record,
  ce.nome,
  ce.cognome,
  ce.telefono,
  ce.codice_fiscale,
  ce.indirizzo,
  ce.source,
  CASE 
    WHEN ce.id IS NULL THEN '❌ No customer_extended record'
    WHEN ce.codice_fiscale IS NULL THEN '⚠️ Missing codice_fiscale'
    WHEN ce.indirizzo IS NULL THEN '⚠️ Missing address'
    WHEN ce.telefono IS NULL THEN '⚠️ Missing phone'
    ELSE '✅ Complete'
  END as data_status
FROM auth.users au
LEFT JOIN customers_extended ce ON au.id = ce.user_id
WHERE au.created_at > NOW() - INTERVAL '7 days'
ORDER BY au.created_at DESC;

-- 3. Count users by data completeness
SELECT 
  CASE 
    WHEN ce.id IS NULL THEN '1. No customer_extended record'
    WHEN ce.codice_fiscale IS NULL OR ce.indirizzo IS NULL OR ce.telefono IS NULL THEN '2. Incomplete profile'
    ELSE '3. Complete profile'
  END as profile_status,
  COUNT(*) as user_count
FROM auth.users au
LEFT JOIN customers_extended ce ON au.id = ce.user_id
WHERE au.created_at > NOW() - INTERVAL '30 days'
GROUP BY profile_status
ORDER BY profile_status;

-- 4. Find users who registered but have NO customers_extended record at all
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.raw_user_meta_data
FROM auth.users au
LEFT JOIN customers_extended ce ON au.id = ce.user_id
WHERE ce.id IS NULL
  AND au.created_at > NOW() - INTERVAL '30 days'
ORDER BY au.created_at DESC;

-- 5. Show the raw_user_meta_data to see what was captured during registration
SELECT 
  au.email,
  au.raw_user_meta_data,
  ce.nome,
  ce.cognome,
  ce.telefono
FROM auth.users au
LEFT JOIN customers_extended ce ON au.id = ce.user_id
WHERE au.email IN (
  'andreiii1710@icloud.com',
  'marcogarau777@gmail.com',
  'andrea.caria@dcrsrls.it',
  'desmokelu@gmail.com'
)
ORDER BY au.created_at DESC;
