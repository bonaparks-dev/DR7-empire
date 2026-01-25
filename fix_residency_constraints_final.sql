-- Diagnostic: List all constraints on customers_extended
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conrelid = 'public.customers_extended'::regclass;

-- FIX: Bruteforce drop ALL possible residency constraints
ALTER TABLE public.customers_extended DROP CONSTRAINT IF EXISTS residency_zone_check;
ALTER TABLE public.customers_extended DROP CONSTRAINT IF EXISTS customers_extended_residency_zone_check;

-- Add back the CORRECT constraint
ALTER TABLE public.customers_extended
ADD CONSTRAINT customers_extended_residency_zone_check
CHECK (residency_zone IN ('RESIDENTE_CA', 'RESIDENTE_SU', 'NON_RESIDENTE'));
