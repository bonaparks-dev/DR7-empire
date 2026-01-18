-- Get Andrea's COMPLETE record including metadata
SELECT 
  id,
  user_id,
  tipo_cliente,
  nome,
  cognome,
  email,
  telefono,
  codice_fiscale,
  indirizzo,
  numero_civico,
  citta_residenza,
  provincia_residenza,
  codice_postale,
  sesso,
  data_nascita,
  citta_nascita,
  provincia_nascita,
  nazione,
  source,
  created_at,
  updated_at
FROM customers_extended
WHERE user_id = '9f4f8417-6383-42c9-9a3a-a712f8393275';
