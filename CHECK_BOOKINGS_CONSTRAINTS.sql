-- Run this query in Supabase SQL Editor to see all NOT NULL constraints
-- This will show you which fields MUST have a value vs which can be empty

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings'
ORDER BY
    CASE WHEN is_nullable = 'NO' THEN 0 ELSE 1 END,
    column_name;

-- This query shows:
-- - column_name: The field name
-- - data_type: The type (text, integer, timestamp, etc.)
-- - is_nullable: 'NO' means required, 'YES' means optional
-- - column_default: Default value if any

-- Look for columns with is_nullable = 'NO'
-- Those are the ones causing "violates not-null constraint" errors
