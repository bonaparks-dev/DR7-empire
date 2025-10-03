-- Gift Card System for Commercial Operation
-- Active from December 26, 2025
-- €25 gift cards with 24-month validity
-- NON-CUMULATIVE (only 1 per transaction)

-- Create gift_cards table
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,

  -- Value and status
  initial_value INTEGER NOT NULL DEFAULT 2500, -- €25 in cents
  remaining_value INTEGER NOT NULL DEFAULT 2500,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'active', -- active, redeemed, expired, cancelled

  -- Origin tracking
  issued_with_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Redemption tracking
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_in_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,

  -- Recipient information
  recipient_name TEXT,
  recipient_email TEXT,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_values CHECK (initial_value > 0 AND remaining_value >= 0 AND remaining_value <= initial_value),
  CONSTRAINT valid_status CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  CONSTRAINT valid_expiry CHECK (expires_at > issued_at)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON public.gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_expires_at ON public.gift_cards(expires_at);
CREATE INDEX IF NOT EXISTS idx_gift_cards_issued_booking ON public.gift_cards(issued_with_booking_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_redeemed_booking ON public.gift_cards(redeemed_in_booking_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient_email ON public.gift_cards(recipient_email);

-- Enable Row Level Security
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can validate a gift card by code (needed for checkout)
CREATE POLICY "Anyone can validate gift cards" ON public.gift_cards
  FOR SELECT
  USING (true);

-- Service accounts (backend) can insert gift cards
CREATE POLICY "Service accounts can create gift cards" ON public.gift_cards
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Service accounts can update gift cards (for redemption)
CREATE POLICY "Service accounts can update gift cards" ON public.gift_cards
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Admin can delete gift cards
CREATE POLICY "Admin can delete gift cards" ON public.gift_cards
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Add comments
COMMENT ON TABLE public.gift_cards IS 'Gift cards issued with commercial operation ticket purchases (€25 value, 24-month validity, non-cumulative)';
COMMENT ON COLUMN public.gift_cards.code IS 'Unique 12-character gift card code (format: GIFT-XXXXXXXX)';
COMMENT ON COLUMN public.gift_cards.initial_value IS 'Initial value in cents (always 2500 = €25)';
COMMENT ON COLUMN public.gift_cards.remaining_value IS 'Remaining value in cents after redemption';
COMMENT ON COLUMN public.gift_cards.status IS 'Status: active, redeemed, expired, cancelled';
COMMENT ON COLUMN public.gift_cards.issued_with_booking_id IS 'Commercial operation booking that generated this gift card';
COMMENT ON COLUMN public.gift_cards.expires_at IS 'Expiration date (24 months from issue date)';
COMMENT ON COLUMN public.gift_cards.redeemed_in_booking_id IS 'Booking where gift card was redeemed';

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gift_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on every update
DROP TRIGGER IF EXISTS gift_cards_updated_at_trigger ON public.gift_cards;
CREATE TRIGGER gift_cards_updated_at_trigger
  BEFORE UPDATE ON public.gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_cards_updated_at();

-- Function to expire gift cards (can be run periodically)
CREATE OR REPLACE FUNCTION expire_gift_cards()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.gift_cards
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_gift_cards IS 'Marks expired active gift cards as expired. Returns count of expired cards.';
