-- Update sync_auth_user_to_customers trigger to extract ALL registration fields
-- Including license metadata, PEC, and company-specific fields
-- This ensures complete customer profiles are created from website registrations

CREATE OR REPLACE FUNCTION public.sync_auth_user_to_customers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  nome_value TEXT;
  cognome_value TEXT;
  telefono_value TEXT;
  codice_fiscale_value TEXT;
  indirizzo_value TEXT;
  citta_residenza_value TEXT;
  provincia_residenza_value TEXT;
  codice_postale_value TEXT;
  sesso_value TEXT;
  data_nascita_value TEXT;
  citta_nascita_value TEXT;
  provincia_nascita_value TEXT;
  numero_civico_value TEXT;
  pec_value TEXT;
  nazione_value TEXT;
  tipo_cliente_value TEXT;
  
  -- License fields
  tipo_patente_value TEXT;
  numero_patente_value TEXT;
  patente_emessa_da_value TEXT;
  patente_data_rilascio_value TEXT;
  patente_scadenza_value TEXT;
  
  -- Azienda fields
  denominazione_value TEXT;
  partita_iva_value TEXT;
  sede_operativa_value TEXT;
  codice_destinatario_value TEXT;
  rappresentante_nome_value TEXT;
  rappresentante_cognome_value TEXT;
  rappresentante_cf_value TEXT;
  rappresentante_ruolo_value TEXT;
  
  -- Document fields for Azienda
  documento_tipo_value TEXT;
  documento_numero_value TEXT;
  documento_data_rilascio_value TEXT;
  documento_luogo_rilascio_value TEXT;
  
  -- PA fields
  codice_univoco_value TEXT;
  ente_ufficio_value TEXT;
  citta_value TEXT;
  
  existing_id UUID;
  full_name TEXT;
  metadata_json JSONB;
