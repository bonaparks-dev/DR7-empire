-- Check the exact price value stored in database for your Renault Clio
-- Run this in Supabase SQL Editor

SELECT 
  display_name,
  daily_rate,
  pg_typeof(daily_rate) as price_data_type,
  category,
  status
FROM public.vehicles
WHERE display_name ILIKE '%clio%'
ORDER BY created_at DESC
LIMIT 5;
