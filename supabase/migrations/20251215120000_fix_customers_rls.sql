-- Enable RLS on customers_extended if not already enabled
ALTER TABLE customers_extended ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to INSERT into customers_extended
-- This is necessary for the "New Client" modal to work for logged-in staff/admins
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON customers_extended;
CREATE POLICY "Enable insert for authenticated users"
ON customers_extended
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to SELECT from customers_extended
-- (Adjust scope as needed, currently allowing broad access for staff/admins)
DROP POLICY IF EXISTS "Enable select for authenticated users" ON customers_extended;
CREATE POLICY "Enable select for authenticated users"
ON customers_extended
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to UPDATE customers_extended
DROP POLICY IF EXISTS "Enable update for authenticated users" ON customers_extended;
CREATE POLICY "Enable update for authenticated users"
ON customers_extended
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Optional: Allow Anon insert if this is used on public signup forms?
-- Check if SignUpPage uses it. Yes it does.
-- "Step 2: Save customer data to customers_extended" in SignUpPage.
-- So we might need ANON access too, or ensure SignUp uses Service Key (usually client side uses Anon).
-- If NewClientModal is used by Admins, Authenticated is enough.
-- But if SignUpPage uses it, we need Anon.

DROP POLICY IF EXISTS "Enable insert for anon users" ON customers_extended;
CREATE POLICY "Enable insert for anon users"
ON customers_extended
FOR INSERT
TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for anon users" ON customers_extended;
CREATE POLICY "Enable select for anon users"
ON customers_extended
FOR SELECT
TO anon
USING (true);