BEGIN
  -- Extract metadata - try both formats
  -- Format 1: Italian (nome, cognome, telefono)
  nome_value := NEW.raw_user_meta_data->>'nome';
  cognome_value := NEW.raw_user_meta_data->>'cognome';
  telefono_value := NEW.raw_user_meta_data->>'telefono';
  
  -- Format 2: English (fullName, phone) - used by some flows
  full_name := NEW.raw_user_meta_data->>'fullName';
  IF full_name IS NOT NULL AND nome_value IS NULL THEN
    -- Split fullName into nome and cognome
    nome_value := split_part(full_name, ' ', 1);
    cognome_value := substring(full_name from position(' ' in full_name) + 1);
  END IF;
  
  -- Get phone from either telefono or phone
  IF telefono_value IS NULL THEN
    telefono_value := NEW.raw_user_meta_data->>'phone';
  END IF;
  
  -- Extract all common fields
  codice_fiscale_value := NEW.raw_user_meta_data->>'codiceFiscale';
  indirizzo_value := NEW.raw_user_meta_data->>'indirizzo';
  citta_residenza_value := NEW.raw_user_meta_data->>'cittaResidenza';
  provincia_residenza_value := NEW.raw_user_meta_data->>'provinciaResidenza';
  codice_postale_value := NEW.raw_user_meta_data->>'codicePostale';
  sesso_value := NEW.raw_user_meta_data->>'sesso';
  data_nascita_value := NEW.raw_user_meta_data->>'dataNascita';
  citta_nascita_value := NEW.raw_user_meta_data->>'cittaNascita';
  provincia_nascita_value := NEW.raw_user_meta_data->>'provinciaNascita';
  numero_civico_value := NEW.raw_user_meta_data->>'numeroCivico';
  pec_value := NEW.raw_user_meta_data->>'pec';
  nazione_value := COALESCE(NEW.raw_user_meta_data->>'nazione', 'Italia');
  tipo_cliente_value := COALESCE(NEW.raw_user_meta_data->>'tipoCliente', 'persona_fisica');
  
  -- Extract license fields (flattened from metadata)
  tipo_patente_value := NEW.raw_user_meta_data->>'tipoPatente';
  numero_patente_value := NEW.raw_user_meta_data->>'numeroPatente';
  patente_emessa_da_value := NEW.raw_user_meta_data->>'patenteEmessaDa';
  patente_data_rilascio_value := NEW.raw_user_meta_data->>'patenteDataRilascio';
  patente_scadenza_value := NEW.raw_user_meta_data->>'patenteScadenza';
  
  -- Extract Azienda fields
  denominazione_value := NEW.raw_user_meta_data->>'denominazione';
  partita_iva_value := NEW.raw_user_meta_data->>'partitaIva';
  sede_operativa_value := NEW.raw_user_meta_data->>'sedeOperativa';
  codice_destinatario_value := NEW.raw_user_meta_data->>'codiceDestinatario';
  rappresentante_nome_value := NEW.raw_user_meta_data->>'rappresentanteNome';
  rappresentante_cognome_value := NEW.raw_user_meta_data->>'rappresentanteCognome';
  rappresentante_cf_value := NEW.raw_user_meta_data->>'rappresentanteCF';
  rappresentante_ruolo_value := NEW.raw_user_meta_data->>'rappresentanteRuolo';
  
  -- Extract document fields for Azienda
  documento_tipo_value := NEW.raw_user_meta_data->>'documentoTipo';
  documento_numero_value := NEW.raw_user_meta_data->>'documentoNumero';
  documento_data_rilascio_value := NEW.raw_user_meta_data->>'documentoDataRilascio';
  documento_luogo_rilascio_value := NEW.raw_user_meta_data->>'documentoLuogoRilascio';
  
  -- Extract PA fields
  codice_univoco_value := NEW.raw_user_meta_data->>'codiceUnivoco';
  ente_ufficio_value := NEW.raw_user_meta_data->>'enteUfficio';
  citta_value := NEW.raw_user_meta_data->>'citta';
  
  -- Build metadata JSONB for license and document info
  metadata_json := '{}'::jsonb;
  IF tipo_patente_value IS NOT NULL THEN
    metadata_json := metadata_json || jsonb_build_object(
      'tipo_patente', tipo_patente_value,
      'numero_patente', numero_patente_value,
      'patente_emessa_da', patente_emessa_da_value,
      'patente_data_rilascio', patente_data_rilascio_value,
      'patente_scadenza', patente_scadenza_value
    );
  END IF;
  
  IF documento_tipo_value IS NOT NULL THEN
    metadata_json := metadata_json || jsonb_build_object(
      'documento_tipo', documento_tipo_value,
      'documento_numero', documento_numero_value,
      'documento_data_rilascio', documento_data_rilascio_value,
      'documento_luogo_rilascio', documento_luogo_rilascio_value
    );
  END IF;
  
  -- Only create customer record if we have at least email
  IF NEW.email IS NOT NULL THEN
    -- Check if customer already exists
    SELECT id INTO existing_id
    FROM customers_extended
    WHERE user_id = NEW.id
    LIMIT 1;
    
    IF existing_id IS NULL THEN
      -- Insert new customer with ALL available fields
      INSERT INTO customers_extended (
        user_id,
        email,
        nome,
        cognome,
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
        pec,
        tipo_cliente,
        nazione,
        denominazione,
        partita_iva,
        sede_operativa,
        codice_destinatario,
        rappresentante_nome,
        rappresentante_cognome,
        rappresentante_cf,
        rappresentante_ruolo,
        codice_univoco,
        ente_ufficio,
        citta,
        metadata,
        source,
        created_at
      ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(nome_value, ''),
        COALESCE(cognome_value, ''),
        COALESCE(telefono_value, ''),
        codice_fiscale_value,
        indirizzo_value,
        numero_civico_value,
        citta_residenza_value,
        provincia_residenza_value,
        codice_postale_value,
        sesso_value,
        NULLIF(data_nascita_value, '')::date,
        citta_nascita_value,
        provincia_nascita_value,
        pec_value,
        tipo_cliente_value,
        nazione_value,
        denominazione_value,
        partita_iva_value,
        sede_operativa_value,
        codice_destinatario_value,
        rappresentante_nome_value,
        rappresentante_cognome_value,
        rappresentante_cf_value,
        rappresentante_ruolo_value,
        codice_univoco_value,
        ente_ufficio_value,
        citta_value,
        metadata_json,
        'website_registration',
        NEW.created_at
      );
      
      RAISE NOTICE 'Auto-created customer for user: % (email: %, CF: %)', 
        NEW.id, NEW.email, codice_fiscale_value;
    ELSE
      -- Update existing customer with new data (only update if new value is not null)
      UPDATE customers_extended SET
        email = NEW.email,
        nome = COALESCE(nome_value, nome),
        cognome = COALESCE(cognome_value, cognome),
        telefono = COALESCE(telefono_value, telefono),
        codice_fiscale = COALESCE(codice_fiscale_value, codice_fiscale),
        indirizzo = COALESCE(indirizzo_value, indirizzo),
        numero_civico = COALESCE(numero_civico_value, numero_civico),
        citta_residenza = COALESCE(citta_residenza_value, citta_residenza),
        provincia_residenza = COALESCE(provincia_residenza_value, provincia_residenza),
        codice_postale = COALESCE(codice_postale_value, codice_postale),
        sesso = COALESCE(sesso_value, sesso),
        data_nascita = COALESCE(NULLIF(data_nascita_value, '')::date, data_nascita),
        citta_nascita = COALESCE(citta_nascita_value, citta_nascita),
        provincia_nascita = COALESCE(provincia_nascita_value, provincia_nascita),
        pec = COALESCE(pec_value, pec),
        metadata = COALESCE(metadata_json, metadata),
        updated_at = NOW()
      WHERE user_id = NEW.id;
      
      RAISE NOTICE 'Updated existing customer for user: % (email: %)', NEW.id, NEW.email;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Ensure trigger is attached (should already exist, but this is idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_to_customers();

COMMENT ON FUNCTION public.sync_auth_user_to_customers() IS 
'Automatically creates/updates customers_extended record when a new auth user is created. Extracts ALL available fields from raw_user_meta_data including CF, address, birth info, license metadata, company fields, and PA fields.';
