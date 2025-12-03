-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('driver-licenses', 'driver-licenses', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']::text[]),
  ('driver-ids', 'driver-ids', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']::text[]),
  ('codice-fiscale', 'codice-fiscale', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']::text[])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']::text[];

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all user documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete user documents" ON storage.objects;

-- Policy 1: Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('driver-licenses', 'driver-ids', 'codice-fiscale')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow authenticated users to read their own documents
CREATE POLICY "Users can read own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('driver-licenses', 'driver-ids', 'codice-fiscale')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow authenticated users to update their own documents
CREATE POLICY "Users can update own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('driver-licenses', 'driver-ids', 'codice-fiscale')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow authenticated users to delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('driver-licenses', 'driver-ids', 'codice-fiscale')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Allow ALL authenticated users to list root folders (for admin panel)
CREATE POLICY "Authenticated can list document folders"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('driver-licenses', 'driver-ids', 'codice-fiscale')
);

-- Verify buckets were created
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('driver-licenses', 'driver-ids', 'codice-fiscale');
