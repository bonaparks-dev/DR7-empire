-- Fix the existing booking that was created with 'pending' status
-- This updates your most recent credit wallet booking to 'confirmed'

UPDATE bookings
SET status = 'confirmed'
WHERE user_id = '3b896d05-3d65-4819-a46a-ea9894343935'
  AND payment_method = 'credit'
  AND status = 'pending'
  AND booked_at >= NOW() - INTERVAL '1 hour';

-- Verify the update
SELECT 
    id,
    vehicle_name,
    status,
    payment_status,
    payment_method,
    booked_at
FROM bookings
WHERE user_id = '3b896d05-3d65-4819-a46a-ea9894343935'
ORDER BY booked_at DESC
LIMIT 3;
