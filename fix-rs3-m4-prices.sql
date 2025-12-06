-- Fix missing prices for RS3 and M4
-- This script updates the daily_rate for vehicles that are missing prices

-- 1. Update RS3 Rossa to 70 EUR per day
UPDATE vehicles
SET daily_rate = 70,
    status = 'available'
WHERE (display_name ILIKE '%rs3%' AND display_name ILIKE '%rossa%')
   OR display_name = 'Audi RS3 Rossa';

-- 2. Update BMW M4 Competition to 80 EUR per day
UPDATE vehicles
SET daily_rate = 80,
    status = 'available'
WHERE display_name ILIKE '%m4%competition%'
   OR display_name ILIKE '%m4 competition%'
   OR display_name = 'BMW M4 Competition';

-- Verify the changes
SELECT
    display_name,
    daily_rate,
    status,
    plate,
    category
FROM vehicles
WHERE display_name ILIKE '%rs3%'
   OR display_name ILIKE '%m4%'
ORDER BY display_name;
