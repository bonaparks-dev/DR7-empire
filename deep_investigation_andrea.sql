-- DEEP INVESTIGATION: Check ALL possible locations for Andrea's data

-- 1. Check the metadata JSONB field (license info might be here!)
SELECT 
  id,
  user_id,
  nome,
  cognome,
  email,
  telefono,
  codice_fiscale,
  metadata,  -- THIS IS KEY - license data stored here
  source,
  created_at,
  updated_at
FROM customers_extended
WHERE user_id = '9f4f8417-6383-42c9-9a3a-a712f8393275';

-- 2. Check user_documents table for uploaded files
SELECT 
  id,
  user_id,
  document_type,
  file_path,
  upload_date,
  status,
  metadata
FROM user_documents
WHERE user_id = '9f4f8417-6383-42c9-9a3a-a712f8393275'
ORDER BY upload_date DESC;

-- 3. Check auth.users raw_user_meta_data for ALL stored fields
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
WHERE id = '9f4f8417-6383-42c9-9a3a-a712f8393275';

-- 4. Check if there are multiple records (duplicates?)
SELECT 
  id,
  user_id,
  email,
  nome,
  cognome,
  source,
  created_at
FROM customers_extended
WHERE email = 'andreiii1710@icloud.com'
   OR telefono = '3514847361'
ORDER BY created_at;

-- 5. Check for any audit/history tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%audit%' OR table_name LIKE '%history%' OR table_name LIKE '%log%');
