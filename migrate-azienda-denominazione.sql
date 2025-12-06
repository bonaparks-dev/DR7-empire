-- Migration: Add denominazione field to existing azienda clients
-- This updates existing company clients that only have ragione_sociale set

-- First, let's check which azienda clients are missing denominazione
SELECT
    id,
    tipo_cliente,
    ragione_sociale,
    denominazione,
    email,
    created_at
FROM customers_extended
WHERE tipo_cliente = 'azienda'
  AND ragione_sociale IS NOT NULL
  AND (denominazione IS NULL OR denominazione = '');

-- Update azienda clients: copy ragione_sociale to denominazione if denominazione is empty
UPDATE customers_extended
SET denominazione = ragione_sociale
WHERE tipo_cliente = 'azienda'
  AND ragione_sociale IS NOT NULL
  AND (denominazione IS NULL OR denominazione = '');

-- Verify the update
SELECT
    id,
    tipo_cliente,
    ragione_sociale,
    denominazione,
    email,
    created_at
FROM customers_extended
WHERE tipo_cliente = 'azienda'
ORDER BY created_at DESC;
