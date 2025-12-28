-- Check for failed booking insertions in the last 7 days
-- This will help identify if there were any database errors

-- Check if there are ANY car wash bookings at all
SELECT COUNT(*) as total_carwash_bookings
FROM bookings
WHERE service_type = 'car_wash';

-- Check recent car wash bookings (to see if the table is working)
SELECT 
  id,
  created_at,
  customer_name,
  price_total / 100.0 as price_euros,
  payment_status
FROM bookings
WHERE service_type = 'car_wash'
  AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 10;

-- Check for any bookings with payment issues
SELECT 
  id,
  created_at,
  service_type,
  customer_name,
  payment_status,
  payment_method,
  stripe_payment_intent_id
FROM bookings
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND payment_status IN ('pending', 'failed')
ORDER BY created_at DESC;

-- Check if Sandro exists in ANY booking (not just car wash)
SELECT 
  id,
  created_at,
  service_type,
  customer_name,
  customer_email,
  payment_status
FROM bookings
WHERE customer_name ILIKE '%Sandro%'
   OR customer_name ILIKE '%Pisceddu%'
ORDER BY created_at DESC;
