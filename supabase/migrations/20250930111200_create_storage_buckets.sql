-- Create storage buckets for driver documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-licenses', 'driver-licenses', true),
       ('driver-ids', 'driver-ids', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies for driver-licenses bucket
CREATE POLICY "Allow public read access to driver licenses"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'driver-licenses' );

CREATE POLICY "Allow authenticated users to upload to driver licenses"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'driver-licenses' );

-- Set up policies for driver-ids bucket
CREATE POLICY "Allow public read access to driver ids"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'driver-ids' );

CREATE POLICY "Allow authenticated users to upload to driver ids"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'driver-ids' );