-- 🚨 URGENT FIX: Urban cars not showing (Chrome/Safari)
-- This fixes RLS policies on vehicles table

-- 1. Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'vehicles';

-- 2. Check existing policies
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'vehicles';

-- 3. TEMPORARY FIX: Disable RLS to restore service
-- (ONLY until proper policies are fixed)
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;

-- 4. Re-enable with CORRECT policies
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 5. Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "public_read_all_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.vehicles;
DROP POLICY IF EXISTS "Vehicles are viewable by everyone" ON public.vehicles;

-- 6. Create comprehensive READ policy for ALL categories
CREATE POLICY "allow_all_vehicle_reads" 
ON public.vehicles 
FOR SELECT 
TO anon, authenticated
USING (
  -- Allow all vehicles that are not retired
  status != 'retired'
  -- Explicitly allow all categories including 'urban'
  AND category IN ('exotic', 'urban', 'aziendali')
);

-- 7. Verify the fix works
SELECT 
  category,
  COUNT(*) as vehicle_count,
  COUNT(CASE WHEN status = 'available' THEN 1 END) as available_count
FROM public.vehicles 
GROUP BY category
ORDER BY category;

-- 8. Test specific urban vehicles query (same as frontend)
SELECT id, display_name, category, status, daily_rate
FROM public.vehicles 
WHERE category = 'urban' 
  AND status != 'retired'
ORDER BY display_name
LIMIT 10;

-- Expected result: Should return urban vehicles
-- If still empty, the problem is data not RLS