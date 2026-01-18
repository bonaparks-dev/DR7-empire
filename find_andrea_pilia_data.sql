-- Query to find Andrea Pilia's registration data
-- Run this in your Supabase SQL Editor

-- 1. Check auth.users table (where initial registration is stored)
SELECT 
    'auth.users' as table_name,
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users
WHERE email = 'andreiii1710@icloud.com';

-- 2. Check customers_extended table (where customer profile is stored)
SELECT 
    'customers_extended' as table_name,
    id,
    user_id,
    nome,
    cognome,
    email,
    telefono,
    source,
    created_at,
    tipo_cliente,
    codice_fiscale,
    indirizzo,
    citta_residenza,
    provincia,
    cap
FROM customers_extended
WHERE email = 'andreiii1710@icloud.com' 
   OR telefono = '3514847361';

-- 3. Join both tables to see the complete picture
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    au.created_at as registration_date,
    au.raw_user_meta_data->>'fullName' as metadata_fullname,
    au.raw_user_meta_data->>'phone' as metadata_phone,
    ce.id as customer_extended_id,
    ce.nome,
    ce.cognome,
    ce.telefono,
    ce.source,
    ce.tipo_cliente,
    ce.codice_fiscale,
    ce.indirizzo
FROM auth.users au
LEFT JOIN customers_extended ce ON au.id = ce.user_id
WHERE au.email = 'andreiii1710@icloud.com';
