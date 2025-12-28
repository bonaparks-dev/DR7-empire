-- Setup Vehicle Grouping for ALL Duplicate/Triple Vehicles
-- This script sets up display_group metadata for all vehicles that have duplicates
-- Based on the add-urban-vehicles.sql file, these vehicles have duplicates:
-- 1. Fiat Panda Benzina Bianca (2x)
-- 2. Renault Clio 4 Arancione (2x)
-- 3. Renault Clio 4 Blu (2x)
-- 4. Peugeot 208 Bianca (2x)
-- 5. Citroën C3 Nera (2x)
-- 6. Renault Captur (2 blue + 1 orange)

-- Step 1: View ALL current vehicles to identify duplicates
SELECT 
  display_name,
  COUNT(*) as count,
  array_agg(plate) as plates,
  array_agg(metadata->>'color') as colors,
  array_agg(status) as statuses
FROM vehicles
WHERE category = 'urban' AND status != 'retired'
GROUP BY display_name
ORDER BY count DESC, display_name;

-- Step 2: RETIRE any vehicles without images (empty cards)
UPDATE vehicles 
SET status = 'retired'
WHERE status != 'retired'
  AND (
    metadata->>'image' IS NULL 
    OR metadata->>'image' = '' 
    OR metadata->>'image' = '/default-car.jpeg'
  );

-- Step 3: Set up display_group for FIAT PANDA BIANCA (2x)
UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"fiat-panda-bianca"'
)
WHERE display_name ILIKE '%panda%'
  AND (metadata->>'color' ILIKE '%bianca%' OR metadata->>'color' ILIKE '%white%')
  AND status != 'retired';

-- Step 4: Set up display_group for RENAULT CLIO 4 ARANCIONE (2x)
UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"clio-4-arancione"'
)
WHERE display_name ILIKE '%clio%'
  AND (metadata->>'color' ILIKE '%arancio%' OR metadata->>'color' ILIKE '%orange%')
  AND status != 'retired';

-- Step 5: Set up display_group for RENAULT CLIO 4 BLU (2x)
UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"clio-4-blu"'
)
WHERE display_name ILIKE '%clio%'
  AND (metadata->>'color' ILIKE '%blu%' OR metadata->>'color' ILIKE '%blue%')
  AND status != 'retired';

-- Step 6: Set up display_group for PEUGEOT 208 BIANCA (2x)
UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"peugeot-208-bianca"'
)
WHERE display_name ILIKE '%208%'
  AND (metadata->>'color' ILIKE '%bianca%' OR metadata->>'color' ILIKE '%white%')
  AND status != 'retired';

-- Step 7: Set up display_group for CITROËN C3 NERA (2x)
UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"citroen-c3-nera"'
)
WHERE display_name ILIKE '%c3%'
  AND (metadata->>'color' ILIKE '%nera%' OR metadata->>'color' ILIKE '%black%')
  AND status != 'retired';

-- Step 8: Set up display_group for RENAULT CAPTUR BLUE (2x)
UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"renault-captur-blue"'
)
WHERE display_name ILIKE '%captur%'
  AND (metadata->>'color' ILIKE '%blu%' OR metadata->>'color' ILIKE '%blue%')
  AND status != 'retired';

-- Step 9: Set up display_group for RENAULT CAPTUR ORANGE (1x - keep separate)
UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"renault-captur-orange"'
)
WHERE display_name ILIKE '%captur%'
  AND (metadata->>'color' ILIKE '%orange%' OR metadata->>'color' ILIKE '%arancio%')
  AND status != 'retired';

-- Step 10: Verify ALL groupings
SELECT 
  metadata->>'display_group' as display_group,
  display_name,
  plate,
  metadata->>'color' as color,
  metadata->>'image' as image,
  status
FROM vehicles
WHERE category = 'urban' AND status != 'retired'
ORDER BY metadata->>'display_group', plate;

-- Step 11: Count vehicles per group (should show 2 per group for duplicates)
SELECT 
  metadata->>'display_group' as display_group,
  COUNT(*) as vehicle_count,
  array_agg(plate) as plates
FROM vehicles
WHERE category = 'urban' 
  AND status != 'retired'
  AND metadata->>'display_group' IS NOT NULL
GROUP BY metadata->>'display_group'
ORDER BY display_group;

-- Expected Results:
-- - fiat-panda-bianca: 2 vehicles
-- - clio-4-arancione: 2 vehicles
-- - clio-4-blu: 2 vehicles
-- - peugeot-208-bianca: 2 vehicles
-- - citroen-c3-nera: 2 vehicles
-- - renault-captur-blue: 2 vehicles
-- - renault-captur-orange: 1 vehicle
-- Total: 13 vehicles, but only 7 cards on website (one per group)
