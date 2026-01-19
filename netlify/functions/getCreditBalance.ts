import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key for server-side access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
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
            console.warn('[getCreditBalance] Missing user_id parameter');
            // Return default instead of error to maintain resilience
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ balance: 0 }),
            };
        }

        console.log('[getCreditBalance] Fetching credit balance', { userId, timestamp: new Date().toISOString() });

        // Query user_credit_balance table
        const { data, error } = await supabase
            .from('user_credit_balance')
            .select('balance')
            .eq('user_id', userId)
            .maybeSingle(); // Use maybeSingle to handle no rows gracefully

        if (error) {
            console.warn('[getCreditBalance] Supabase error (returning default):', {
                error: error.message,
                code: error.code,
                userId,
            });

            // Return default instead of error - resilient fallback
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ balance: 0 }),
            };
        }

        // If no data found, return default
        if (!data) {
            console.log('[getCreditBalance] No balance record found, returning default', { userId });
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ balance: 0 }),
            };
        }

        console.log('[getCreditBalance] Success:', {
            userId,
            balance: data.balance,
            timestamp: new Date().toISOString(),
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ balance: data.balance || 0 }),
        };
    } catch (error: any) {
        console.error('[getCreditBalance] Unexpected error (returning default):', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
        });

        // Return default instead of error - resilient fallback
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ balance: 0 }),
        };
    }
};
