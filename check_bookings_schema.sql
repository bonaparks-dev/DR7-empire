-- Query to check all column names in the bookings table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
ORDER BY ordinal_position;

-- Alternative: Get a sample row to see actual column names
-- SELECT * FROM bookings LIMIT 1;
