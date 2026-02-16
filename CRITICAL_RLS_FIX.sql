-- 🚨 CRITICAL RLS FIX - Run in Supabase SQL Editor IMMEDIATELY

-- 1. Kill any table locks first
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE pid IN (
  SELECT pid 
  FROM pg_locks 
  WHERE relation = 'vehicles'::regclass
  AND pid != pg_backend_pid()
);

-- 2. Check current RLS status
SELECT schemaname, tablename, rowsecurity, hasoids 
FROM pg_tables 
WHERE tablename = 'vehicles';

-- 3. Drop all existing policies (clean slate)
DROP POLICY IF EXISTS "public_read_all_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.vehicles;
DROP POLICY IF EXISTS "Allow read access" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_read_policy" ON public.vehicles;

-- 4. Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 5. Create single, simple read policy for ALL users
CREATE POLICY "vehicles_public_read_all"
  ON public.vehicles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 6. Verify policy is active
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'vehicles';

-- 7. Test query (should work)
SELECT COUNT(*) as total_vehicles FROM vehicles;
SELECT COUNT(*) as urban_vehicles FROM vehicles WHERE category = 'urban';

-- 8. Grant explicit permissions (safety net)
GRANT SELECT ON public.vehicles TO anon;
GRANT SELECT ON public.vehicles TO authenticated;

-- Expected result: All vehicle queries should now work
-- No more ERR_CONNECTION_RESET errors