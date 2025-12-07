-- Group Fiat Panda Benzina Bianca vehicles to display as one option
-- This will make both white Panda vehicles appear as a single booking option
-- while checking availability across both physical vehicles

UPDATE vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{display_group}',
  '"fiat-panda-bianca"'
)
WHERE display_name ILIKE '%panda%bianca%'
  AND category = 'urban';

-- Verify the update
SELECT
  id,
  display_name,
  plate,
  status,
  metadata->>'display_group' as display_group,
  metadata->>'color' as color,
  metadata->>'image' as image
FROM vehicles
WHERE display_name ILIKE '%panda%bianca%'
ORDER BY display_name;
