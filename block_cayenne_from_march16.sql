-- Block Porsche Cayenne S Coupé from March 16, 2026 indefinitely
-- Sets unavailable_from in vehicle metadata (checked by admin + website availability functions)

UPDATE vehicles
SET metadata = COALESCE(metadata, '{}'::jsonb)
  || jsonb_build_object(
    'unavailable_from', '2026-03-16',
    'unavailable_until', '2099-12-31',
    'unavailable_from_time', '00:00',
    'unavailable_until_time', '23:59'
  ),
  updated_at = NOW()
WHERE display_name ILIKE '%Cayenne%';

-- Verify the update
SELECT id, display_name, plate, status,
  metadata->>'unavailable_from' AS unavailable_from,
  metadata->>'unavailable_until' AS unavailable_until
FROM vehicles
WHERE display_name ILIKE '%Cayenne%';
