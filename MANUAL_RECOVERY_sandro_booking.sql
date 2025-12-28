-- MANUAL RECOVERY: Create missing booking for Sandro Pisceddu
-- Payment Intent: pi_3SijNgQcprtTyo8t3ISHHv5Z
-- Customer: Sandro Pisceddu (pisceddasandro87@gmail.com)
-- Amount: €25

-- IMPORTANT: Before running this, you need to determine from Stripe:
-- 1. Was this a CAR WASH booking or LOTTERY TICKET?
-- 2. What was the appointment date/time (if car wash)?
-- 3. What service exactly (if car wash)?

-- IF IT WAS A CAR WASH BOOKING:
-- You'll need to fill in these details from Stripe metadata or contact the customer:
-- - appointment_date
-- - appointment_time
-- - service_name
-- - customer phone number
-- - customer address details

-- TEMPLATE for car wash booking (DO NOT RUN YET - need more info):
/*
INSERT INTO bookings (
  user_id,
  service_type,
  service_name,
  customer_name,
  customer_email,
  customer_phone,
  appointment_date,
  appointment_time,
  price_total,
  currency,
  payment_status,
  payment_method,
  stripe_payment_intent_id,
  status,
  booked_at,
  created_at
) VALUES (
  NULL,  -- or find user_id from auth.users where email = 'pisceddasandro87@gmail.com'
  'car_wash',
  'LAVAGGIO COMPLETO',  -- €25 service
  'Sandro Pisceddu',
  'pisceddasandro87@gmail.com',
  'PHONE_NUMBER_HERE',  -- Get from Stripe or contact customer
  'APPOINTMENT_DATE_HERE',  -- Get from Stripe metadata
  'APPOINTMENT_TIME_HERE',  -- Get from Stripe metadata
  2500,  -- €25 in cents
  'EUR',
  'paid',
  'online',
  'pi_3SijNgQcprtTyo8t3ISHHv5Z',
  'confirmed',
  NOW(),
  NOW()
);
*/

-- IF IT WAS A LOTTERY TICKET:
-- Check if ticket number is still available, then insert

-- First, check what ticket numbers are available
SELECT ticket_number 
FROM generate_series(1, 2000) AS ticket_number
WHERE ticket_number NOT IN (
  SELECT ticket_number FROM commercial_operation_tickets
)
ORDER BY ticket_number
LIMIT 10;

-- TEMPLATE for lottery ticket (DO NOT RUN YET):
/*
INSERT INTO commercial_operation_tickets (
  uuid,
  ticket_number,
  email,
  full_name,
  payment_intent_id,
  amount_paid,
  currency,
  quantity,
  purchase_date
) VALUES (
  gen_random_uuid()::text,
  NEXT_AVAILABLE_TICKET_NUMBER,  -- From query above
  'pisceddasandro87@gmail.com',
  'Sandro Pisceddu',
  'pi_3SijNgQcprtTyo8t3ISHHv5Z',
  2500,  -- €25 in cents
  'eur',
  1,
  NOW()
);
*/

-- NEXT STEPS:
-- 1. Check Stripe dashboard for payment pi_3SijNgQcprtTyo8t3ISHHv5Z
-- 2. Look at the metadata to determine if it was car_wash or lottery
-- 3. Get all the missing details (appointment date/time, phone, etc.)
-- 4. Then we can create the proper INSERT statement
