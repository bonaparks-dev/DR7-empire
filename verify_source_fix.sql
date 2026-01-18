-- Verify the source was updated for fitnesspowerhour@gmail.com
SELECT 
  id,
  email,
  source,
  updated_at,
  created_at
FROM customers_extended
WHERE id = '940b41f4-eeb9-4c60-80a7-ce079ebc63b6';

-- Check how many users still have 'backfill_registration' source
SELECT 
  source,
  COUNT(*) as count
FROM customers_extended
GROUP BY source
ORDER BY count DESC;

-- Show users with backfill_registration who might need fixing
SELECT 
  ce.email,
  ce.source,
  ce.created_at,
  au.raw_user_meta_data->>'role' as role,
  au.raw_user_meta_data->>'company_name' as company_name,
  au.raw_user_meta_data->>'full_name' as full_name
FROM customers_extended ce
JOIN auth.users au ON ce.user_id = au.id
WHERE ce.source = 'backfill_registration'
LIMIT 20;
