import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key for server-side access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://dr7empire.com',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json',
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        // Extract user_id from query parameters
        const userId = event.queryStringParameters?.user_id;

        if (!userId) {
            console.warn('[getResidencyZone] Missing user_id parameter');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ residency_zone: 'NON_RESIDENTE' }),
            };
        }

        // Verify the requesting user matches the requested user_id
        const authHeader = event.headers['authorization'];
        if (!authHeader) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required' }) };
        }
        const jwt = authHeader.replace('Bearer ', '');
        const { data: { user: authUser } } = await supabase.auth.getUser(jwt);
        if (!authUser) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
        }
        if (authUser.id !== userId) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
        }

        console.log('[getResidencyZone] Fetching residency zone', { userId, timestamp: new Date().toISOString() });

        // Query customers_extended table
        const { data, error } = await supabase
            .from('customers_extended')
            .select('residency_zone, nome, cognome, email, telefono, data_nascita, metadata, id')
            .eq('user_id', userId)
            .maybeSingle(); // Use maybeSingle to handle no rows gracefully

        if (error) {
            console.warn('[getResidencyZone] Supabase error (returning default):', {
                error: error.message,
                code: error.code,
                userId,
            });

            // Return default instead of error - resilient fallback
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ residency_zone: 'NON_RESIDENTE' }),
            };
        }

        // If no data found, return default
        if (!data || !data.residency_zone) {
            console.log('[getResidencyZone] No residency zone found, returning default', { userId });
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ residency_zone: 'NON_RESIDENTE' }),
            };
        }

        console.log('[getResidencyZone] Success:', {
            userId,
            residency_zone: data.residency_zone,
            timestamp: new Date().toISOString(),
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ residency_zone: data.residency_zone }),
        };
    } catch (error: any) {
        console.error('[getResidencyZone] Unexpected error (returning default):', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
        });

        // Return default instead of error - resilient fallback
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ residency_zone: 'NON_RESIDENTE' }),
        };
    }
};
