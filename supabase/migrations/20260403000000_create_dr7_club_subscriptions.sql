-- DR7 Club Subscriptions
-- Tracks club membership (monthly €4.90 / annual €39)
-- Used by website to check active status and calculate reward tiers

CREATE TABLE IF NOT EXISTS dr7_club_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('monthly', 'annual')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  price numeric(10,2) NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  payment_reference text,
  nexi_order_id text,
  nexi_contract_id text, -- Nexi recurring token for MIT renewals
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup of active subscriptions
CREATE INDEX IF NOT EXISTS idx_dr7_club_user_status ON dr7_club_subscriptions (user_id, status, expires_at);

-- RLS
ALTER TABLE dr7_club_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own club subscriptions"
  ON dr7_club_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access dr7_club"
  ON dr7_club_subscriptions FOR ALL TO service_role
  USING (true);

-- Anon can't access subscriptions
