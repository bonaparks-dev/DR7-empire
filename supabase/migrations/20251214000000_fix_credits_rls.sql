-- Migration: Fix Credit Wallet RLS Policies
-- Description: Add missing INSERT and UPDATE policies for user_credit_balance and credit_transactions
-- Date: 2025-12-14

-- 1. Add policies for user_credit_balance
-- Allow users to INSERT (upsert) their own balance
DROP POLICY IF EXISTS "Users can insert own balance" ON user_credit_balance;
CREATE POLICY "Users can insert own balance" ON user_credit_balance
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own balance
DROP POLICY IF EXISTS "Users can update own balance" ON user_credit_balance;
CREATE POLICY "Users can update own balance" ON user_credit_balance
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Add policies for credit_transactions
-- Allow users to INSERT their own transactions
DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;
CREATE POLICY "Users can insert own transactions" ON credit_transactions
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 3. Verify policies (Select to confirm)
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('user_credit_balance', 'credit_transactions') 
ORDER BY tablename, cmd;
