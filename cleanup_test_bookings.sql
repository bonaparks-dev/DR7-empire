-- Update the ONE successful booking to completed status
-- Which booking was successful? (You need to tell me which one)
-- Most recent: 532d14ad-c6f0-4599-aeeb-572cae096a0d (21:51:07)

-- Update the successful booking
UPDATE bookings
SET payment_status = 'completed'
WHERE id = '532d14ad-c6f0-4599-aeeb-572cae096a0d';

-- Delete the FAILED test bookings (the other 4)
DELETE FROM bookings
WHERE id IN (
  '1b8a2af7-f968-46be-a171-e6ace770eab4',  -- 21:47:11
  '710ff6ef-fea8-4faf-8b1e-8608b07be68a',  -- 21:43:15
  '1b7eea5f-59fc-4b6f-8ba5-42d716b57635',  -- 21:43:11
  '563abb3f-7ce7-403c-82b9-727d3e665ca6'   -- 21:40:39
);

-- Verify the cleanup
SELECT id, created_at, customer_name, appointment_time, payment_status, status
FROM bookings
WHERE service_type = 'car_wash'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
