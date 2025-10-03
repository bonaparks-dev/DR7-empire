-- Fix the ONLY remaining NOT NULL constraint blocking car wash bookings
-- pickup_location is the last field that requires a value

-- Make pickup_location nullable
ALTER TABLE public.bookings
ALTER COLUMN pickup_location DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN public.bookings.pickup_location IS 'Required for car rentals, NULL for car wash bookings (service at fixed location)';

-- Verify the change
SELECT
    column_name,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name = 'pickup_location';
