-- Fix sync_auth_user_to_customers trigger to extract ALL registration fields
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
  existing_id UUID;
  full_name TEXT;
BEGIN
  -- Extract metadata - try both formats
  -- Format 1: Italian (nome, cognome, telefono)
  nome_value := NEW.raw_user_meta_data->>'nome';
  cognome_value := NEW.raw_user_meta_data->>'cognome';
  telefono_value := NEW.raw_user_meta_data->>'telefono';
  
  -- Format 2: English (fullName, phone) - used by website
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
  
  -- Extract additional fields from raw_user_meta_data
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
        tipo_cliente,
        nazione,
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
        'persona_fisica',
        'Italia',
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
'Automatically creates/updates customers_extended record when a new auth user is created. Extracts all available fields from raw_user_meta_data including CF, address, birth info, etc.';
