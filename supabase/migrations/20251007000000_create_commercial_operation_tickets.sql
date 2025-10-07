-- Create commercial_operation_tickets table
CREATE TABLE IF NOT EXISTS commercial_operation_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uuid TEXT NOT NULL UNIQUE,
  ticket_number INTEGER NOT NULL,

  -- User information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,

  -- Payment information
  payment_intent_id TEXT NOT NULL,
  amount_paid INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'eur',

  -- Purchase details
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quantity INTEGER NOT NULL, -- number of tickets in this purchase

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_commercial_tickets_email ON commercial_operation_tickets(email);
CREATE INDEX IF NOT EXISTS idx_commercial_tickets_user_id ON commercial_operation_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_commercial_tickets_payment_intent ON commercial_operation_tickets(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_commercial_tickets_purchase_date ON commercial_operation_tickets(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_commercial_tickets_uuid ON commercial_operation_tickets(uuid);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_commercial_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER commercial_tickets_updated_at
  BEFORE UPDATE ON commercial_operation_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_commercial_tickets_updated_at();

-- Add RLS policies
ALTER TABLE commercial_operation_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
  ON commercial_operation_tickets
  FOR SELECT
  USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Service role can do everything
CREATE POLICY "Service role has full access"
  ON commercial_operation_tickets
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Comment on table
COMMENT ON TABLE commercial_operation_tickets IS 'Stores all commercial operation ticket purchases';
