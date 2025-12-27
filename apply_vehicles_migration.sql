-- STEP 1: Apply the vehicles table migration
-- Copy and paste this entire script into your Supabase SQL Editor

-- Create vehicles table with proper schema and RLS policies
-- This migration fixes the issue where vehicles added in admin don't show up on the website

-- Create enum types for vehicle status and category
DO $$ BEGIN
  CREATE TYPE vehicle_status AS ENUM ('available', 'unavailable', 'rented', 'maintenance', 'retired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_category AS ENUM ('exotic', 'urban', 'aziendali');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create vehicles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  plate text,
  status vehicle_status NOT NULL DEFAULT 'available',
  daily_rate numeric NOT NULL CHECK (daily_rate >= 0),
  category vehicle_category,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON public.vehicles(category);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_display_name ON public.vehicles(display_name);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to non-retired vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow service role full access to vehicles" ON public.vehicles;

-- Create RLS policy for public read access (excluding retired vehicles)
CREATE POLICY "Allow public read access to non-retired vehicles"
  ON public.vehicles
  FOR SELECT
  TO public
  USING (status != 'retired');

-- Create RLS policy for service role (admin) full access
CREATE POLICY "Allow service role full access to vehicles"
  ON public.vehicles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.vehicles IS 'Stores vehicle inventory for car rental system with RLS for public viewing';

-- STEP 2: Add sample vehicles for testing (OPTIONAL - remove if you already have vehicles)
-- Uncomment the lines below if you want to add test vehicles

/*
INSERT INTO public.vehicles (display_name, plate, status, daily_rate, category, metadata)
VALUES 
  -- Exotic/Supercar vehicles
  ('Audi RS3', 'RS3001', 'available', 500, 'exotic', '{"image": "/rs3.jpeg", "specs": {"acceleration": "0–100 in 3.8s", "power": "400Cv", "torque": "500Nm", "engine": "2.5L inline 5-cylinder"}}'),
  ('BMW M3', 'M3001', 'available', 550, 'exotic', '{"image": "/bmw-m3.jpeg", "specs": {"acceleration": "0–100 in 3.9s", "power": "510Cv", "torque": "650Nm", "engine": "3.0L Twin-Turbo Inline-6"}}'),
  ('Porsche 911 Carrera', '911001', 'available', 700, 'exotic', '{"image": "/porsche-911.jpeg", "specs": {"acceleration": "0–100 in 4.2s", "power": "385Cv", "torque": "450Nm", "engine": "3.0L Twin-Turbo Flat-6"}}'),
  ('Mercedes C63 AMG', 'C63001', 'available', 600, 'exotic', '{"image": "/c63.jpeg", "specs": {"acceleration": "0–100 in 3.9s", "power": "510Cv", "torque": "700Nm", "engine": "4.0L V8 BiTurbo"}}'),
  
  -- Urban vehicles
  ('Fiat Panda Bianca', 'PANDA01', 'available', 50, 'urban', '{"image": "/panda2.jpeg"}'),
  ('Fiat Panda Arancio', 'PANDA02', 'available', 50, 'urban', '{"image": "/panda3.jpeg"}'),
  ('Renault Clio Arancio', 'CLIO01', 'available', 60, 'urban', '{"image": "/clio4a.jpeg"}'),
  ('Renault Clio Blu', 'CLIO02', 'available', 60, 'urban', '{"image": "/clio4b.jpeg"}'),
  ('Peugeot 208', '208001', 'available', 55, 'urban', '{"image": "/208.jpeg"}'),
  ('Citroën C3', 'C3001', 'available', 55, 'urban', '{"image": "/c3.jpeg"}'),
  
  -- Aziendali (Business) vehicles
  ('Fiat Ducato', 'DUCATO01', 'available', 120, 'aziendali', '{"image": "/ducato.jpeg", "specs": {"passengers": "9 passengers", "seats": "9 posti"}}'),
  ('Mercedes Vito', 'VITO01', 'available', 150, 'aziendali', '{"image": "/vito.jpeg", "specs": {"passengers": "8 passengers", "seats": "8 posti"}}')
ON CONFLICT (id) DO NOTHING;
*/

-- STEP 3: Verify the migration worked
SELECT 
  'Migration successful!' as status,
  COUNT(*) as total_vehicles,
  COUNT(*) FILTER (WHERE category = 'exotic') as exotic_count,
  COUNT(*) FILTER (WHERE category = 'urban') as urban_count,
  COUNT(*) FILTER (WHERE category = 'aziendali') as business_count
FROM public.vehicles;

-- STEP 4: Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'vehicles';
