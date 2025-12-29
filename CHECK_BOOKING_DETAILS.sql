-- Check the full booking details to see customer information
SELECT 
    id,
    vehicle_name,
    status,
    booking_details
FROM bookings
WHERE id IN ('89023ea2-3817-4726-9ee8-d14a2bf41846', '087f42a1-4c7b-4532-844d-bc7d9da06e51')
ORDER BY booked_at DESC;
