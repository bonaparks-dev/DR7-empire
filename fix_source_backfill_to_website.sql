-- Fix source value for fitnesspowerhour@gmail.com
-- This user registered via website (has business role in metadata) but has incorrect source

UPDATE customers_extended
SET source = 'website_registration'
WHERE id = '940b41f4-eeb9-4c60-80a7-ce079ebc63b6';

-- Verify the update
SELECT 
  id,
  email,
  source,
  created_at
FROM customers_extended
WHERE id = '940b41f4-eeb9-4c60-80a7-ce079ebc63b6';

-- Optional: Fix all users with 'backfill_registration' who have website metadata
UPDATE customers_extended ce
SET source = 'website_registration'
FROM auth.users au
WHERE ce.user_id = au.id
  AND ce.source = 'backfill_registration'
  AND (
    au.raw_user_meta_data->>'role' = 'business' OR
    au.raw_user_meta_data->>'full_name' IS NOT NULL OR
    au.raw_user_meta_data->>'company_name' IS NOT NULL
  );

-- Show count of fixed records
SELECT 
  'Fixed records' as status,
  COUNT(*) as count
FROM customers_extended
WHERE source = 'website_registration'
  AND updated_at > NOW() - INTERVAL '1 minute';
