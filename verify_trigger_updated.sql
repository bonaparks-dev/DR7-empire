-- Check if the trigger function has been updated to include residency_zone
-- Look for 'residency_zone' in the function source code
SELECT 
  CASE 
    WHEN prosrc LIKE '%residency_zone%' THEN '✅ Trigger HAS been updated with residency_zone'
    ELSE '❌ Trigger NOT updated - you need to run 20260125000000_fix_residency_zone_trigger.sql'
  END as status
FROM pg_proc 
WHERE proname = 'sync_auth_user_to_customers';
