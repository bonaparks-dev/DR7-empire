-- Fix existing lottery tickets by linking them to user accounts and customer data
-- This script will:
-- 1. Link tickets to auth.users by matching email addresses
-- 2. Populate customer_data from customers_extended table

-- Step 1: Update user_id for tickets that don't have it but match auth.users by email
UPDATE commercial_operation_tickets cot
SET user_id = au.id
FROM auth.users au
WHERE cot.user_id IS NULL
  AND cot.email = au.email;

-- Step 2: Populate customer_data from customers_extended for all tickets with user_id
UPDATE commercial_operation_tickets cot
SET customer_data = jsonb_build_object(
  'tipo_cliente', ce.tipo_cliente,
  'nome', ce.nome,
  'cognome', ce.cognome,
  'codice_fiscale', ce.codice_fiscale,
  'partita_iva', ce.partita_iva,
  'indirizzo', ce.indirizzo,
  'nazione', ce.nazione,
  'telefono', ce.telefono,
  'pec', ce.pec,
  'email', ce.email,
  'ragione_sociale', ce.ragione_sociale,
  'denominazione', ce.denominazione,
  'codice_destinatario', ce.codice_destinatario,
  'codice_univoco', ce.codice_univoco,
  'sede_operativa', ce.sede_operativa,
  'rappresentante_nome', ce.rappresentante_nome,
  'rappresentante_cognome', ce.rappresentante_cognome,
  'rappresentante_cf', ce.rappresentante_cf,
  'rappresentante_ruolo', ce.rappresentante_ruolo
)
FROM customers_extended ce
WHERE cot.user_id = ce.user_id
  AND cot.customer_data IS NULL;

-- Step 3: Verify the updates
SELECT 
  COUNT(*) as total_tickets,
  COUNT(user_id) as tickets_with_user_id,
  COUNT(customer_data) as tickets_with_customer_data,
  COUNT(*) - COUNT(user_id) as missing_user_id,
  COUNT(*) - COUNT(customer_data) as missing_customer_data
FROM commercial_operation_tickets;

-- Step 4: Show sample of updated tickets
SELECT 
  cot.email,
  cot.full_name,
  cot.ticket_number,
  cot.user_id,
  cot.customer_data->>'tipo_cliente' as customer_type,
  cot.customer_data->>'codice_fiscale' as codice_fiscale,
  cot.purchase_date
FROM commercial_operation_tickets cot
WHERE cot.customer_data IS NOT NULL
ORDER BY cot.purchase_date DESC
LIMIT 10;
