-- Find Sandro Pisceddu's booking using his email
-- Email: pisceddasandro87@gmail.com
-- Price: €25
-- Service: Car wash

-- Search by exact email
SELECT 
  id,
  created_at,
  service_type,
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
  booked_at,
  booking_details
FROM bookings
WHERE customer_email = 'pisceddasandro87@gmail.com'
ORDER BY created_at DESC;

-- If not found, check with ILIKE (case-insensitive)
SELECT 
  id,
  created_at,
  service_type,
  customer_name,
  customer_email,
  price_total / 100.0 as price_euros,
  payment_status,
  stripe_payment_intent_id
FROM bookings
WHERE customer_email ILIKE '%pisceddasandro87%'
ORDER BY created_at DESC;

-- Check if this email exists in the auth.users table
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'pisceddasandro87@gmail.com';

-- Check ALL bookings from last 7 days to see if anything matches
SELECT 
  id,
  created_at,
  service_type,
  customer_name,
  customer_email,
  price_total / 100.0 as price_euros,
  payment_status
FROM bookings
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
