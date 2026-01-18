-- Check if Andrea's auth data was synced to customers_extended
SELECT 
  ce.id,
  ce.user_id,
  ce.tipo_cliente,
  ce.nome,
  ce.cognome,
  ce.email,
  ce.telefono,
  ce.codice_fiscale,
  ce.indirizzo,
  ce.source,
  ce.created_at,
  au.email as auth_email,
  au.raw_user_meta_data
FROM customers_extended ce
RIGHT JOIN auth.users au ON ce.user_id = au.id
WHERE au.email = 'andreiii1710@icloud.com';

-- This will show:
-- - If ce.id IS NULL: Auth exists but NO customers_extended record (sync failed!)
-- - If ce.id IS NOT NULL: Both exist (sync worked)
