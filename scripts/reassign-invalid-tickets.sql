-- Script to reassign tickets with invalid numbers (>2000) to available numbers in 1-2000 range
-- RUN THIS IN SUPABASE SQL EDITOR

-- STEP 1: See what we're dealing with
SELECT
    COUNT(*) as total_invalid_tickets,
    array_agg(DISTINCT email) as affected_customers
FROM commercial_operation_tickets
WHERE ticket_number > 2000;

-- STEP 2: Get list of available numbers in 1-2000 range
WITH assigned_valid_numbers AS (
    SELECT ticket_number
    FROM commercial_operation_tickets
    WHERE ticket_number BETWEEN 1 AND 2000
),
all_numbers AS (
    SELECT generate_series(1, 2000) as num
),
available_numbers AS (
    SELECT num
    FROM all_numbers
    WHERE num NOT IN (SELECT ticket_number FROM assigned_valid_numbers)
    ORDER BY num
)
SELECT
    COUNT(*) as available_tickets_count,
    MIN(num) as lowest_available,
    MAX(num) as highest_available
FROM available_numbers;

-- STEP 3: Preview the reassignment (DOESN'T CHANGE DATA YET)
WITH invalid_tickets AS (
    SELECT
        id,
        uuid,
        ticket_number as old_ticket_number,
        email,
        full_name,
        purchase_date,
        ROW_NUMBER() OVER (ORDER BY purchase_date ASC) as rn
    FROM commercial_operation_tickets
    WHERE ticket_number > 2000
),
assigned_valid_numbers AS (
    SELECT ticket_number
    FROM commercial_operation_tickets
    WHERE ticket_number BETWEEN 1 AND 2000
),
all_numbers AS (
    SELECT generate_series(1, 2000) as num
),
available_numbers AS (
    SELECT
        num,
        ROW_NUMBER() OVER (ORDER BY num) as rn
    FROM all_numbers
    WHERE num NOT IN (SELECT ticket_number FROM assigned_valid_numbers)
)
SELECT
    it.id,
    it.uuid,
    it.old_ticket_number,
    an.num as new_ticket_number,
    it.email,
    it.full_name,
    it.purchase_date
FROM invalid_tickets it
JOIN available_numbers an ON it.rn = an.rn
ORDER BY it.purchase_date ASC;

-- STEP 4: ACTUALLY DO THE REASSIGNMENT (⚠️ THIS CHANGES DATA!)
-- Only run this after reviewing STEP 3 output
-- UNCOMMENT THE LINES BELOW TO EXECUTE:

/*
WITH invalid_tickets AS (
    SELECT
        id,
        ticket_number as old_ticket_number,
        ROW_NUMBER() OVER (ORDER BY purchase_date ASC) as rn
    FROM commercial_operation_tickets
    WHERE ticket_number > 2000
),
assigned_valid_numbers AS (
    SELECT ticket_number
    FROM commercial_operation_tickets
    WHERE ticket_number BETWEEN 1 AND 2000
),
all_numbers AS (
    SELECT generate_series(1, 2000) as num
),
available_numbers AS (
    SELECT
        num,
        ROW_NUMBER() OVER (ORDER BY num) as rn
    FROM all_numbers
    WHERE num NOT IN (SELECT ticket_number FROM assigned_valid_numbers)
),
reassignment AS (
    SELECT
        it.id,
        it.old_ticket_number,
        an.num as new_ticket_number
    FROM invalid_tickets it
    JOIN available_numbers an ON it.rn = an.rn
)
UPDATE commercial_operation_tickets cot
SET ticket_number = r.new_ticket_number
FROM reassignment r
WHERE cot.id = r.id;

-- Show what was changed
SELECT
    COUNT(*) as tickets_reassigned,
    MIN(ticket_number) as lowest_new_number,
    MAX(ticket_number) as highest_new_number
FROM commercial_operation_tickets
WHERE id IN (
    SELECT id FROM commercial_operation_tickets
    WHERE ticket_number BETWEEN 1 AND 2000
);
*/

-- STEP 5: After reassignment, get list of affected customers to notify
-- Run this AFTER step 4
SELECT DISTINCT
    email,
    full_name,
    COUNT(*) as number_of_tickets
FROM commercial_operation_tickets
WHERE email IN (
    -- Get emails that had invalid tickets
    SELECT DISTINCT email
    FROM commercial_operation_tickets
    WHERE ticket_number <= 2000  -- Now they're valid
    AND purchase_date < NOW() - INTERVAL '1 minute'  -- Not brand new purchases
)
GROUP BY email, full_name
ORDER BY purchase_date DESC;
