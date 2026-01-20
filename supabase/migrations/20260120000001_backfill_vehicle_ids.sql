-- Backfill vehicle_id in bookings table
-- This populates the new vehicle_id column from existing data

-- Step 1: Update from booking_details JSON (if vehicle_id exists there)
UPDATE public.bookings
SET vehicle_id = (booking_details->>'vehicle_id')::uuid
WHERE vehicle_id IS NULL
  AND booking_details IS NOT NULL
  AND booking_details->>'vehicle_id' IS NOT NULL
  AND (booking_details->>'vehicle_id')::uuid IN (SELECT id FROM public.vehicles);

-- Step 2: Update by matching vehicle_name to vehicles.display_name
UPDATE public.bookings b
SET vehicle_id = v.id
FROM public.vehicles v
WHERE b.vehicle_id IS NULL
  AND b.vehicle_name IS NOT NULL
  AND LOWER(TRIM(b.vehicle_name)) = LOWER(TRIM(v.display_name));

-- Step 3: Update by matching vehicle_plate (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'vehicle_plate'
  ) THEN
    EXECUTE '
      UPDATE public.bookings b
      SET vehicle_id = v.id
      FROM public.vehicles v
      WHERE b.vehicle_id IS NULL
        AND b.vehicle_plate IS NOT NULL
        AND LOWER(TRIM(b.vehicle_plate)) = LOWER(TRIM(v.plate))
    ';
  END IF;
END $$;

-- Report results
SELECT 
  COUNT(*) FILTER (WHERE vehicle_id IS NOT NULL) as bookings_with_vehicle_id,
  COUNT(*) FILTER (WHERE vehicle_id IS NULL) as bookings_without_vehicle_id,
  COUNT(*) as total_bookings
FROM public.bookings;
