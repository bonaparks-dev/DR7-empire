-- Check if the book_with_credits RPC function exists in the database
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_name = 'book_with_credits'
  AND routine_schema = 'public';

-- If the above returns empty, the RPC function is missing and needs to be re-deployed!
-- Run the migration file: supabase/migrations/20251229000000_atomic_credit_booking.sql
