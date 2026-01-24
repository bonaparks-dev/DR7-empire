-- Add notifications JSONB column to customers_extended table
-- This field tracks user preferences for various communication types including marketing consent

ALTER TABLE public.customers_extended
ADD COLUMN IF NOT EXISTS notifications JSONB DEFAULT '{"bookingConfirmations": true, "specialOffers": false, "newsletter": false, "marketingConsent": false}'::jsonb;

-- Add a comment to document the field structure
COMMENT ON COLUMN customers_extended.notifications IS 'JSONB object containing notification preferences: {bookingConfirmations: boolean, specialOffers: boolean, newsletter: boolean, marketingConsent: boolean}';

-- Create an index for faster queries on marketing consent
-- This allows efficient filtering of users who have consented to marketing
CREATE INDEX IF NOT EXISTS idx_customers_extended_marketing_consent 
ON customers_extended ((notifications->>'marketingConsent'));
