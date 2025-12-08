-- Migration to add missing fields to customers_extended table
-- for detailed Persona Fisica and Azienda registration

ALTER TABLE public.customers_extended
ADD COLUMN IF NOT EXISTS sesso text,
ADD COLUMN IF NOT EXISTS citta_nascita text,
ADD COLUMN IF NOT EXISTS provincia_nascita text,
ADD COLUMN IF NOT EXISTS sede_operativa text,
ADD COLUMN IF NOT EXISTS codice_destinatario text,
ADD COLUMN IF NOT EXISTS rappresentante_nome text,
ADD COLUMN IF NOT EXISTS rappresentante_cognome text,
ADD COLUMN IF NOT EXISTS rappresentante_cf text,
ADD COLUMN IF NOT EXISTS rappresentante_ruolo text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
