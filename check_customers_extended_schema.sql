-- Check the complete schema of customers_extended table
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'customers_extended'
ORDER BY 
    ordinal_position;
