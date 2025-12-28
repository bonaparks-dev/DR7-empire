-- Check if Sandro Pisceddu bought lottery tickets
-- Email: pisceddasandro87@gmail.com
-- Lottery tickets are €25 each (NOT €20!)

-- Check lottery ticket purchases by email
SELECT 
  id,
  created_at,
  purchase_date,
  full_name,
  email,
  ticket_number,
  quantity,
  amount_paid / 100.0 as price_euros,
  payment_intent_id,
  uuid
FROM commercial_operation_tickets
WHERE email = 'pisceddasandro87@gmail.com'
ORDER BY created_at DESC;

-- Check with case-insensitive search
SELECT 
  id,
  created_at,
  full_name,
  email,
  ticket_number,
  quantity,
  amount_paid / 100.0 as price_euros,
  payment_intent_id
FROM commercial_operation_tickets
WHERE email ILIKE '%pisceddasandro87%'
   OR full_name ILIKE '%Sandro%'
   OR full_name ILIKE '%Pisceddu%'
ORDER BY created_at DESC;

-- Check for €25 lottery purchases (1 ticket = €25)
SELECT 
  id,
  created_at,
  full_name,
  email,
  ticket_number,
  quantity,
  amount_paid / 100.0 as price_euros,
  payment_intent_id
FROM commercial_operation_tickets
WHERE amount_paid = 2500  -- Exactly €25
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Check ALL recent lottery tickets to see the pattern
SELECT 
  id,
  created_at,
  full_name,
  email,
  ticket_number,
  amount_paid / 100.0 as price_euros
FROM commercial_operation_tickets
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;
