-- Check which schema customers_extended is in
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name = 'customers_extended';

-- Also check the trigger's search path
SHOW search_path;

-- Check if the trigger function is looking in the right place
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'sync_auth_user_to_customers';
