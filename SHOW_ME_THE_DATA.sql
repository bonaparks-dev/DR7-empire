-- RUN THIS IN YOUR SUPABASE DASHBOARD SQL EDITOR
-- This will retrieve the "missing" data for your customers

SELECT 
    au.email,
    ce.nome,
    ce.cognome,
    ce.codice_fiscale,
    ce.indirizzo,
    ce.citta,
    ce.telefono,
    ce.tipo_cliente,
    ce.partita_iva,
    ce.ragione_sociale
FROM customers_extended ce
JOIN auth.users au ON ce.user_id = au.id
WHERE au.email IN ('andrea.caria@dcrsrls.it', 'desmokelu@gmail.com');
