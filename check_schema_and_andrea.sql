-- Check the actual schema of customers_extended table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customers_extended'
ORDER BY ordinal_position;

-- Then get Andrea's full record with all available columns
SELECT *
FROM customers_extended
WHERE user_id = '9f4f8417-6383-42c9-9a3a-a712f8393275';
