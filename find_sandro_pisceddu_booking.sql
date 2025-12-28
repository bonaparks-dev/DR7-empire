-- Find Sandro Pisceddu's €25 car wash booking
-- Searching for recent bookings matching the customer name and price

SELECT 
  id,
  created_at,
  service_name,
  customer_name,
  customer_email,
  customer_phone,
  customer_codice_fiscale,
  appointment_date,
  appointment_time,
  price_total / 100.0 as price_euros,
  payment_status,
  payment_method,
  stripe_payment_intent_id,
  booked_at
FROM bookings
WHERE service_type = 'car_wash'
  AND price_total = 2500  -- €25 in cents
  AND (
    customer_name ILIKE '%Sandro%Pisceddu%'
    OR customer_name ILIKE '%Pisceddu%Sandro%'
    OR customer_name ILIKE '%Sandro%'
    OR customer_name ILIKE '%Pisceddu%'
  )
ORDER BY created_at DESC;

-- If not found, show ALL recent €25 car wash bookings
-- (in case the name was spelled differently)
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
  stripe_payment_intent_id
FROM bookings
WHERE service_type = 'car_wash'
  AND price_total = 2500  -- €25 in cents
  AND created_at >= NOW() - INTERVAL '7 days'
  AND payment_status = 'paid'
ORDER BY created_at DESC;

-- Show the booking details including notes
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
  stripe_payment_intent_id,
  booking_details
FROM bookings
WHERE service_type = 'car_wash'
  AND price_total = 2500
  AND (
    customer_name ILIKE '%Sandro%'
    OR customer_name ILIKE '%Pisceddu%'
  )
ORDER BY created_at DESC
LIMIT 5;
