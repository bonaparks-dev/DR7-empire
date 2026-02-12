const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

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

        // 2. Generate confirmation link and send verification email
        try {
            const siteUrl = process.env.SITE_URL || process.env.URL || 'https://dr7empire.com';
            const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
                type: 'signup',
                email,
                options: {
                    redirectTo: `${siteUrl}/confirmation-success`,
                },
            });

            if (linkError) {
                console.error('Failed to generate confirmation link:', linkError);
            } else if (linkData?.properties?.action_link) {
                const confirmationLink = linkData.properties.action_link;
                console.log('Confirmation link generated for:', email);

                // Send verification email via SMTP
                if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
                    const transporter = nodemailer.createTransport({
                        host: process.env.SMTP_HOST || 'smtp.resend.com',
                        port: parseInt(process.env.SMTP_PORT || '587'),
                        secure: process.env.SMTP_SECURE === 'true',
                        auth: {
                            user: process.env.SMTP_USER,
                            pass: process.env.SMTP_PASSWORD,
                        },
                    });

                    const customerName = customerData?.nome
                        ? `${customerData.nome} ${customerData.cognome || ''}`.trim()
                        : email;

                    await transporter.sendMail({
                        from: `"DR7 Empire" <${process.env.SMTP_FROM || 'info@dr7.app'}>`,
                        to: email,
                        subject: 'Conferma il tuo indirizzo email — DR7 Empire',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 12px;">
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <h1 style="color: #fff; font-size: 28px; margin: 0;">DR7 Empire</h1>
                                </div>
                                <h2 style="color: #fff; font-size: 22px;">Ciao ${customerName},</h2>
                                <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
                                    Grazie per esserti registrato su DR7 Empire. Per completare la registrazione, conferma il tuo indirizzo email cliccando il pulsante qui sotto.
                                </p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${confirmationLink}" style="background: #fff; color: #000; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                                        Conferma Email
                                    </a>
                                </div>
                                <p style="color: #888; font-size: 13px; text-align: center;">
                                    Se non hai creato un account su DR7 Empire, puoi ignorare questa email.
                                </p>
                            </div>
                        `,
                    });
                    console.log('Verification email sent to:', email);
                } else {
                    console.warn('SMTP not configured, verification email not sent');
                }
            }
        } catch (emailError) {
            console.error('Error sending verification email (non-blocking):', emailError);
        }

        // 3. Wait briefly for trigger to complete, then update with full data
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
