-- Setup Renault Captur Vehicle Grouping
-- This script:
-- 1. Retires the empty Captur (without image)
-- 2. Groups the 2 blue Capturs together so they work as fallbacks
-- 3. Keeps the orange Captur separate

-- Step 1: Find ALL Renault Captur vehicles
SELECT 
  id,
  display_name,
  plate,
  status,
  daily_rate,
  metadata->>'color' as color,
  metadata->>'image' as image,
  metadata->>'display_group' as display_group,
  created_at
FROM vehicles
WHERE display_name ILIKE '%captur%'
ORDER BY metadata->>'color', created_at;

-- Step 2: RETIRE the empty Captur (the one without an image)
UPDATE vehicles 
SET status = 'retired'
WHERE display_name ILIKE '%captur%' 
  AND (
    metadata->>'image' IS NULL 
    OR metadata->>'image' = '' 
    OR metadata->>'image' = '/default-car.jpeg'
  );

-- Step 3: Group the 2 BLUE Capturs together
-- This ensures when one is booked, the system automatically offers the other
UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"renault-captur-blue"'
)
WHERE display_name ILIKE '%captur%'
  AND (metadata->>'color' ILIKE '%blu%' OR metadata->>'color' ILIKE '%blue%')
  AND status != 'retired';

-- Step 4: Set ORANGE Captur group (keeps it separate from blue)
UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"renault-captur-orange"'
)
WHERE display_name ILIKE '%captur%'
  AND (metadata->>'color' ILIKE '%orange%' OR metadata->>'color' ILIKE '%arancio%')
  AND status != 'retired';

-- Step 5: Verify the setup
SELECT 
  id,
  display_name,
  plate,
  status,
  daily_rate,
  metadata->>'color' as color,
  metadata->>'image' as image,
  metadata->>'display_group' as display_group
FROM vehicles
WHERE display_name ILIKE '%captur%'
  AND status != 'retired'
ORDER BY metadata->>'display_group', plate;

-- Expected result: 
-- - 2 blue Capturs with display_group = 'renault-captur-blue'
-- - 1 orange Captur with display_group = 'renault-captur-orange'
-- - All should have valid images
-- - Total: 3 vehicles, but only 2 cards will show on website (blue group + orange)
