import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { getCorsOrigin } from './utils/cors';

// 🚨 FIX: Align environment variables (VITE_* for client, plain for server)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Emergency fallback: Use anon key if service role key is missing
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Validate credentials before creating client
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL or VITE_SUPABASE_URL environment variable is required');
}

if (!supabaseServiceKey && !supabaseAnonKey) {
  throw new Error('Either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required');
}

// Create Supabase client with available key
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey,
  {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false
    }
  }
);

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': getCorsOrigin(event.headers['origin']),
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

        // Create timeout promise (8 seconds max - reduced from 10s)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database query timeout after 8s')), 8000);
        });

        // Build optimized query with specific fields
        let query = supabase
            .from('vehicles')
            .select('id, display_name, plate, status, daily_rate, price_resident_daily, price_nonresident_daily, category, metadata, created_at, updated_at')
            .neq('status', 'retired')
            .order('display_name', { ascending: true });

        // Filter by category if specified (fixed urban cars issue)
        if (category && ['exotic', 'urban', 'aziendali'].includes(category)) {
            query = query.eq('category', category);
            console.log(`[getVehicles] Filtering by category: ${category}`);
        }

        // Execute query with timeout
        const { data, error } = await Promise.race([
            query,
            timeoutPromise
        ]) as any;

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
