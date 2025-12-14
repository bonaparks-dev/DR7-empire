-- Update Vito vehicle image and display name in database
UPDATE vehicles 
SET 
  display_name = 'Mercedes Vito VIP DR7',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{image}',
    '"/mercedes_vito.jpeg"'
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
