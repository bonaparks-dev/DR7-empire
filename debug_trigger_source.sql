-- Get the FULL trigger function source code to see what's actually running
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'sync_auth_user_to_customers';

-- Also check for any errors in the Postgres logs
-- Run this to see recent errors:
SELECT * FROM pg_stat_activity 
WHERE state = 'active' OR state = 'idle in transaction'
ORDER BY query_start DESC 
LIMIT 10;
