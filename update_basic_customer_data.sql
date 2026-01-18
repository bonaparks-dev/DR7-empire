-- Update customers_extended with available data from raw_user_meta_data
-- This populates nome, cognome, and telefono for users who have empty fields

UPDATE customers_extended ce
SET
  -- Extract nome/cognome from fullName if currently empty
  nome = CASE 
    WHEN (ce.nome IS NULL OR ce.nome = '') AND au.raw_user_meta_data->>'fullName' IS NOT NULL
    THEN split_part(au.raw_user_meta_data->>'fullName', ' ', 1)
    ELSE ce.nome
  END,
  
  cognome = CASE 
    WHEN (ce.cognome IS NULL OR ce.cognome = '') AND au.raw_user_meta_data->>'fullName' IS NOT NULL
    THEN TRIM(substring(au.raw_user_meta_data->>'fullName' from position(' ' in au.raw_user_meta_data->>'fullName') + 1))
    ELSE ce.cognome
  END,
  
  -- Extract phone if currently empty
  telefono = CASE 
    WHEN (ce.telefono IS NULL OR ce.telefono = '') AND au.raw_user_meta_data->>'phone' IS NOT NULL
    THEN au.raw_user_meta_data->>'phone'
    ELSE ce.telefono
  END,
  
  updated_at = NOW()
FROM auth.users au
WHERE ce.user_id = au.id
  AND (
    -- Only update if we have data in metadata that's missing in customers_extended
    ((ce.nome IS NULL OR ce.nome = '') AND au.raw_user_meta_data->>'fullName' IS NOT NULL) OR
    ((ce.cognome IS NULL OR ce.cognome = '') AND au.raw_user_meta_data->>'fullName' IS NOT NULL) OR
    ((ce.telefono IS NULL OR ce.telefono = '') AND au.raw_user_meta_data->>'phone' IS NOT NULL)
  );

-- Show summary
SELECT 
  'Updated Records' as status,
  COUNT(*) as total_updated
FROM customers_extended
WHERE updated_at > NOW() - INTERVAL '1 minute';

-- Show remaining incomplete profiles
SELECT 
  COUNT(*) as users_with_incomplete_profiles,
  COUNT(CASE WHEN codice_fiscale IS NULL THEN 1 END) as missing_cf,
  COUNT(CASE WHEN indirizzo IS NULL THEN 1 END) as missing_address,
  COUNT(CASE WHEN nome IS NULL OR nome = '' THEN 1 END) as missing_nome
FROM customers_extended
WHERE created_at > NOW() - INTERVAL '30 days';
