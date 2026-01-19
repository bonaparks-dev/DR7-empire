-- Add dual pricing to all exotic (supercar) vehicles
-- This ensures all supercars display both resident and non-resident pricing
-- Using the standard supercar pricing: €349 resident / €449 non-resident

-- Update exotic vehicles that don't have dual pricing set yet
UPDATE vehicles
SET 
  price_resident_daily = 349,
  price_nonresident_daily = 449
WHERE 
  category = 'exotic'
  AND (price_resident_daily IS NULL OR price_nonresident_daily IS NULL);

-- Verify the update
SELECT 
  display_name,
  daily_rate,
  price_resident_daily,
  price_nonresident_daily,
  category
FROM vehicles
WHERE category = 'exotic'
ORDER BY display_name;
