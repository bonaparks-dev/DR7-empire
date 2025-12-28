-- Fix vehicle price precision issues
-- This script ensures the daily_rate column uses NUMERIC(10,2) for exact decimal precision
-- This prevents issues where €4.90 becomes €5.00

-- Step 1: Alter the column to use explicit precision
-- NUMERIC(10,2) means: 10 total digits, 2 after decimal point
-- This ensures exact storage of prices like 4.90, 24.90, 44.90, etc.
ALTER TABLE vehicles 
ALTER COLUMN daily_rate TYPE NUMERIC(10,2);

-- Step 2: Verify the change
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'vehicles' AND column_name = 'daily_rate';

-- Step 3: Check current prices to ensure they're correct
SELECT id, display_name, daily_rate, status
FROM vehicles
WHERE status != 'retired'
ORDER BY daily_rate, display_name;

-- IMPORTANT NOTES FOR UPDATING PRICES:
-- When updating prices, always use exact decimal values:
-- ✅ CORRECT:   UPDATE vehicles SET daily_rate = 4.90 WHERE ...
-- ✅ CORRECT:   UPDATE vehicles SET daily_rate = 24.90 WHERE ...
-- ❌ INCORRECT: UPDATE vehicles SET daily_rate = 4.9 WHERE ...  (may cause rounding)
-- ❌ INCORRECT: UPDATE vehicles SET daily_rate = ROUND(4.90) WHERE ...  (will round to 5)

-- Example: Update a vehicle price to €4.90
-- UPDATE vehicles SET daily_rate = 4.90 WHERE display_name ILIKE '%vehicle_name%';
