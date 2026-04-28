-- Clean up the literal "— null" suffix that was leaking into
-- credit_transactions.description for rental refunds (rentals carry the car
-- under vehicle_name, NOT service_name; the previous code referenced
-- service_name without a fallback so the JS template literal stamped the
-- string "null" into the row).
--
-- The frontend has been patched to use a fallback chain so new rows are
-- clean. This statement repairs the historical rows so the customer's
-- "Ultime Transazioni" list stops showing entries like "Rimborso DR7 Flex
-- (90%) — null".

UPDATE public.credit_transactions
   SET description = regexp_replace(description, '\s*—\s*null\s*$', '')
 WHERE description LIKE '%— null%' OR description LIKE '%-- null%';
