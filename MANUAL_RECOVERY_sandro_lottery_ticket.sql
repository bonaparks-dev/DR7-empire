-- MANUAL RECOVERY: Create missing lottery ticket for Sandro Piscedda
-- Payment Intent: pi_3SijNgQcprtTyo8t3ISHHv5Z
-- Customer: Sandro Piscedda (pisceddasandro87@gmail.com)
-- Phone: 3459798659
-- Amount: €25 (2500 cents)
-- Purchase Date: 2025-12-26 23:22:14 (11:22:14 PM)

-- Step 1: Find an available ticket number
SELECT ticket_number 
FROM generate_series(1, 2000) AS ticket_number
WHERE ticket_number NOT IN (
  SELECT ticket_number FROM commercial_operation_tickets
)
ORDER BY ticket_number
LIMIT 1;

-- Step 2: Get Sandro's user_id
SELECT id as user_id
FROM auth.users
WHERE email = 'pisceddasandro87@gmail.com';

-- Step 3: Insert the lottery ticket
-- IMPORTANT: Replace TICKET_NUMBER_HERE with the result from Step 1
-- IMPORTANT: Replace USER_ID_HERE with the result from Step 2 (or use NULL if not found)

INSERT INTO commercial_operation_tickets (
  uuid,
  ticket_number,
  user_id,
  email,
  full_name,
  payment_intent_id,
  amount_paid,
  currency,
  quantity,
  purchase_date,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid()::text,
  TICKET_NUMBER_HERE,  -- Replace with available ticket number from Step 1
  'USER_ID_HERE',  -- Replace with user_id from Step 2, or NULL
  'pisceddasandro87@gmail.com',
  'Sandro Piscedda',
  'pi_3SijNgQcprtTyo8t3ISHHv5Z',
  2500,  -- €25 in cents
  'eur',
  1,  -- 1 ticket
  '2025-12-26 23:22:14+00',  -- Purchase timestamp from Stripe
  '2025-12-26 23:22:14+00',
  '2025-12-26 23:22:14+00'
)
RETURNING *;

-- Step 4: Verify the ticket was created
SELECT 
  id,
  ticket_number,
  full_name,
  email,
  amount_paid / 100.0 as price_euros,
  payment_intent_id,
  purchase_date
FROM commercial_operation_tickets
WHERE payment_intent_id = 'pi_3SijNgQcprtTyo8t3ISHHv5Z';
