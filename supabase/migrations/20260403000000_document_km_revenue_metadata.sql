-- Document the expected metadata fields for km revenue management
-- These fields are written by Rentora (admin panel) and read by the public website
--
-- vehicles.metadata JSONB fields for km configuration:
--   daily_km_limit (numeric)        - e.g. 50: km included per day in the base rental rate
--   unlimited_km_surcharge (numeric) - daily surcharge in EUR for the unlimited km option
--   km_limit_label (text)           - optional custom label (e.g. "100 km al giorno")
--
-- Usage:
--   The public website reads these fields to:
--   1. Display the correct daily km limit (instead of hardcoded "50 km")
--   2. Calculate the unlimited km surcharge dynamically
--   3. Ensure km limitati are always included in the base rate (no surcharge)
--
-- If these fields are not set, the website falls back to:
--   daily_km_limit: 50 (default)
--   unlimited_km_surcharge: calculated from kmPricingData.ts tables
--   km_limit_label: auto-generated from daily_km_limit value
--
-- This migration is documentation-only. No schema changes needed since
-- vehicles.metadata is already a JSONB column that accepts any keys.

-- Verify the metadata column exists (no-op if already present)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.vehicles ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add a comment documenting the expected metadata structure
COMMENT ON COLUMN public.vehicles.metadata IS 'JSONB metadata including revenue management fields: daily_km_limit (int), unlimited_km_surcharge (numeric), km_limit_label (text), image (text), unavailable_from/until (date), booking_disabled (bool)';
