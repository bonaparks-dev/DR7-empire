-- Quick diagnostic: Check what data exists in raw_user_meta_data for recent users
-- Run this FIRST to see what data is available before running the backfill

SELECT 
  au.email,
  au.created_at as registration_date,
  au.raw_user_meta_data->>'fullName' as metadata_fullname,
  au.raw_user_meta_data->>'phone' as metadata_phone,
  au.raw_user_meta_data->>'codiceFiscale' as metadata_cf,
  au.raw_user_meta_data->>'indirizzo' as metadata_address,
  ce.nome as current_nome,
  ce.cognome as current_cognome,
  ce.telefono as current_phone,
  ce.codice_fiscale as current_cf,
  ce.indirizzo as current_address,
  CASE 
    WHEN ce.id IS NULL THEN '❌ No customer record'
    WHEN ce.codice_fiscale IS NULL AND au.raw_user_meta_data->>'codiceFiscale' IS NOT NULL THEN '🔄 Can backfill CF'
    WHEN ce.indirizzo IS NULL AND au.raw_user_meta_data->>'indirizzo' IS NOT NULL THEN '🔄 Can backfill address'
    WHEN ce.codice_fiscale IS NULL THEN '⚠️ No data to backfill'
    ELSE '✅ Already complete'
  END as backfill_status
FROM auth.users au
LEFT JOIN customers_extended ce ON au.id = ce.user_id
WHERE au.created_at > NOW() - INTERVAL '30 days'
ORDER BY au.created_at DESC
LIMIT 50;
