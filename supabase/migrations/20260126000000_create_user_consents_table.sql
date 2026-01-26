-- GDPR-compliant user consents tracking table
-- This table serves as legal proof of consent for marketing and other purposes

CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL, -- e.g., 'marketing_partner', 'marketing_dr7', 'newsletter'
    consent_text TEXT NOT NULL, -- Exact text of the consent accepted
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(45), -- IPv4 or IPv6
    source VARCHAR(20) NOT NULL DEFAULT 'web', -- 'web' or 'app'
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' or 'revoked'
    revoked_at TIMESTAMPTZ,
    user_agent TEXT, -- Browser/device info for additional proof
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_type ON public.user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_status ON public.user_consents(status);
CREATE INDEX IF NOT EXISTS idx_user_consents_accepted_at ON public.user_consents(accepted_at);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Users can view their own consents
CREATE POLICY "Users can view own consents" ON public.user_consents
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own consents
CREATE POLICY "Users can insert own consents" ON public.user_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own consents (for revocation)
CREATE POLICY "Users can update own consents" ON public.user_consents
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can do everything (for admin/backend operations)
CREATE POLICY "Service role full access" ON public.user_consents
    FOR ALL USING (auth.role() = 'service_role');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_consents_updated_at
    BEFORE UPDATE ON public.user_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_user_consents_updated_at();

-- Add comment to document the table
COMMENT ON TABLE public.user_consents IS 'GDPR-compliant consent tracking table. Stores legal proof of each consent given by users.';
