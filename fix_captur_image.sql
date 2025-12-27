-- Quick fix for Renault Captur vehicle
-- Run this in Supabase SQL Editor to update existing Captur vehicles

-- Update any Renault Captur vehicles to ensure they have the correct image
UPDATE public.vehicles
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{image}',
  '"/captur.jpeg"'
)
WHERE LOWER(display_name) LIKE '%captur%'
  AND (metadata->>'image' IS NULL OR metadata->>'image' = '/default-car.jpeg');

-- Verify the update
SELECT 
  display_name,
  daily_rate,
  category,
  status,
  metadata->>'image' as image_path
FROM public.vehicles
WHERE LOWER(display_name) LIKE '%captur%';
