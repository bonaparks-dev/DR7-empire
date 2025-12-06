-- Migration: Add extended fields for customers_extended table
-- This adds all the missing fields for persona fisica and azienda

-- Add new columns for Persona Fisica
ALTER TABLE customers_extended
ADD COLUMN IF NOT EXISTS cap VARCHAR(5),
ADD COLUMN IF NOT EXISTS citta VARCHAR(100),
ADD COLUMN IF NOT EXISTS provincia VARCHAR(2),
ADD COLUMN IF NOT EXISTS sesso VARCHAR(1),
ADD COLUMN IF NOT EXISTS data_nascita DATE,
ADD COLUMN IF NOT EXISTS citta_nascita VARCHAR(100),
ADD COLUMN IF NOT EXISTS provincia_nascita VARCHAR(2),
ADD COLUMN IF NOT EXISTS codice_postale VARCHAR(5);

-- Add driver's license and document fields (will be stored in metadata JSONB for persona fisica)
-- metadata structure for persona fisica:
-- {
--   "tipo_patente": "B",
--   "numero_patente": "AB1234567",
--   "patente_emessa_da": "MIT UCO Milano",
--   "patente_data_rilascio": "2020-01-15",
--   "patente_scadenza": "2030-01-15"
-- }

-- Add new columns for Azienda (società)
ALTER TABLE customers_extended
ADD COLUMN IF NOT EXISTS sede_legale TEXT,
ADD COLUMN IF NOT EXISTS sede_operativa TEXT,
ADD COLUMN IF NOT EXISTS rappresentante_nome VARCHAR(100),
ADD COLUMN IF NOT EXISTS rappresentante_cognome VARCHAR(100),
ADD COLUMN IF NOT EXISTS rappresentante_cf VARCHAR(16),
ADD COLUMN IF NOT EXISTS rappresentante_ruolo VARCHAR(100),
ADD COLUMN IF NOT EXISTS documento_tipo VARCHAR(50),
ADD COLUMN IF NOT EXISTS documento_numero VARCHAR(50),
ADD COLUMN IF NOT EXISTS documento_data_rilascio DATE,
ADD COLUMN IF NOT EXISTS documento_luogo_rilascio VARCHAR(100);

-- metadata structure for azienda will include:
-- {
--   "indirizzo_ddt": "...",
--   "contatti_cliente": "...",
--   "documento_tipo": "Carta Identità",
--   "documento_numero": "AB1234567",
--   "documento_data_rilascio": "2020-01-15",
--   "documento_luogo_rilascio": "Milano"
-- }

-- Create indexes for better performance on frequently searched fields
CREATE INDEX IF NOT EXISTS idx_customers_data_nascita ON customers_extended(data_nascita);
CREATE INDEX IF NOT EXISTS idx_customers_citta ON customers_extended(citta);
CREATE INDEX IF NOT EXISTS idx_customers_cap ON customers_extended(cap);
CREATE INDEX IF NOT EXISTS idx_customers_rappresentante_cf ON customers_extended(rappresentante_cf);

-- Verify the new structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers_extended'
ORDER BY ordinal_position;
