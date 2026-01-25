-- Check if the trigger function includes residency_zone handling
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'sync_auth_user_to_customers';
