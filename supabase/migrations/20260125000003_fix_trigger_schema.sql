-- Fix: Explicitly specify the schema in the trigger function
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_customers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  tipo_cliente_value TEXT;
  residency_zone_value TEXT;
BEGIN
  BEGIN
    -- Extract values with defaults
    tipo_cliente_value := COALESCE(NEW.raw_user_meta_data->>'tipoCliente', 'persona_fisica');
    residency_zone_value := COALESCE(NEW.raw_user_meta_data->>'residencyZone', 'NON_RESIDENTE');
    
    RAISE NOTICE 'TRIGGER DEBUG: tipo_cliente=%, residency_zone=%', tipo_cliente_value, residency_zone_value;
    
    -- Try to insert - explicitly use public schema
    INSERT INTO public.customers_extended (
      user_id,
      email,
      tipo_cliente,
      residency_zone,
      source,
      created_at
    ) VALUES (
      NEW.id,
      NEW.email,
      tipo_cliente_value,
      residency_zone_value,
      'website_registration',
      NEW.created_at
    );
    
    RAISE NOTICE 'TRIGGER SUCCESS: Customer created for user %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'TRIGGER ERROR: % - SQLSTATE: %', SQLERRM, SQLSTATE;
    RAISE;
  END;
  
  RETURN NEW;
END;
$function$;
