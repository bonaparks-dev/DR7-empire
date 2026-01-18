-- Update Citroën C3 vehicle images to use specific color variants
-- Red C3 -> c3r.jpeg
-- White C3 -> c3w.jpeg (note: typo in request "cr3w" should be "c3w")

-- First, let's check what C3 vehicles exist
-- SELECT id, display_name, metadata->'image' as current_image
-- FROM vehicles 
-- WHERE display_name ILIKE '%c3%' AND display_name NOT ILIKE '%c63%';

-- Update Red C3 to use c3r.jpeg
UPDATE vehicles 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{image}',
  '"/c3r.jpeg"'::jsonb
)
WHERE display_name ILIKE '%c3%' 
  AND display_name NOT ILIKE '%c63%'
  AND (display_name ILIKE '%red%' OR display_name ILIKE '%ross%' OR display_name ILIKE '%roug%');

-- Update White C3 to use cr3w.jpeg
UPDATE vehicles 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{image}',
  '"/cr3w.jpeg"'::jsonb
)
WHERE display_name ILIKE '%c3%' 
  AND display_name NOT ILIKE '%c63%'
  AND (display_name ILIKE '%white%' OR display_name ILIKE '%bianc%' OR display_name ILIKE '%blanc%');
