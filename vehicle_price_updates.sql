-- 1. Update RS3 Rossa - set back to available with price 70 euros
UPDATE vehicles 
SET daily_rate = 70,
    status = 'available'
WHERE display_name ILIKE '%rs3%rossa%' OR display_name ILIKE '%rs3 rossa%';

-- 2. Update C63 price to 200 euros
UPDATE vehicles 
SET daily_rate = 200 
WHERE display_name ILIKE '%c63%';

-- Verify the changes
SELECT display_name, daily_rate, status, plate 
FROM vehicles 
WHERE display_name ILIKE '%rs3%rossa%' 
   OR display_name ILIKE '%c63%'
ORDER BY display_name;
