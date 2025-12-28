-- Check if the bookings exist in the bookings table
-- These should match the credit transactions we found

SELECT 
    id,
    user_id,
    vehicle_name,
    pickup_date,
    dropoff_date,
    price_total,
    payment_method,
    payment_status,
    status,
    booked_at,
    booking_details->>'firstName' as first_name,
    booking_details->>'lastName' as last_name
FROM public.bookings
WHERE user_id = '3b896d05-3d65-4819-a46a-ea9894343935'
  AND vehicle_name = 'BMW M4 Competition'
  AND booked_at >= '2025-12-22 21:00:00'
ORDER BY booked_at DESC;

-- Also check ALL bookings for this user
SELECT 
    id,
    vehicle_name,
    payment_method,
    payment_status,
    status,
    booked_at,
    price_total
FROM public.bookings
WHERE user_id = '3b896d05-3d65-4819-a46a-ea9894343935'
ORDER BY booked_at DESC
LIMIT 20;
