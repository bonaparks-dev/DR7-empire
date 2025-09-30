-- Create storage buckets for driver documents, ensuring they are PRIVATE
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-licenses', 'driver-licenses', false),
       ('driver-ids', 'driver-ids', false)
ON CONFLICT (id) DO UPDATE SET public = false; -- Ensure it's private if it exists

-- Remove old insecure policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to driver licenses" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to driver ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to driver ids" ON storage.objects;

-- Set up SECURE policies for driver-licenses bucket
-- 1. Users can upload to their own folder, identified by their UID.
CREATE POLICY "Allow users to upload to their own folder in driver-licenses"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'driver-licenses' AND (storage.foldername(name))[1] = auth.uid()::text );

-- 2. Users can view their own files.
CREATE POLICY "Allow users to view their own files in driver-licenses"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'driver-licenses' AND (storage.foldername(name))[1] = auth.uid()::text );


-- Set up SECURE policies for driver-ids bucket
-- 1. Users can upload to their own folder.
CREATE POLICY "Allow users to upload to their own folder in driver-ids"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'driver-ids' AND (storage.foldername(name))[1] = auth.uid()::text );

-- 2. Users can view their own files.
CREATE POLICY "Allow users to view their own files in driver-ids"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'driver-ids' AND (storage.foldername(name))[1] = auth.uid()::text );