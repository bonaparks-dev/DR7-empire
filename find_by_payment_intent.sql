-- Find transaction by Stripe Payment Intent ID (FIXED - correct column names)
-- Payment Intent: pi_3SijNgQcprtTyo8t3ISHHv5Z

-- Check if it's in the bookings table (car wash or car rental)
SELECT 
  id,
  created_at,
  service_type,
  service_name,
  customer_name,
  customer_email,
  customer_phone,
  appointment_date,
  appointment_time,
  price_total,
  payment_status,
  payment_method,
  stripe_payment_intent_id
FROM bookings
WHERE stripe_payment_intent_id = 'pi_3SijNgQcprtTyo8t3ISHHv5Z';

-- Check if it's in the lottery tickets table
SELECT 
  id,
  created_at,
  full_name,
  email,
  ticket_number,
  amount_paid,
  payment_intent_id
FROM commercial_operation_tickets
WHERE payment_intent_id = 'pi_3SijNgQcprtTyo8t3ISHHv5Z';

-- If not found, search by email in bookings
SELECT 
  id,
  created_at,
  service_type,
  customer_name,
  customer_email,
  price_total,
  payment_status,
  stripe_payment_intent_id
FROM bookings
WHERE customer_email = 'pisceddasandro87@gmail.com'
ORDER BY created_at DESC;

-- Search by email in lottery tickets
SELECT 
  id,
  created_at,
  full_name,
  email,
  ticket_number,
  amount_paid,
  payment_intent_id
FROM commercial_operation_tickets
WHERE email = 'pisceddasandro87@gmail.com'
ORDER BY created_at DESC;
