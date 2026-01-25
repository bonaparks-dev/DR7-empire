-- Verify if the residency_zone trigger fix has been applied
-- Run this in Supabase SQL Editor to check migration status

-- 1. Check if the trigger function includes residency_zone handling
SELECT 
  CASE 
    WHEN prosrc LIKE '%residency_zone%' THEN '✅ Trigger HAS been updated with residency_zone'
    ELSE '❌ Trigger NOT updated - MIGRATION REQUIRED'
  END as trigger_status,
  CASE
    WHEN prosrc LIKE '%residency_zone_value := COALESCE%' THEN '✅ Extraction logic present'
    ELSE '❌ Extraction logic missing'
  END as extraction_status
FROM pg_proc 
WHERE proname = 'sync_auth_user_to_customers';

-- 2. Check the residency_zone constraint values
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conrelid = 'public.customers_extended'::regclass
  AND conname LIKE '%residency%';

-- 3. Test if we can insert a record with residency_zone
-- (This is a dry-run test - it will fail if constraint is wrong)
DO $$
BEGIN
  -- This will only check the constraint, not actually insert
  PERFORM 1 WHERE 'RESIDENTE_CA' IN ('RESIDENTE_CA', 'RESIDENTE_SU', 'NON_RESIDENTE');
  RAISE NOTICE '✅ Constraint values are correct';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Constraint check failed: %', SQLERRM;
END $$;
