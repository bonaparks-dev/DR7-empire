-- Check the schema of car_wash_services table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'car_wash_services'
ORDER BY ordinal_position;

-- Also check if there are any existing services
-- SELECT * FROM car_wash_services ORDER BY display_order;
