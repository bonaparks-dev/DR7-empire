const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { email, password, customerData } = JSON.parse(event.body);

        if (!email || !password) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Email and password are required' }) };
        }

        // 1. Create Auth User
        // Store ALL customer data in user_metadata so the database trigger can extract everything
        const userMetadata = {
            source: 'website_registration',
            email: email,
            // Store all customer data so trigger can extract it if needed
            ...(customerData && {
                // Common fields
                nome: customerData.nome,
                cognome: customerData.cognome,
                telefono: customerData.telefono,
                codiceFiscale: customerData.codice_fiscale,
                indirizzo: customerData.indirizzo,
                numeroCivico: customerData.numero_civico,
                cittaResidenza: customerData.citta_residenza,
                provinciaResidenza: customerData.provincia_residenza,
                codicePostale: customerData.codice_postale,
                nazione: customerData.nazione,
                tipoCliente: customerData.tipo_cliente,

                // Persona Fisica fields
                sesso: customerData.sesso,
                dataNascita: customerData.data_nascita,
                cittaNascita: customerData.citta_nascita,
                provinciaNascita: customerData.provincia_nascita,
                pec: customerData.pec,

                // License metadata (flatten from metadata object)
                tipoPatente: customerData.metadata?.tipo_patente,
                numeroPatente: customerData.metadata?.numero_patente,
                patenteEmessaDa: customerData.metadata?.patente_emessa_da,
                patenteDataRilascio: customerData.metadata?.patente_data_rilascio,
                patenteScadenza: customerData.metadata?.patente_scadenza,

                // Azienda fields
                denominazione: customerData.denominazione,
                partitaIva: customerData.partita_iva,
                sedeOperativa: customerData.sede_operativa,
                codiceDestinatario: customerData.codice_destinatario,
                rappresentanteNome: customerData.rappresentante_nome,
                rappresentanteCognome: customerData.rappresentante_cognome,
                rappresentanteCF: customerData.rappresentante_cf,
                rappresentanteRuolo: customerData.rappresentante_ruolo,

                // Document metadata for Azienda (flatten from metadata object)
                documentoTipo: customerData.metadata?.documento_tipo,
                documentoNumero: customerData.metadata?.documento_numero,
                documentoDataRilascio: customerData.metadata?.documento_data_rilascio,
                documentoLuogoRilascio: customerData.metadata?.documento_luogo_rilascio,

                // Pubblica Amministrazione fields
                codiceUnivoco: customerData.codice_univoco,
                enteUfficio: customerData.ente_ufficio,
                citta: customerData.citta,

                // Residency Zone
                residencyZone: customerData.residency_zone
            })
        };


        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: false, // Or true if you want to skip confirmation, but usually false
            user_metadata: userMetadata
        });

        if (authError) {
            console.error('Auth creation error:', authError);
            console.error('Auth error details:', JSON.stringify(authError, null, 2));
            console.error('Email attempted:', email);
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: authError.message,
                    code: authError.code,
                    details: authError.details,
                    hint: authError.hint
                })
            };
        }

        const userId = authData.user.id;

        // 2. Wait briefly for trigger to complete, then update with full data
        if (customerData) {
            // Small delay to let the trigger create the initial record
            await new Promise(resolve => setTimeout(resolve, 500));

            // Ensure the user_id matches the new user
            customerData.user_id = userId;

            // Force source to be 'website' (not 'website_registration' from trigger)
            customerData.source = 'website';

            // Clean up fields just in case
            if (customerData.codiceFiscale) {
                customerData.codice_fiscale = customerData.codiceFiscale;
                delete customerData.codiceFiscale;
            }

            console.log('Upserting customer data for user:', userId);
            console.log('Customer data keys:', Object.keys(customerData));

            const { data: upsertedData, error: profileError } = await supabase
                .from('customers_extended')
                .upsert(customerData, {
                    onConflict: 'user_id',  // Specify the conflict column
                    ignoreDuplicates: false  // Force update on conflict
                })
                .select();

            if (profileError) {
                console.error('Profile upsert error:', profileError);
                console.error('Customer data that failed:', JSON.stringify(customerData, null, 2));

                // Try a direct UPDATE as fallback
                console.log('Attempting direct UPDATE as fallback...');
                const { error: updateError } = await supabase
                    .from('customers_extended')
                    .update(customerData)
                    .eq('user_id', userId);

                if (updateError) {
                    console.error('Direct UPDATE also failed:', updateError);
                    return {
                        statusCode: 500,
                        body: JSON.stringify({
                            error: 'Account created but failed to save profile data. Please contact support.',
                            userId: userId,
                            details: profileError.message,
                            code: profileError.code,
                            hint: profileError.hint,
                            dbDetails: profileError.details
                        })
                    };
                }

                console.log('Direct UPDATE succeeded!');
            } else {
                console.log('Profile upserted successfully:', upsertedData);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, user: authData.user })
        };

    } catch (error) {
        console.error('Registration handler error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
    }
};
