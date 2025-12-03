-- Simple RLS fix for document uploads
-- Run this in your Supabase SQL Editor

-- Allow all authenticated users to upload to all buckets
-- This is a temporary fix to get uploads working immediately

DROP POLICY IF EXISTS "Allow all authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated selects" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated deletes" ON storage.objects;

-- Create permissive policies for authenticated users
CREATE POLICY "Allow all authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow all authenticated selects"
ON storage.objects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (true);

-- Verify the policies were created
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;
