-- Check for recent car wash bookings (last 24 hours)
SELECT 
  id,
  created_at,
  service_type,
  service_name,
  customer_name,
  customer_email,
  appointment_date,
  appointment_time,
  price_total,
  payment_status,
  payment_method,
  status,
  nexi_order_id,
  nexi_payment_id
FROM bookings
WHERE service_type = 'car_wash'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;
