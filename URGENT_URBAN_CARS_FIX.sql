-- 🚨 URGENT FIX - Urban Cars RLS Policy
-- Run in Supabase SQL Editor IMMEDIATELY

-- 1. Check current urban vehicles
SELECT id, display_name, category, status, created_at 
FROM vehicles 
WHERE category = 'urban' 
ORDER BY display_name
LIMIT 10;

-- 2. Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'vehicles';

-- 3. Check current policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'vehicles';

-- 4. Drop problematic policies
DROP POLICY IF EXISTS "vehicles_read_policy_authenticated" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_read_policy_anon" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_category_filter" ON public.vehicles;

-- 5. Create simple, universal read policy
DROP POLICY IF EXISTS "vehicles_public_read_all" ON public.vehicles;
CREATE POLICY "vehicles_public_read_all"
  ON public.vehicles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 6. Ensure RLS is enabled
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 7. Grant explicit permissions
GRANT SELECT ON public.vehicles TO anon;
GRANT SELECT ON public.vehicles TO authenticated;

-- 8. Test urban cars query specifically
SELECT COUNT(*) as urban_count 
FROM vehicles 
WHERE category = 'urban' AND status = 'available';

-- 9. Test all categories
SELECT category, COUNT(*) as vehicle_count
FROM vehicles 
GROUP BY category
ORDER BY category;

-- Expected: Urban cars should now be visible to all users