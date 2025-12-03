-- Fix RLS policies for ALL document upload storage buckets
-- This allows authenticated users to upload their own documents
-- Run this in Supabase SQL Editor

-- ============================================
-- CREATE MISSING BUCKETS
-- ============================================

-- Create codice-fiscale bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('codice-fiscale', 'codice-fiscale', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Create carta-identita bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('carta-identita', 'carta-identita', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- ============================================
-- CLEAN UP OLD POLICIES
-- ============================================

-- Drop all existing document upload policies
DROP POLICY IF EXISTS "Users can upload their own driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload to their own folder in driver-licenses" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own files in driver-licenses" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own driver IDs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own driver IDs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own driver IDs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own driver IDs" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload to their own folder in driver-ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own files in driver-ids" ON storage.objects;

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

-- ============================================
-- DRIVER LICENSES (Patente)
-- ============================================

CREATE POLICY "Users can upload their own driver licenses"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own driver licenses"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own driver licenses"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'driver-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own driver licenses"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-licenses' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- DRIVER IDs / CARTA IDENTITA
-- ============================================

CREATE POLICY "Users can upload their own driver IDs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-ids' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own driver IDs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-ids' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own driver IDs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'driver-ids' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own driver IDs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-ids' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- CARTA IDENTITA (separate bucket)
-- ============================================

CREATE POLICY "Users can upload their own carta identita"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'carta-identita' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own carta identita"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'carta-identita' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own carta identita"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'carta-identita' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own carta identita"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'carta-identita' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- CODICE FISCALE
-- ============================================

CREATE POLICY "Users can upload their own codice fiscale"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'codice-fiscale' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own codice fiscale"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'codice-fiscale' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own codice fiscale"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'codice-fiscale' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

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

CREATE POLICY "Admins can view all carta identita"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'carta-identita' AND
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

-- ============================================
-- VERIFY POLICIES
-- ============================================

SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%driver%'
   OR policyname LIKE '%carta%'
   OR policyname LIKE '%codice%'
ORDER BY policyname;
