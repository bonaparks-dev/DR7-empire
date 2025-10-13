-- ========================================
-- FIX RLS POLICIES FOR AUTHENTICATED USER BOOKINGS
-- Allows authenticated users to create bookings with their own user_id
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow users to update their own bookings" ON public.bookings;

-- ========================================
-- SELECT POLICY - View own bookings
-- ========================================
CREATE POLICY "Allow users to view their own bookings"
ON public.bookings
FOR SELECT TO authenticated
USING (
  -- User can view if either userId or user_id matches, or if both are null (show all their bookings)
  auth.uid()::text = COALESCE("userId"::text, auth.uid()::text) OR
  auth.uid() = COALESCE(user_id, auth.uid())
);

-- ========================================
-- INSERT POLICY - Create own bookings
-- ========================================
CREATE POLICY "Allow authenticated users to insert their own bookings"
ON public.bookings
FOR INSERT TO authenticated
WITH CHECK (
  -- Allow insert if the user is authenticated and either:
  -- 1. Setting user_id to their own auth.uid()
  -- 2. Setting userId to their own auth.uid()::text
  -- 3. Setting either field to null (will be handled by trigger if needed)
  (user_id IS NULL OR user_id = auth.uid()) AND
  ("userId"::text IS NULL OR "userId"::text = auth.uid()::text)
);

-- ========================================
-- UPDATE POLICY - Update own bookings
-- ========================================
CREATE POLICY "Allow users to update their own bookings"
ON public.bookings
FOR UPDATE TO authenticated
USING (
  auth.uid()::text = COALESCE("userId"::text, auth.uid()::text) OR
  auth.uid() = COALESCE(user_id, auth.uid())
);

-- ========================================
-- ANON POLICY - Allow anonymous bookings (optional - remove if not needed)
-- Uncomment these if you want to allow bookings without login
-- ========================================
-- CREATE POLICY "Allow anonymous users to create bookings"
-- ON public.bookings
-- FOR INSERT TO anon
-- WITH CHECK (true);

-- ========================================
-- SERVICE ROLE - Full access for backend operations
-- ========================================
CREATE POLICY "Service role has full access to bookings"
ON public.bookings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- DONE!
-- ========================================
