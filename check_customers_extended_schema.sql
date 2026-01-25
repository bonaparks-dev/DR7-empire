-- Get the FULL schema of customers_extended including all constraints and NOT NULL columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customers_extended'
ORDER BY ordinal_position;
