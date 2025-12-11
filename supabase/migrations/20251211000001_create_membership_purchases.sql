-- Create membership_purchases table to track all membership purchases
CREATE TABLE IF NOT EXISTS membership_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL,
  tier_name TEXT NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annually')),
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'crypto', 'credit')),
  payment_intent_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'completed',
  renewal_date TIMESTAMPTZ NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_membership_purchases_user_id ON membership_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_purchases_created_at ON membership_purchases(created_at DESC);

-- Enable RLS
ALTER TABLE membership_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own membership purchases" ON membership_purchases;
DROP POLICY IF EXISTS "Service role full access membership purchases" ON membership_purchases;

CREATE POLICY "Users can view own membership purchases" ON membership_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access membership purchases" ON membership_purchases
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT ALL ON membership_purchases TO authenticated;
GRANT ALL ON membership_purchases TO service_role;
