-- Add vehicle_plate column to bookings for precise availability matching
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS "vehicle_plate" character varying;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_plate ON public.bookings(vehicle_plate);

-- Backfill from vehicles table where vehicle_id is set
UPDATE public.bookings b
SET vehicle_plate = v.plate
FROM public.vehicles v
WHERE b.vehicle_id = v.id
  AND b.vehicle_plate IS NULL
  AND v.plate IS NOT NULL;

COMMENT ON COLUMN public.bookings.vehicle_plate IS 'Vehicle license plate (targa) — for availability cross-check by plate when vehicle_id is missing or mismatched';
