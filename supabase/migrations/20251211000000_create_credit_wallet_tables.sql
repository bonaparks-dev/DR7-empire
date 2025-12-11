-- Credit Wallet System Tables Migration
-- Run this FIRST in Supabase SQL Editor to create the necessary tables

-- 1. Create user_credit_balance table
CREATE TABLE IF NOT EXISTS user_credit_balance (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  amount NUMERIC(10, 2) NOT NULL,
  balance_after NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create credit_wallet_purchases table
CREATE TABLE IF NOT EXISTS credit_wallet_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  package_series TEXT NOT NULL,
  recharge_amount NUMERIC(10, 2) NOT NULL,
  received_amount NUMERIC(10, 2) NOT NULL,
  bonus_amount NUMERIC(10, 2) NOT NULL,
  bonus_percentage NUMERIC(5, 2) NOT NULL,
  payment_intent_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  currency TEXT NOT NULL DEFAULT 'EUR',
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_codice_fiscale TEXT,
  customer_indirizzo TEXT,
  customer_numero_civico TEXT,
  customer_citta TEXT,
  customer_cap TEXT,
  customer_provincia TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_wallet_purchases_user_id ON credit_wallet_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_wallet_purchases_created_at ON credit_wallet_purchases(created_at DESC);

-- 5. Enable Row Level Security
ALTER TABLE user_credit_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_wallet_purchases ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own balance" ON user_credit_balance;
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can view own purchases" ON credit_wallet_purchases;
DROP POLICY IF EXISTS "Service role full access balance" ON user_credit_balance;
DROP POLICY IF EXISTS "Service role full access transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Service role full access purchases" ON credit_wallet_purchases;

-- User can view their own balance
CREATE POLICY "Users can view own balance" ON user_credit_balance
  FOR SELECT USING (auth.uid() = user_id);

-- User can view their own transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- User can view their own purchases
CREATE POLICY "Users can view own purchases" ON credit_wallet_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role full access balance" ON user_credit_balance
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access transactions" ON credit_transactions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access purchases" ON credit_wallet_purchases
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Grant necessary permissions
GRANT ALL ON user_credit_balance TO authenticated;
GRANT ALL ON credit_transactions TO authenticated;
GRANT ALL ON credit_wallet_purchases TO authenticated;
GRANT ALL ON user_credit_balance TO service_role;
GRANT ALL ON credit_transactions TO service_role;
GRANT ALL ON credit_wallet_purchases TO service_role;
