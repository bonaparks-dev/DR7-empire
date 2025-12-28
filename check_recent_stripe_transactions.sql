-- Check all recent Stripe transactions (last 7 days)
-- This will show if the payment was processed even if booking didn't save

-- First, check if there are any recent payments at all
SELECT 
  id,
  created_at,
  service_type,
  customer_name,
  customer_email,
  price_total / 100.0 as price_euros,
  payment_status,
  payment_method,
  stripe_payment_intent_id
FROM bookings
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND stripe_payment_intent_id IS NOT NULL
ORDER BY created_at DESC;

-- Check for €25 payments specifically
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
WHERE price_total = 2500  -- €25
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Check ALL bookings from last 7 days (any service type)
SELECT 
  id,
  created_at,
  service_type,
  customer_name,
  customer_email,
  price_total / 100.0 as price_euros,
  payment_status,
  payment_method
FROM bookings
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- Check for pending/failed payments that might be Sandro's
SELECT 
  id,
  created_at,
  service_type,
  customer_name,
  customer_email,
  customer_phone,
  price_total / 100.0 as price_euros,
  payment_status,
  stripe_payment_intent_id
FROM bookings
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND payment_status != 'paid'
ORDER BY created_at DESC;
