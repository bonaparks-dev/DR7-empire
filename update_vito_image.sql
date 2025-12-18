-- Update Vito vehicle to ensure correct image path
UPDATE vehicles 
SET 
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{image}',
    '"/vito.jpeg"'
  )
WHERE 
  category = 'aziendali' 
  AND (
    display_name ILIKE '%vito%' 
    OR display_name ILIKE '%v class%'
    OR display_name ILIKE '%v-class%'
  );

-- Verify the update
SELECT id, display_name, category, metadata->'image' as image_path, daily_rate
FROM vehicles
WHERE category = 'aziendali';
