-- Update the most recent car wash booking to completed status
-- This is the booking from 21:51:07 (ID: 532d14ad-c6f0-4599-aeeb-572cae096a0d)
UPDATE bookings
SET payment_status = 'completed'
WHERE id = '532d14ad-c6f0-4599-aeeb-572cae096a0d';

-- Verify the update
SELECT id, customer_name, appointment_time, payment_status, status
FROM bookings
WHERE id = '532d14ad-c6f0-4599-aeeb-572cae096a0d';

-- Optional: Update ALL pending Nexi car wash bookings to completed
-- (Uncomment if you want to update all test bookings)
-- UPDATE bookings
-- SET payment_status = 'completed'
-- WHERE service_type = 'car_wash'
--   AND payment_method = 'nexi'
--   AND payment_status = 'pending'
--   AND created_at > NOW() - INTERVAL '1 hour';
