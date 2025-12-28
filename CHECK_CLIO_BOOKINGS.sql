SELECT 
  id, 
  vehicle_name, 
  pickup_date, 
  dropoff_date, 
  status, 
  payment_status 
FROM bookings 
WHERE 
  vehicle_name ILIKE '%Clio%Arancione%' 
  AND dropoff_date > '2025-12-30' 
  AND pickup_date < '2026-01-02'
ORDER BY dropoff_date;
