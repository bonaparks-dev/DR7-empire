-- Fix the pending booking to confirmed
UPDATE bookings
SET status = 'confirmed'
WHERE id = '087f42a1-4c7b-4532-844d-bc7d9da06e51';

-- Verify both bookings are now confirmed
SELECT 
    id,
    vehicle_name,
    status,
    payment_method,
    payment_status,
    price_total,
    booked_at
FROM bookings
WHERE user_id = '6eda7959-6591-4cb8-b2c4-72d1c416ea73'
  AND DATE(booked_at) = CURRENT_DATE
ORDER BY booked_at DESC;
