-- Query to get the ACTUAL trigger function code from the database
-- Run this in your Supabase SQL Editor

-- 1. Get the trigger function source code
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'on_auth_user_created'
  AND n.nspname = 'public';

-- 2. Show all triggers on auth.users table
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'users'
  AND n.nspname = 'auth';

-- 3. Alternative: Check if function exists in any schema
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%auth%user%'
  OR p.proname LIKE '%customer%'
ORDER BY n.nspname, p.proname;
