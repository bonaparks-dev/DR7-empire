import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ConsentRequest {
    user_id: string;
    consent_type: string;
    consent_text: string;
    source?: string;
}

export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://dr7empire.com',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const body: ConsentRequest = JSON.parse(event.body || '{}');

        if (!body.user_id || !body.consent_type || !body.consent_text) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'user_id, consent_type, and consent_text are required' }),
            };
        }

        // Extract IP address from request headers
        const ip_address =
            event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            event.headers['x-real-ip'] ||
            event.headers['client-ip'] ||
            'unknown';

        // Extract user agent
        const user_agent = event.headers['user-agent'] || 'unknown';

        // Check if there's already an active consent of this type for this user
        const { data: existingConsent } = await supabase
            .from('user_consents')
            .select('id')
            .eq('user_id', body.user_id)
            .eq('consent_type', body.consent_type)
            .eq('status', 'active')
            .single();

        if (existingConsent) {
            // Update existing consent with new timestamp (re-consent)
            const { error: updateError } = await supabase
                .from('user_consents')
                .update({
                    consent_text: body.consent_text,
                    accepted_at: new Date().toISOString(),
                    ip_address,
                    user_agent,
                    source: body.source || 'web',
                })
                .eq('id', existingConsent.id);

            if (updateError) {
                console.error('Error updating consent:', updateError);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: 'Failed to update consent', details: updateError.message }),
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Consent updated',
                    consent_id: existingConsent.id
                }),
            };
        }

        // Insert new consent record
        const { data: newConsent, error: insertError } = await supabase
            .from('user_consents')
            .insert({
                user_id: body.user_id,
                consent_type: body.consent_type,
                consent_text: body.consent_text,
                ip_address,
                user_agent,
                source: body.source || 'web',
                status: 'active',
                accepted_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('Error inserting consent:', insertError);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to save consent', details: insertError.message }),
            };
        }

        // Also update customers_extended for backward compatibility
        await supabase
            .from('customers_extended')
            .update({
                notifications: supabase.rpc('jsonb_set_nested', {
                    target: 'notifications',
                    path: '{marketingConsent}',
                    value: 'true'
                })
            })
            .eq('id', body.user_id);

        console.log('Consent saved successfully:', {
            consent_id: newConsent.id,
            user_id: body.user_id,
            consent_type: body.consent_type,
            ip_address,
            timestamp: new Date().toISOString(),
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Consent saved',
                consent_id: newConsent.id
            }),
        };

    } catch (error: any) {
        console.error('Error in save-consent:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
        };
    }
};
