-- Add urban vehicles (duplicate models with different plates)
-- Note: Replace 'TARGA1', 'TARGA2', etc. with actual license plates

-- 1. Fiat Panda Benzina Bianca (2x)
INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata)
VALUES
  ('Fiat Panda Benzina (Bianca)', 'TARGA_PANDA_BIANCA_1', 'available', 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Bianca", "image": "/panda2.jpeg", "display_group": "fiat-panda-bianca", "specs": {"power": "70Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb),
  ('Fiat Panda Benzina (Bianca)', 'TARGA_PANDA_BIANCA_2', 'available', 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Bianca", "image": "/panda2.jpeg", "display_group": "fiat-panda-bianca", "specs": {"power": "70Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb)
ON CONFLICT (display_name, plate) DO NOTHING;

-- 2. Renault Clio 4 Arancione (2x)
INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata)
VALUES
  ('Renault Clio 4 (Arancione)', 'TARGA_CLIO_ARANCIONE_1', 'available', 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Arancione", "image": "/clio.jpeg", "display_group": "clio-4-arancione", "specs": {"power": "90Cv", "seats": "5 posti", "engine": "1.5L Diesel"}}'::jsonb),
  ('Renault Clio 4 (Arancione)', 'TARGA_CLIO_ARANCIONE_2', 'available', 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Arancione", "image": "/clio.jpeg", "display_group": "clio-4-arancione", "specs": {"power": "90Cv", "seats": "5 posti", "engine": "1.5L Diesel"}}'::jsonb)
ON CONFLICT (display_name, plate) DO NOTHING;

-- 3. Renault Clio 4 Blu (2x)
INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata)
VALUES
  ('Renault Clio 4 (Blu)', 'TARGA_CLIO_BLU_1', 'available', 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Blu", "image": "/clio.jpeg", "display_group": "clio-4-blu", "specs": {"power": "90Cv", "seats": "5 posti", "engine": "1.5L Diesel"}}'::jsonb),
  ('Renault Clio 4 (Blu)', 'TARGA_CLIO_BLU_2', 'available', 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Blu", "image": "/clio.jpeg", "display_group": "clio-4-blu", "specs": {"power": "90Cv", "seats": "5 posti", "engine": "1.5L Diesel"}}'::jsonb)
ON CONFLICT (display_name, plate) DO NOTHING;

-- 4. Peugeot 208 Bianca (2x)
INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata)
VALUES
  ('Peugeot 208 (Bianca)', 'TARGA_208_BIANCA_1', 'available', 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Bianca", "image": "/208.jpeg", "display_group": "peugeot-208-bianca", "specs": {"power": "75Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb),
  ('Peugeot 208 (Bianca)', 'TARGA_208_BIANCA_2', 'available', 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Bianca", "image": "/208.jpeg", "display_group": "peugeot-208-bianca", "specs": {"power": "75Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb)
ON CONFLICT (display_name, plate) DO NOTHING;

-- 5. Citroën C3 Nera (2x)
INSERT INTO vehicles (display_name, plate, status, daily_rate, category, metadata)
VALUES
  ('Citroën C3 (Nera)', 'TARGA_C3_NERA_1', 'available', 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Nera", "image": "/c3.jpeg", "display_group": "citroen-c3-nera", "specs": {"power": "82Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb),
  ('Citroën C3 (Nera)', 'TARGA_C3_NERA_2', 'available', 29.90, 'urban',
   '{"pricing": {"daily": 29.90, "weekly": 149, "monthly": 599}, "color": "Nera", "image": "/c3.jpeg", "display_group": "citroen-c3-nera", "specs": {"power": "82Cv", "seats": "5 posti", "engine": "1.2L Benzina"}}'::jsonb)
ON CONFLICT (display_name, plate) DO NOTHING;

-- Verify all insertions
SELECT
  id,
  display_name,
  plate,
  status,
  daily_rate,
  category,
  metadata->>'display_group' as display_group,
  metadata->>'color' as color,
  metadata->>'image' as image
FROM vehicles
WHERE category = 'urban'
  AND metadata->>'display_group' IS NOT NULL
ORDER BY metadata->>'display_group', plate;
