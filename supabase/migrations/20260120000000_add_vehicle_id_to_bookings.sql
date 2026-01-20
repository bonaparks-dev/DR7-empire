-- Add vehicle_id column to bookings table
-- This allows for strict foreign key relationships instead of fuzzy name matching

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS "vehicle_id" uuid REFERENCES public.vehicles(id);

-- Create index for performance on vehicle_id
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON public.bookings(vehicle_id);

-- Add comment
COMMENT ON COLUMN public.bookings.vehicle_id IS 'Foreign key to vehicles table for precise availability checking';
