-- Backfill missing customer data from raw_user_meta_data
-- This script extracts registration data that was stored in auth.users.raw_user_meta_data
-- but never populated into customers_extended

-- Step 1: Check what data is available in raw_user_meta_data
-- Uncomment to see what data exists before running the update
/*
SELECT 
  au.email,
  au.raw_user_meta_data,
  ce.nome,
  ce.cognome,
  ce.codice_fiscale,
  ce.indirizzo
FROM auth.users au
LEFT JOIN customers_extended ce ON au.id = ce.user_id
WHERE au.created_at > NOW() - INTERVAL '30 days'
ORDER BY au.created_at DESC
LIMIT 20;
*/

-- Step 2: Update customers_extended with data from raw_user_meta_data
UPDATE customers_extended ce
SET
  -- Extract nome/cognome from fullName if not already set
  nome = COALESCE(
    NULLIF(ce.nome, ''),
    au.raw_user_meta_data->>'nome',
    split_part(au.raw_user_meta_data->>'fullName', ' ', 1)
  ),
  cognome = COALESCE(
    NULLIF(ce.cognome, ''),
    au.raw_user_meta_data->>'cognome',
    substring(au.raw_user_meta_data->>'fullName' from position(' ' in au.raw_user_meta_data->>'fullName') + 1)
  ),
  
  -- Extract phone
  telefono = COALESCE(
    NULLIF(ce.telefono, ''),
    au.raw_user_meta_data->>'telefono',
    au.raw_user_meta_data->>'phone'
  ),
  
  -- Extract codice fiscale
  codice_fiscale = COALESCE(
    ce.codice_fiscale,
    au.raw_user_meta_data->>'codiceFiscale'
  ),
  
  -- Extract address fields
  indirizzo = COALESCE(
    ce.indirizzo,
    au.raw_user_meta_data->>'indirizzo'
  ),
  numero_civico = COALESCE(
    ce.numero_civico,
    au.raw_user_meta_data->>'numeroCivico'
  ),
  citta_residenza = COALESCE(
    ce.citta_residenza,
    au.raw_user_meta_data->>'cittaResidenza'
  ),
  provincia_residenza = COALESCE(
    ce.provincia_residenza,
    au.raw_user_meta_data->>'provinciaResidenza'
  ),
  codice_postale = COALESCE(
    ce.codice_postale,
    au.raw_user_meta_data->>'codicePostale'
  ),
  
  -- Extract birth info (cast text to date for data_nascita)
  sesso = COALESCE(
    ce.sesso,
    au.raw_user_meta_data->>'sesso'
  ),
  data_nascita = COALESCE(
    ce.data_nascita,
    NULLIF(au.raw_user_meta_data->>'dataNascita', '')::date
  ),
  citta_nascita = COALESCE(
    ce.citta_nascita,
    au.raw_user_meta_data->>'cittaNascita'
  ),
  provincia_nascita = COALESCE(
    ce.provincia_nascita,
    au.raw_user_meta_data->>'provinciaNascita'
  ),
  
  updated_at = NOW()
FROM auth.users au
WHERE ce.user_id = au.id
  AND (
    -- Only update if we have data in metadata that's missing in customers_extended
    (ce.codice_fiscale IS NULL AND au.raw_user_meta_data->>'codiceFiscale' IS NOT NULL) OR
    (ce.indirizzo IS NULL AND au.raw_user_meta_data->>'indirizzo' IS NOT NULL) OR
    (ce.telefono IS NULL AND au.raw_user_meta_data->>'telefono' IS NOT NULL) OR
    (ce.telefono IS NULL AND au.raw_user_meta_data->>'phone' IS NOT NULL) OR
    (ce.citta_residenza IS NULL AND au.raw_user_meta_data->>'cittaResidenza' IS NOT NULL) OR
    ((ce.nome IS NULL OR ce.nome = '') AND au.raw_user_meta_data->>'fullName' IS NOT NULL)
  );

-- Step 3: Create customers_extended records for users who don't have one yet
INSERT INTO customers_extended (
  user_id,
  email,
  nome,
  cognome,
  telefono,
  codice_fiscale,
  indirizzo,
  numero_civico,
  citta_residenza,
  provincia_residenza,
  codice_postale,
  sesso,
  data_nascita,
  citta_nascita,
  provincia_nascita,
  tipo_cliente,
  nazione,
  source,
  created_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'nome',
    split_part(au.raw_user_meta_data->>'fullName', ' ', 1),
    ''
  ),
  COALESCE(
    au.raw_user_meta_data->>'cognome',
    substring(au.raw_user_meta_data->>'fullName' from position(' ' in au.raw_user_meta_data->>'fullName') + 1),
    ''
  ),
  COALESCE(
    au.raw_user_meta_data->>'telefono',
    au.raw_user_meta_data->>'phone',
    ''
  ),
  au.raw_user_meta_data->>'codiceFiscale',
  au.raw_user_meta_data->>'indirizzo',
  au.raw_user_meta_data->>'numeroCivico',
  au.raw_user_meta_data->>'cittaResidenza',
  au.raw_user_meta_data->>'provinciaResidenza',
  au.raw_user_meta_data->>'codicePostale',
  au.raw_user_meta_data->>'sesso',
  NULLIF(au.raw_user_meta_data->>'dataNascita', '')::date,
  au.raw_user_meta_data->>'cittaNascita',
  au.raw_user_meta_data->>'provinciaNascita',
  'persona_fisica',
  'Italia',
  'backfill_from_metadata',
  au.created_at
FROM auth.users au
LEFT JOIN customers_extended ce ON au.id = ce.user_id
WHERE ce.id IS NULL
  AND au.email IS NOT NULL;

-- Step 4: Show summary of what was updated
SELECT 
  'Backfill Summary' as report_type,
  COUNT(*) as total_customers,
  COUNT(CASE WHEN codice_fiscale IS NOT NULL THEN 1 END) as has_codice_fiscale,
  COUNT(CASE WHEN indirizzo IS NOT NULL THEN 1 END) as has_indirizzo,
  COUNT(CASE WHEN telefono IS NOT NULL AND telefono != '' THEN 1 END) as has_telefono,
  COUNT(CASE WHEN citta_residenza IS NOT NULL THEN 1 END) as has_citta,
  COUNT(CASE WHEN source = 'backfill_from_metadata' THEN 1 END) as newly_created
FROM customers_extended
WHERE created_at > NOW() - INTERVAL '30 days';

-- Step 5: Show users who still have incomplete data
SELECT 
  au.email,
  au.created_at as registration_date,
  ce.nome,
  ce.cognome,
  ce.telefono,
  ce.codice_fiscale,
  ce.indirizzo,
  CASE 
    WHEN ce.codice_fiscale IS NULL THEN '❌ Missing CF'
    WHEN ce.indirizzo IS NULL THEN '⚠️ Missing Address'
    WHEN ce.telefono IS NULL OR ce.telefono = '' THEN '⚠️ Missing Phone'
    ELSE '✅ Complete'
  END as status
FROM auth.users au
JOIN customers_extended ce ON au.id = ce.user_id
WHERE au.created_at > NOW() - INTERVAL '30 days'
  AND (
    ce.codice_fiscale IS NULL OR
    ce.indirizzo IS NULL OR
    ce.telefono IS NULL OR
    ce.telefono = ''
  )
ORDER BY au.created_at DESC;
