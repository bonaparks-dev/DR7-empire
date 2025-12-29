-- Check the booking details to see if vehicle_name is stored correctly
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
    booking_details->>'vehicle_name' as details_vehicle_name
FROM bookings
WHERE user_id = '3b896d05-3d65-4819-a46a-ea9894343935'
  AND booked_at >= '2025-12-28'
ORDER BY booked_at DESC;
