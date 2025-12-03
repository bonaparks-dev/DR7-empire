-- 1. Remove RS3 Verde (set status to 'retired' to keep historical data)
UPDATE vehicles 
SET status = 'retired'
WHERE display_name ILIKE '%rs3%verde%' OR display_name ILIKE '%rs3 verde%';

-- 2. Update M3 price to 120 euros
UPDATE vehicles 
SET daily_rate = 120 
WHERE display_name ILIKE '%m3%' AND display_name NOT ILIKE '%m340%';

-- 3. Update 911 Carrera price to 250 euros
UPDATE vehicles 
SET daily_rate = 250 
WHERE display_name ILIKE '%911%carrera%' OR display_name ILIKE '%carrera%';

-- Verify all changes
SELECT display_name, daily_rate, status, plate 
FROM vehicles 
WHERE display_name ILIKE '%rs3%' 
   OR display_name ILIKE '%m3%' 
   OR display_name ILIKE '%911%' 
   OR display_name ILIKE '%carrera%'
ORDER BY display_name;
