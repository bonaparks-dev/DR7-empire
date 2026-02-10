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
        // Extract category from query parameters
        const category = event.queryStringParameters?.category;

        console.log('[getVehicles] Fetching vehicles', { category, timestamp: new Date().toISOString() });

        // Build query
        let query = supabase
            .from('vehicles')
            .select('*')
            .neq('status', 'retired')
            .order('display_name', { ascending: true });

        // Filter by category if specified
        if (category && ['exotic', 'urban', 'aziendali'].includes(category)) {
            query = query.eq('category', category);
        }

        // Execute query
        const { data, error } = await query;

        if (error) {
            console.error('[getVehicles] Supabase error:', {
                error: error.message,
                code: error.code,
                details: error.details,
                category,
            });

            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Failed to fetch vehicles',
                    message: error.message,
                }),
            };
        }

        console.log('[getVehicles] Success:', {
            count: data?.length || 0,
            category,
            timestamp: new Date().toISOString(),
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data || []),
        };
    } catch (error: any) {
        console.error('[getVehicles] Unexpected error:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
        });

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
            }),
        };
    }
};
