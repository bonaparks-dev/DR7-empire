-- Check what vehicle-related tables exist in your database
-- Run this in Supabase SQL Editor to see what's there

-- 1. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. If 'vehicles' table exists, check its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'vehicles'
ORDER BY ordinal_position;

-- 3. Check if there are any vehicles in the table
SELECT * FROM public.vehicles LIMIT 10;

-- 4. Check RLS policies on vehicles table
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'vehicles';
