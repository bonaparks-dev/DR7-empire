-- Final fix for storage bucket RLS policies
-- This ensures both upload and list operations work correctly
-- Run this in Supabase SQL Editor

-- ============================================
-- CLEAN UP ALL OLD POLICIES
-- ============================================

-- Drop all existing document upload policies to start fresh
DROP POLICY IF EXISTS "Users can upload their own driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own driver licenses" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own driver IDs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own driver IDs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own driver IDs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own driver IDs" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own codice fiscale" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own codice fiscale" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own codice fiscale" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own codice fiscale" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own carta identita" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own carta identita" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own carta identita" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own carta identita" ON storage.objects;

DROP POLICY IF EXISTS "Admins can view all driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all driver IDs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all codice fiscale" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all carta identita" ON storage.objects;

DROP POLICY IF EXISTS "Allow all authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated selects" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated deletes" ON storage.objects;

-- ============================================
-- CARTA IDENTITA BUCKET
-- ============================================

-- Allow users to INSERT (upload) their own carta identita
CREATE POLICY "carta_identita_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'carta-identita' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to SELECT (list and view) their own carta identita
CREATE POLICY "carta_identita_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'carta-identita' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to UPDATE their own carta identita
CREATE POLICY "carta_identita_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'carta-identita' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to DELETE their own carta identita
CREATE POLICY "carta_identita_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'carta-identita' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- CODICE FISCALE BUCKET
-- ============================================

-- Allow users to INSERT (upload) their own codice fiscale
CREATE POLICY "codice_fiscale_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'codice-fiscale' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to SELECT (list and view) their own codice fiscale
CREATE POLICY "codice_fiscale_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'codice-fiscale' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to UPDATE their own codice fiscale
CREATE POLICY "codice_fiscale_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'codice-fiscale' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to DELETE their own codice fiscale
CREATE POLICY "codice_fiscale_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'codice-fiscale' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- DRIVER LICENSES BUCKET (Patente)
-- ============================================

-- Allow users to INSERT (upload) their own driver licenses
CREATE POLICY "driver_licenses_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to SELECT (list and view) their own driver licenses
CREATE POLICY "driver_licenses_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to UPDATE their own driver licenses
CREATE POLICY "driver_licenses_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'driver-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to DELETE their own driver licenses
CREATE POLICY "driver_licenses_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- ADMIN ACCESS TO ALL DOCUMENTS
-- ============================================

CREATE POLICY "admin_carta_identita_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'carta-identita' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
  )
);

CREATE POLICY "admin_codice_fiscale_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'codice-fiscale' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
  )
);

CREATE POLICY "admin_driver_licenses_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-licenses' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = auth.uid()
  )
);

-- ============================================
-- VERIFY POLICIES WERE CREATED
-- ============================================

SELECT
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND (
    policyname LIKE '%carta_identita%' OR
    policyname LIKE '%codice_fiscale%' OR
    policyname LIKE '%driver_licenses%' OR
    policyname LIKE '%admin%'
  )
ORDER BY policyname;
