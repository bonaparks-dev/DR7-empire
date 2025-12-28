-- CHECK LATEST TRANSACTIONS AND BOOKINGS
-- Find recent credit deductions and see if they link to bookings.

SELECT 
    t.id as transaction_id,
    t.user_id,
    t.amount,
    t.description,
    t.created_at as transaction_date,
    b.id as booking_id,
    b.status as booking_status,
    b.created_at as booking_date
FROM 
    user_credit_transactions t
LEFT JOIN 
    bookings b ON b.user_id = t.user_id 
    AND b.created_at > (t.created_at - interval '1 minute') 
    AND b.created_at < (t.created_at + interval '1 minute')
ORDER BY 
    t.created_at DESC
LIMIT 10;
