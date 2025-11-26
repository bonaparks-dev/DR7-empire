-- Script to check and fix ticket number issues
-- Run this in your Supabase SQL editor

-- 1. Check for tickets with invalid numbers (outside 1-2000)
SELECT
    id,
    uuid,
    ticket_number,
    email,
    full_name,
    purchase_date
FROM commercial_operation_tickets
WHERE ticket_number < 1 OR ticket_number > 2000
ORDER BY purchase_date DESC;

-- 2. Check for duplicate ticket numbers (should not exist after migration)
SELECT
    ticket_number,
    COUNT(*) as count,
    array_agg(email) as emails
FROM commercial_operation_tickets
GROUP BY ticket_number
HAVING COUNT(*) > 1;

-- 3. See how many tickets have been sold
SELECT
    COUNT(*) as total_tickets_sold,
    COUNT(DISTINCT ticket_number) as unique_ticket_numbers,
    MIN(ticket_number) as lowest_number,
    MAX(ticket_number) as highest_number,
    2000 - COUNT(DISTINCT ticket_number) as tickets_remaining
FROM commercial_operation_tickets;

-- 4. If you need to reassign tickets with invalid numbers (DO THIS CAREFULLY):
-- First, identify the tickets that need to be reassigned
-- Then contact those customers to inform them of the new ticket numbers

-- Example: Find available ticket numbers
WITH assigned_numbers AS (
    SELECT ticket_number
    FROM commercial_operation_tickets
    WHERE ticket_number BETWEEN 1 AND 2000
),
all_numbers AS (
    SELECT generate_series(1, 2000) as num
)
SELECT num as available_ticket_number
FROM all_numbers
WHERE num NOT IN (SELECT ticket_number FROM assigned_numbers)
ORDER BY num
LIMIT 100;
