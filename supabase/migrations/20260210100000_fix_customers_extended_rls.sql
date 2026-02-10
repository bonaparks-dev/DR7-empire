-- Fix overly permissive RLS on customers_extended
-- Drop dangerous policies that allow all users to read all data

DROP POLICY IF EXISTS "Enable select for authenticated users" ON customers_extended;
DROP POLICY IF EXISTS "Enable select for anon users" ON customers_extended;

-- Users can only read their own data
CREATE POLICY "Users can only read own data"
ON customers_extended
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can update their own data
DROP POLICY IF EXISTS "Enable update for authenticated users" ON customers_extended;
CREATE POLICY "Users can update own data"
ON customers_extended
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can insert their own data
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON customers_extended;
CREATE POLICY "Users can insert own data"
ON customers_extended
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
