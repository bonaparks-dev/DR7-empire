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
