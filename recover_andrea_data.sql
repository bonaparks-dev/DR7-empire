-- Check auth.users raw_user_meta_data for Andrea
-- This might contain the original data that was submitted
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data
FROM auth.users
WHERE id = '9f4f8417-6383-42c9-9a3a-a712f8393275';

-- Check if there's any audit or history table
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%audit%' 
   OR table_name LIKE '%history%'
   OR table_name LIKE '%log%';

-- Check for any other customer records with similar data
SELECT *
FROM customers_extended
WHERE telefono = '3514847361'
   OR (nome = 'Andrea' AND cognome = 'Pilia')
ORDER BY created_at;
