-- Find bookings by email instead of user_id
-- Replace 'YOUR_EMAIL_HERE' with your actual email address

SELECT 
    id,
    user_id,
    vehicle_name,
    status,
    payment_method,
    price_total,
    booked_at,
    booking_details->>'email' as email,
    booking_details->>'firstName' as first_name,
    booking_details->>'lastName' as last_name
FROM bookings
WHERE booking_details->>'email' = 'YOUR_EMAIL_HERE'  -- REPLACE THIS
ORDER BY booked_at DESC
LIMIT 5;

-- Also check if there are ANY bookings at all today
SELECT 
    id,
    user_id,
    vehicle_name,
    payment_method,
    booked_at
FROM bookings
WHERE booked_at >= CURRENT_DATE
ORDER BY booked_at DESC;
