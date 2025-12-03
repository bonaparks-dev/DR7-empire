-- Fix RLS policies for document upload storage buckets
-- This allows authenticated users to upload their own documents

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- ============================================
-- DRIVER LICENSES BUCKET (patente)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "driver_licenses_insert" ON storage.objects;
DROP POLICY IF EXISTS "driver_licenses_select" ON storage.objects;
DROP POLICY IF EXISTS "driver_licenses_update" ON storage.objects;
DROP POLICY IF EXISTS "driver_licenses_delete" ON storage.objects;

-- Allow users to upload their own driver license
CREATE POLICY "Users can upload their own driver licenses"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own driver license
CREATE POLICY "Users can view their own driver licenses"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own driver license
CREATE POLICY "Users can update their own driver licenses"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'driver-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own driver license
CREATE POLICY "Users can delete their own driver licenses"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- DRIVER IDs BUCKET (carta identità)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own driver IDs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own driver IDs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own driver IDs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own driver IDs" ON storage.objects;
DROP POLICY IF EXISTS "driver_ids_insert" ON storage.objects;
DROP POLICY IF EXISTS "driver_ids_select" ON storage.objects;
DROP POLICY IF EXISTS "driver_ids_update" ON storage.objects;
DROP POLICY IF EXISTS "driver_ids_delete" ON storage.objects;

-- Allow users to upload their own ID
CREATE POLICY "Users can upload their own driver IDs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-ids' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own ID
CREATE POLICY "Users can view their own driver IDs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-ids' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own ID
CREATE POLICY "Users can update their own driver IDs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'driver-ids' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own ID
CREATE POLICY "Users can delete their own driver IDs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-ids' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- CODICE FISCALE BUCKET
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own codice fiscale" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own codice fiscale" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own codice fiscale" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own codice fiscale" ON storage.objects;
DROP POLICY IF EXISTS "codice_fiscale_insert" ON storage.objects;
DROP POLICY IF EXISTS "codice_fiscale_select" ON storage.objects;
DROP POLICY IF EXISTS "codice_fiscale_update" ON storage.objects;
DROP POLICY IF EXISTS "codice_fiscale_delete" ON storage.objects;

-- Allow users to upload their own codice fiscale
CREATE POLICY "Users can upload their own codice fiscale"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'codice-fiscale' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own codice fiscale
CREATE POLICY "Users can view their own codice fiscale"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'codice-fiscale' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own codice fiscale
CREATE POLICY "Users can update their own codice fiscale"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'codice-fiscale' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own codice fiscale
CREATE POLICY "Users can delete their own codice fiscale"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'codice-fiscale' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- ADMIN ACCESS TO ALL DOCUMENTS
-- ============================================

-- Allow admins to view all documents
CREATE POLICY "Admins can view all driver licenses"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-licenses' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all driver IDs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-ids' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all codice fiscale"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'codice-fiscale' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
  )
);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
