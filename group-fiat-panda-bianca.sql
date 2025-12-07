-- Group vehicles that are the same model but with different license plates
-- This allows multiple physical vehicles to be displayed as one booking option
-- while checking availability across all units

-- 1. Fiat Panda Benzina Bianca
UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"fiat-panda-bianca"'
)
WHERE display_name ILIKE '%panda%bianca%'
  AND category = 'urban';

-- 2. Clio 4 Arancioni
UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"clio-4-arancione"'
)
WHERE display_name ILIKE '%clio%4%arancio%'
  AND category = 'urban';

-- 3. Clio 4 Blu
UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"clio-4-blu"'
)
WHERE display_name ILIKE '%clio%4%blu%'
  AND category = 'urban';

-- 4. Peugeot 208 Bianche
UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"peugeot-208-bianca"'
)
WHERE display_name ILIKE '%208%bianc%'
  AND category = 'urban';

-- 5. Citroën C3 Nere
UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"citroen-c3-nera"'
)
WHERE display_name ILIKE '%c3%ner%'
  AND category = 'urban';

-- Verify all updates
SELECT
  id,
  display_name,
  plate,
  status,
  metadata->>'display_group' as display_group,
  metadata->>'color' as color,
  metadata->>'image' as image
FROM vehicles
WHERE metadata->>'display_group' IS NOT NULL
ORDER BY metadata->>'display_group', display_name;
