-- Check the actual source value for fitnesspowerhour@gmail.com
SELECT 
  ce.id,
  au.email,
  ce.source,
  ce.created_at,
  au.created_at as auth_created_at,
  au.raw_user_meta_data
FROM customers_extended ce
JOIN auth.users au ON ce.user_id = au.id
WHERE au.email = 'fitnesspowerhour@gmail.com';
