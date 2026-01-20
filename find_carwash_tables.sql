-- Query to find all tables related to car wash
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%wash%' OR table_name LIKE '%service%'
ORDER BY table_name;

-- Alternative: Check all tables
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
