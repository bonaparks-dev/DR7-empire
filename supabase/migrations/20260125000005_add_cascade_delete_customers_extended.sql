-- Clean orphaned data and add CASCADE delete constraints
-- Step 1: Delete orphaned records in customers_extended

DELETE FROM public.customers_extended
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 2: Add CASCADE delete constraint to customers_extended
ALTER TABLE public.customers_extended 
DROP CONSTRAINT IF EXISTS customers_extended_user_id_fkey;

ALTER TABLE public.customers_extended 
ADD CONSTRAINT customers_extended_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Step 3: Add CASCADE to credit_transactions
ALTER TABLE public.credit_transactions 
DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;

ALTER TABLE public.credit_transactions 
ADD CONSTRAINT credit_transactions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Step 4: Add CASCADE to membership_purchases
ALTER TABLE public.membership_purchases 
DROP CONSTRAINT IF EXISTS membership_purchases_user_id_fkey;

ALTER TABLE public.membership_purchases 
ADD CONSTRAINT membership_purchases_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- NOTE: Skipping bookings table because userId is TEXT, not UUID
-- Bookings will need to be deleted manually in the delete_user function

-- Verify constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('customers_extended', 'credit_transactions', 'membership_purchases')
ORDER BY tc.table_name;
