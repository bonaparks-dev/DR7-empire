-- Add residency_zone column to customers_extended table
-- This field captures whether a customer is a resident of Cagliari-Sud Sardegna
-- for pricing logic purposes

-- Add the column
ALTER TABLE public.customers_extended
ADD COLUMN IF NOT EXISTS residency_zone TEXT NOT NULL DEFAULT 'NON_RESIDENTE';

-- Add CHECK constraint to enforce allowed values
ALTER TABLE public.customers_extended
ADD CONSTRAINT residency_zone_check 
CHECK (residency_zone IN ('RESIDENTE_CAGLIARI_SUD_SARDEGNA', 'NON_RESIDENTE'));

-- Add comment for documentation
COMMENT ON COLUMN public.customers_extended.residency_zone IS 
'Customer residency zone for pricing logic. Values: RESIDENTE_CAGLIARI_SUD_SARDEGNA or NON_RESIDENTE';

-- RLS policies are already in place for customers_extended
-- Existing policies allow authenticated users to INSERT/UPDATE their own row via user_id
-- No additional RLS changes needed
