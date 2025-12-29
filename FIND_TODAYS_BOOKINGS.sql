-- Find ALL bookings from today (any user)
SELECT 
    id,
    user_id,
    vehicle_name,
    status,
    payment_method,
    payment_status,
    price_total,
    booked_at,
    booking_details->>'firstName' as first_name,
    booking_details->>'lastName' as last_name,
    booking_details->>'email' as email
FROM bookings
WHERE DATE(booked_at) = CURRENT_DATE
ORDER BY booked_at DESC;

-- If nothing shows, check the last 3 days
SELECT 
    id,
    user_id,
    vehicle_name,
    status,
    payment_method,
    price_total,
    booked_at
FROM bookings
WHERE booked_at >= CURRENT_DATE - INTERVAL '3 days'
ORDER BY booked_at DESC;
