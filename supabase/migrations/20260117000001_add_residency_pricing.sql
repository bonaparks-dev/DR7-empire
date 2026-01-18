-- Add residency-based pricing to vehicles table
-- Migration: 20260117000001_add_residency_pricing.sql
-- This adds dual pricing (resident vs non-resident) and usage zone tracking

-- Add resident and non-resident pricing columns to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS price_resident_daily NUMERIC CHECK (price_resident_daily >= 0),
ADD COLUMN IF NOT EXISTS price_nonresident_daily NUMERIC CHECK (price_nonresident_daily >= 0);

-- Add usage zone column to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS booking_usage_zone TEXT CHECK (booking_usage_zone IN ('CAGLIARI_SUD', 'FUORI_ZONA'));

-- Add comments for documentation
COMMENT ON COLUMN public.vehicles.price_resident_daily IS 
'Daily rate for Cagliari-Sud Sardegna residents (RESIDENTE_CAGLIARI_SUD_SARDEGNA)';

COMMENT ON COLUMN public.vehicles.price_nonresident_daily IS 
'Daily rate for non-residents (NON_RESIDENTE or null residency_zone)';

COMMENT ON COLUMN public.bookings.booking_usage_zone IS 
'Usage zone selected during booking: CAGLIARI_SUD (authorized for residents) or FUORI_ZONA (not allowed for residents with resident pricing)';

-- Note: Existing vehicles will need manual data population
-- Example update query:
-- UPDATE vehicles SET 
--   price_resident_daily = daily_rate * 0.8,  -- 20% discount for residents
--   price_nonresident_daily = daily_rate 
-- WHERE price_resident_daily IS NULL;
