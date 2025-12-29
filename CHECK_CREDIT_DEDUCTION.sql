-- Check your current credit balance
SELECT user_id, balance, last_updated
FROM user_credit_balance
WHERE user_id = '3b896d05-3d65-4819-a46a-ea9894343935';

-- Check the most recent credit transaction
SELECT 
    id,
    transaction_type,
    amount,
    balance_after,
    description,
    created_at
FROM credit_transactions
WHERE user_id = '3b896d05-3d65-4819-a46a-ea9894343935'
ORDER BY created_at DESC
LIMIT 5;

-- Check the most recent booking
SELECT 
    id,
    vehicle_name,
    payment_method,
    payment_status,
    price_total,
    booked_at
FROM bookings
WHERE user_id = '3b896d05-3d65-4819-a46a-ea9894343935'
ORDER BY booked_at DESC
LIMIT 3;
