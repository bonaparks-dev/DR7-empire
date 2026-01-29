-- Create membership_purchases table
CREATE TABLE IF NOT EXISTS membership_purchases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_id text NOT NULL,
    tier_name text NOT NULL,
    billing_cycle text NOT NULL,
    price numeric NOT NULL,
    currency text NOT NULL DEFAULT 'EUR',
    payment_method text NOT NULL DEFAULT 'nexi',
    payment_status text NOT NULL DEFAULT 'pending',
    renewal_date timestamp with time zone,
    nexi_order_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_membership_purchases_user_id ON membership_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_purchases_nexi_order_id ON membership_purchases(nexi_order_id);
CREATE INDEX IF NOT EXISTS idx_membership_purchases_payment_status ON membership_purchases(payment_status);

-- Enable Row Level Security
ALTER TABLE membership_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own purchases
CREATE POLICY "Users can insert their own membership purchases"
    ON membership_purchases
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own purchases
CREATE POLICY "Users can view their own membership purchases"
    ON membership_purchases
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Users can update their own purchases
CREATE POLICY "Users can update their own membership purchases"
    ON membership_purchases
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can do everything (for webhooks/backend)
CREATE POLICY "Service role has full access to membership purchases"
    ON membership_purchases
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_membership_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_membership_purchases_updated_at ON membership_purchases;
CREATE TRIGGER trigger_membership_purchases_updated_at
    BEFORE UPDATE ON membership_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_membership_purchases_updated_at();
