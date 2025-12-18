-- Fix RLS policies for user_credit_balance to allow INSERT and UPDATE
-- The 406 error occurs because users can only SELECT but the code tries to UPSERT/UPDATE

-- Add policy to allow users to insert their own balance record
DROP POLICY IF EXISTS "Users can insert own balance" ON user_credit_balance;
CREATE POLICY "Users can insert own balance" ON user_credit_balance
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add policy to allow users to update their own balance
DROP POLICY IF EXISTS "Users can update own balance" ON user_credit_balance;
CREATE POLICY "Users can update own balance" ON user_credit_balance
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Do the same for credit_transactions table
DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;
CREATE POLICY "Users can insert own transactions" ON credit_transactions
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('user_credit_balance', 'credit_transactions')
ORDER BY tablename, policyname;
