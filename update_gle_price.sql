-- Update GLE price to 200 euros per day
UPDATE vehicles
SET daily_rate = 200
WHERE display_name ILIKE '%gle%';

-- Verify the change
SELECT id, display_name, daily_rate, status, plate
FROM vehicles
WHERE display_name ILIKE '%gle%';
