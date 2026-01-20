-- =====================================================
-- VERIFY AND INSERT URBAN VEHICLES
-- =====================================================
-- This script checks if urban vehicles exist and inserts them if missing
-- Includes dual pricing for resident/non-resident users

-- Step 1: Check current state
DO $$
BEGIN
  RAISE NOTICE '=== CURRENT URBAN VEHICLES ===';
END $$;

SELECT 
  COUNT(*) as total_urban_vehicles,
  COUNT(*) FILTER (WHERE status = 'available') as available_count,
  COUNT(*) FILTER (WHERE status != 'retired') as active_count
FROM vehicles 
WHERE category = 'urban';

-- Step 2: Show existing urban vehicles (if any)
SELECT 
  id,
  display_name,
  plate,
  status,
  daily_rate,
  price_resident_daily,
  price_nonresident_daily,
  metadata->>'display_group' as display_group
FROM vehicles
WHERE category = 'urban' AND status != 'retired'
ORDER BY display_name, plate;

-- Step 3: Insert urban vehicles with dual pricing
-- Using ON CONFLICT to avoid duplicates

-- Fiat Panda Benzina Bianca (2 vehicles)
INSERT INTO vehicles (display_name, plate, status, daily_rate, price_resident_daily, price_nonresident_daily, category, metadata)
VALUES
  ('Fiat Panda Benzina (Bianca)', 'PANDA_BIANCA_1', 'available', 29.90, 29.90, 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Bianca", "image": "/panda2.jpeg", "display_group": "fiat-panda-bianca", "specs": {"power": "70Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb),
  ('Fiat Panda Benzina (Bianca)', 'PANDA_BIANCA_2', 'available', 29.90, 29.90, 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Bianca", "image": "/panda2.jpeg", "display_group": "fiat-panda-bianca", "specs": {"power": "70Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb)
ON CONFLICT (display_name, plate) DO UPDATE SET
  status = EXCLUDED.status,
  daily_rate = EXCLUDED.daily_rate,
  price_resident_daily = EXCLUDED.price_resident_daily,
  price_nonresident_daily = EXCLUDED.price_nonresident_daily,
  category = EXCLUDED.category,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Renault Clio 4 Arancione (2 vehicles)
