-- Add insurance tracking columns to bookings table
-- These columns store the automatically applied KASKO BASE insurance details

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS insurance_type TEXT CHECK (insurance_type = 'KASKO_BASE'),
ADD COLUMN IF NOT EXISTS deductible_fixed NUMERIC CHECK (deductible_fixed >= 0),
ADD COLUMN IF NOT EXISTS deductible_percent NUMERIC CHECK (deductible_percent >= 0 AND deductible_percent <= 100);

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.insurance_type IS 'Insurance type - always KASKO_BASE for website bookings';
COMMENT ON COLUMN public.bookings.deductible_fixed IS 'Fixed deductible amount in EUR (2000 for URBAN/UTILITARIA, 5000 for SUPERCAR)';
COMMENT ON COLUMN public.bookings.deductible_percent IS 'Percentage deductible (always 30%)';
