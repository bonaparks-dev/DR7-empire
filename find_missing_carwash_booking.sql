-- Query to find recent car wash bookings
-- This will help identify the missing booking that was paid but not notified

-- Find all car wash bookings from the last 7 days
SELECT 
  id,
  created_at,
  service_name,
  customer_name,
  customer_email,
  customer_phone,
  appointment_date,
  appointment_time,
  price_total / 100.0 as price_euros,
  payment_status,
  payment_method,
  stripe_payment_intent_id,
  booked_at
FROM bookings
WHERE service_type = 'car_wash'
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Find car wash bookings that are paid but might be missing notifications
-- (Look for bookings created recently without corresponding email logs)
SELECT 
  id,
  created_at,
  service_name,
  customer_name,
  customer_email,
  customer_phone,
  appointment_date,
  appointment_time,
  price_total / 100.0 as price_euros,
  payment_status,
  stripe_payment_intent_id
FROM bookings
WHERE service_type = 'car_wash'
  AND payment_status = 'paid'
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Find the most recent car wash booking
SELECT 
  id,
  created_at,
  service_name,
  customer_name,
  customer_email,
  customer_phone,
  appointment_date,
  appointment_time,
  price_total / 100.0 as price_euros,
  payment_status,
  payment_method,
  stripe_payment_intent_id,
  booking_details
FROM bookings
WHERE service_type = 'car_wash'
ORDER BY created_at DESC
LIMIT 1;