INSERT INTO vehicles (display_name, plate, status, daily_rate, price_resident_daily, price_nonresident_daily, category, metadata)
VALUES
  ('Renault Clio 4 (Arancione)', 'CLIO_ARANCIONE_1', 'available', 29.90, 29.90, 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Arancione", "image": "/clio4a.jpeg", "display_group": "clio-4-arancione", "specs": {"power": "90Cv", "seats": "5 posti", "engine": "1.5L Diesel"}}'::jsonb),
  ('Renault Clio 4 (Arancione)', 'CLIO_ARANCIONE_2', 'available', 29.90, 29.90, 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Arancione", "image": "/clio4a.jpeg", "display_group": "clio-4-arancione", "specs": {"power": "90Cv", "seats": "5 posti", "engine": "1.5L Diesel"}}'::jsonb)
ON CONFLICT (display_name, plate) DO UPDATE SET
  status = EXCLUDED.status,
  daily_rate = EXCLUDED.daily_rate,
  price_resident_daily = EXCLUDED.price_resident_daily,
  price_nonresident_daily = EXCLUDED.price_nonresident_daily,
  category = EXCLUDED.category,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Renault Clio 4 Blu (2 vehicles)
INSERT INTO vehicles (display_name, plate, status, daily_rate, price_resident_daily, price_nonresident_daily, category, metadata)
VALUES
  ('Renault Clio 4 (Blu)', 'CLIO_BLU_1', 'available', 29.90, 29.90, 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Blu", "image": "/clio4b.jpeg", "display_group": "clio-4-blu", "specs": {"power": "90Cv", "seats": "5 posti", "engine": "1.5L Diesel"}}'::jsonb),
  ('Renault Clio 4 (Blu)', 'CLIO_BLU_2', 'available', 29.90, 29.90, 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Blu", "image": "/clio4b.jpeg", "display_group": "clio-4-blu", "specs": {"power": "90Cv", "seats": "5 posti", "engine": "1.5L Diesel"}}'::jsonb)
ON CONFLICT (display_name, plate) DO UPDATE SET
  status = EXCLUDED.status,
  daily_rate = EXCLUDED.daily_rate,
  price_resident_daily = EXCLUDED.price_resident_daily,
  price_nonresident_daily = EXCLUDED.price_nonresident_daily,
  category = EXCLUDED.category,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Peugeot 208 Bianca (2 vehicles)
INSERT INTO vehicles (display_name, plate, status, daily_rate, price_resident_daily, price_nonresident_daily, category, metadata)
VALUES
  ('Peugeot 208 (Bianca)', '208_BIANCA_1', 'available', 29.90, 29.90, 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Bianca", "image": "/208.jpeg", "display_group": "peugeot-208-bianca", "specs": {"power": "75Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb),
  ('Peugeot 208 (Bianca)', '208_BIANCA_2', 'available', 29.90, 29.90, 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Bianca", "image": "/208.jpeg", "display_group": "peugeot-208-bianca", "specs": {"power": "75Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb)
ON CONFLICT (display_name, plate) DO UPDATE SET
  status = EXCLUDED.status,
  daily_rate = EXCLUDED.daily_rate,
  price_resident_daily = EXCLUDED.price_resident_daily,
  price_nonresident_daily = EXCLUDED.price_nonresident_daily,
  category = EXCLUDED.category,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Citroën C3 Nera (2 vehicles)
INSERT INTO vehicles (display_name, plate, status, daily_rate, price_resident_daily, price_nonresident_daily, category, metadata)
VALUES
  ('Citroën C3 (Nera)', 'C3_NERA_1', 'available', 29.90, 29.90, 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Nera", "image": "/c3.jpeg", "display_group": "citroen-c3-nera", "specs": {"power": "82Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb),
  ('Citroën C3 (Nera)', 'C3_NERA_2', 'available', 29.90, 29.90, 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Nera", "image": "/c3.jpeg", "display_group": "citroen-c3-nera", "specs": {"power": "82Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb)
ON CONFLICT (display_name, plate) DO UPDATE SET
  status = EXCLUDED.status,
  daily_rate = EXCLUDED.daily_rate,
  price_resident_daily = EXCLUDED.price_resident_daily,
  price_nonresident_daily = EXCLUDED.price_nonresident_daily,
  category = EXCLUDED.category,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Step 4: Verify insertion
DO $$
BEGIN
  RAISE NOTICE '=== VERIFICATION AFTER INSERT ===';
END $$;

SELECT 
  COUNT(*) as total_urban_vehicles,
  COUNT(*) FILTER (WHERE status = 'available') as available_count,
  COUNT(DISTINCT metadata->>'display_group') as unique_groups
FROM vehicles 
WHERE category = 'urban' AND status != 'retired';

-- Step 5: Show all urban vehicles grouped
SELECT 
  metadata->>'display_group' as display_group,
  display_name,
  COUNT(*) as vehicle_count,
  STRING_AGG(plate, ', ' ORDER BY plate) as plates,
  MAX(price_resident_daily) as resident_price,
  MAX(price_nonresident_daily) as nonresident_price,
  MAX(status) as status
FROM vehicles
WHERE category = 'urban' AND status != 'retired'
GROUP BY metadata->>'display_group', display_name
ORDER BY display_name;

-- Step 6: Final summary
SELECT 
  'URBAN VEHICLES READY' as status,
  COUNT(*) as total_vehicles,
  COUNT(DISTINCT metadata->>'display_group') as display_groups,
  STRING_AGG(DISTINCT metadata->>'display_group', ', ' ORDER BY metadata->>'display_group') as groups
FROM vehicles
WHERE category = 'urban' AND status != 'retired';
