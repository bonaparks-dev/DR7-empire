-- Fix RLS policies for customers_extended table
-- Allow users to read and update their own customer data

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own customer data" ON customers_extended;
DROP POLICY IF EXISTS "Users can update own customer data" ON customers_extended;

-- Enable RLS
ALTER TABLE customers_extended ENABLE ROW LEVEL SECURITY;

-- Allow users to SELECT their own data
CREATE POLICY "Users can view own customer data"
ON customers_extended
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to UPDATE their own data
CREATE POLICY "Users can update own customer data"
ON customers_extended
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to INSERT their own data (for registration)
CREATE POLICY "Users can insert own customer data"
ON customers_extended
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
