import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RevokeRequest {
    user_id: string;
    consent_type: string;
}

export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
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
        const body: RevokeRequest = JSON.parse(event.body || '{}');

        if (!body.user_id || !body.consent_type) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'user_id and consent_type are required' }),
            };
        }

        // Extract IP address from request headers
        const ip_address =
            event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            event.headers['x-real-ip'] ||
            event.headers['client-ip'] ||
            'unknown';

        // Update consent status to revoked
        const { data, error } = await supabase
            .from('user_consents')
            .update({
                status: 'revoked',
                revoked_at: new Date().toISOString(),
            })
            .eq('user_id', body.user_id)
            .eq('consent_type', body.consent_type)
            .eq('status', 'active')
            .select();

        if (error) {
            console.error('Error revoking consent:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to revoke consent', details: error.message }),
            };
        }

        // Also update customers_extended for backward compatibility
        if (body.consent_type === 'marketing_partner') {
            await supabase
                .from('customers_extended')
                .update({
                    notifications: supabase.rpc('jsonb_set_nested', {
                        target: 'notifications',
                        path: '{marketingConsent}',
                        value: 'false'
                    })
                })
                .eq('id', body.user_id);
        }

        console.log('Consent revoked:', {
            user_id: body.user_id,
            consent_type: body.consent_type,
            ip_address,
            revoked_at: new Date().toISOString(),
            records_updated: data?.length || 0,
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Consent revoked',
                records_updated: data?.length || 0
            }),
        };

    } catch (error: any) {
        console.error('Error in revoke-consent:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', details: error.message }),
        };
    }
};
