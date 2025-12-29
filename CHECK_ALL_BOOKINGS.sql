-- Check ALL recent bookings without date filter
SELECT 
    id,
    vehicle_name,
    vehicle_type,
    status,
    payment_status,
    payment_method,
    price_total,
    booked_at,
    booking_details->>'firstName' as first_name,
    booking_details->>'lastName' as last_name,
    booking_details->>'email' as email,
    booking_details->>'phone' as phone
FROM bookings
WHERE user_id = '3b896d05-3d65-4819-a46a-ea9894343935'
ORDER BY booked_at DESC
LIMIT 5;

-- Also check the full booking_details JSON for the most recent one
SELECT 
    id,
    vehicle_name,
    booked_at,
    booking_details
FROM bookings
WHERE user_id = '3b896d05-3d65-4819-a46a-ea9894343935'
ORDER BY booked_at DESC
LIMIT 1;
