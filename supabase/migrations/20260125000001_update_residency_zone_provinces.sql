-- FIXED (FINAL): Update residency_zone constraint
-- Reason: Original constraint was named 'residency_zone_check', not 'customers_extended_residency_zone_check'

-- 1. Drop ALL potential old constraints first
ALTER TABLE public.customers_extended
DROP CONSTRAINT IF EXISTS residency_zone_check; -- The actual original name

ALTER TABLE public.customers_extended
DROP CONSTRAINT IF EXISTS customers_extended_residency_zone_check; -- The name we tried to use before

-- 2. Migrate existing data to valid values (if any exist)
UPDATE public.customers_extended
SET residency_zone = 'RESIDENTE_CA'
WHERE residency_zone = 'RESIDENTE_CAGLIARI_SUD_SARDEGNA';

-- Safety: Fix any NULLs or invalid values to 'NON_RESIDENTE'
UPDATE public.customers_extended
SET residency_zone = 'NON_RESIDENTE'
WHERE residency_zone IS NULL 
   OR residency_zone NOT IN ('RESIDENTE_CA', 'RESIDENTE_SU', 'NON_RESIDENTE');

-- 3. Add new valid constraint with a standard name
ALTER TABLE public.customers_extended
ADD CONSTRAINT customers_extended_residency_zone_check
CHECK (residency_zone IN ('RESIDENTE_CA', 'RESIDENTE_SU', 'NON_RESIDENTE'));

-- 4. Update comment
COMMENT ON COLUMN public.customers_extended.residency_zone IS
'Customer residency zone for pricing logic. Values: RESIDENTE_CA (Cagliari), RESIDENTE_SU (Sud Sardegna: Carbonia-Iglesias, Medio Campidano, Ogliastra), or NON_RESIDENTE';
