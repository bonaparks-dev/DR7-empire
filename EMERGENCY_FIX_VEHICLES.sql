-- EMERGENCY FIX - Run this NOW to restore vehicles on website
-- Copy and paste into Supabase SQL Editor and click RUN

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "Allow public read access to vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow public read access to non-retired vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow service role full access to vehicles" ON public.vehicles;

-- Step 2: Create simple policy that allows EVERYONE to read ALL vehicles
CREATE POLICY "public_read_all_vehicles"
  ON public.vehicles
  FOR SELECT
  USING (true);  -- Allow ALL reads, no restrictions

-- Step 3: Create policy for authenticated users to do everything
CREATE POLICY "authenticated_full_access"
  ON public.vehicles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 4: Verify vehicles exist
SELECT COUNT(*) as total_vehicles FROM public.vehicles;

-- Step 5: Show sample vehicles
SELECT id, display_name, daily_rate, category, status 
FROM public.vehicles 
LIMIT 5;
