-- Populate dual pricing for DR7 vehicles
-- Migration: 20260118000000_populate_dual_pricing.sql
-- 
-- PRICING STRUCTURE:
-- SUPERCAR: €349 resident / €449 non-resident (dual pricing)
-- URBAN: €239 fixed (no dual pricing)
-- UTILITARIA: €39/day, €189/week (no dual pricing)
-- FURGONE: €139/day (no dual pricing)
--
-- All prices include: KASKO BASE, washing, unlimited KM, no hidden fees

-- ==============================
-- A) SUPERCARS — DUAL PRICING
-- ==============================
-- Resident pricing valid ONLY in Cagliari + Sud Sardegna
-- Outside area: use non-resident pricing or block

UPDATE vehicles SET 
  price_resident_daily = 349,
  price_nonresident_daily = 449
WHERE display_name IN (
  'Audi RS3 Rossa',
  'BMW M3 Competition',
  'BMW M4 Competition',
  'Mercedes C63S AMG',
  'Porsche Cayenne S Coupé',
  'Porsche Cayenne S Coupe'  -- Handle both spellings
);

-- ==============================
-- B) URBAN — FIXED PRICE
-- ==============================
-- Same price for residents and non-residents

UPDATE vehicles SET 
  price_resident_daily = 239,
  price_nonresident_daily = 239
WHERE category = 'urban-cars';

-- ==============================
-- C) UTILITARIA — FIXED PRICES
-- ==============================

-- Utilitarie: €39/day, €189/week
UPDATE vehicles SET 
  price_resident_daily = 39,
  price_nonresident_daily = 39
WHERE category = 'corporate-fleet' 
  AND display_name NOT LIKE '%Ducato%' 
  AND display_name NOT LIKE '%Furgone%'
  AND display_name NOT LIKE '%Vito%'
  AND display_name NOT LIKE '%V Class%'
  AND display_name NOT LIKE '%V-Class%'
  AND display_name NOT LIKE '%Classe V%';

-- Furgone Ducato: €139/day
UPDATE vehicles SET 
  price_resident_daily = 139,
  price_nonresident_daily = 139
WHERE category = 'corporate-fleet' 
  AND (
    display_name LIKE '%Ducato%' 
    OR display_name LIKE '%Furgone%'
  );

-- Vito/V-Class (if exists): €139/day (treating as furgone)
UPDATE vehicles SET 
  price_resident_daily = 139,
  price_nonresident_daily = 139
WHERE category = 'corporate-fleet' 
  AND (
    display_name LIKE '%Vito%'
    OR display_name LIKE '%V Class%'
    OR display_name LIKE '%V-Class%'
    OR display_name LIKE '%Classe V%'
  );

-- ==============================
-- VERIFICATION QUERY
-- ==============================
-- Uncomment to verify the updates:
-- SELECT 
--   display_name, 
--   category,
--   price_resident_daily,
--   price_nonresident_daily,
--   CASE 
--     WHEN price_resident_daily = price_nonresident_daily THEN 'FIXED'
--     ELSE 'DUAL'
--   END as pricing_type
-- FROM vehicles
-- ORDER BY category, display_name;
