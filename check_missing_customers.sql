-- Check if lottery customers exist in customers_extended
SELECT email, id, nome, cognome 
FROM customers_extended 
WHERE email IN ('andrea.caria@dcrsrls.it', 'desmokelu@gmail.com');

-- Check if they have uploads in storage buckets (metadata table usually tracks this if exists, or we check via storage API, but here we check database first)
-- We can check if they have a user_id in commercial_operation_tickets
SELECT email, user_id, ticket_number, customer_data
FROM commercial_operation_tickets
WHERE email IN ('andrea.caria@dcrsrls.it', 'desmokelu@gmail.com');
