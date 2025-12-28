-- Check recent credit wallet bookings
-- This query will show all bookings made with credit wallet payment method

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
    booking_details->>'lastName' as last_name,
    booking_details->>'email' as email
FROM public.bookings
WHERE payment_method = 'credit'
ORDER BY booked_at DESC
LIMIT 20;

-- Check credit transactions (debit = money spent)
SELECT 
    id,
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    created_at
FROM public.credit_transactions
WHERE transaction_type = 'debit'
  AND description LIKE 'Noleggio%'
ORDER BY created_at DESC
LIMIT 20;

-- Verify the booking and transaction match
-- This should show bookings with their corresponding credit deductions
SELECT 
    b.id as booking_id,
    b.vehicle_name,
    b.price_total / 100 as price_euros,
    b.payment_status,
    b.booked_at,
    ct.amount as credit_deducted,
    ct.balance_after as remaining_balance,
    ct.created_at as transaction_time,
    ct.description
FROM public.bookings b
LEFT JOIN public.credit_transactions ct 
    ON ct.user_id = b.user_id 
    AND ct.description LIKE '%' || b.vehicle_name || '%'
    AND ct.transaction_type = 'debit'
    AND ABS(EXTRACT(EPOCH FROM (ct.created_at - b.booked_at))) < 10
WHERE b.payment_method = 'credit'
ORDER BY b.booked_at DESC
LIMIT 10;
