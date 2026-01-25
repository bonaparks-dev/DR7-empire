const { createClient } = require('@supabase/supabase-js');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

const respond = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body)
});

exports.handler = async (event) => {
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return respond(405, { error: 'Method not allowed' });
    }

    try {
        // Log env vars availability (not values)
        console.log('[DeleteAccount] Env check:', {
            hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
            hasAnonKey: !!(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        });

        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl) {
            return respond(500, { error: 'Missing SUPABASE_URL' });
        }
        if (!anonKey) {
            return respond(500, { error: 'Missing SUPABASE_ANON_KEY' });
        }
        if (!serviceKey) {
            return respond(500, { error: 'Missing SUPABASE_SERVICE_ROLE_KEY' });
        }

        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader) {
            return respond(401, { error: 'No authorization header' });
        }

        console.log('[DeleteAccount] Creating user client...');

        const userClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data, error: userError } = await userClient.auth.getUser();

        if (userError) {
            console.error('[DeleteAccount] getUser error:', userError.message);
            return respond(401, { error: 'Auth error: ' + userError.message });
        }

        if (!data?.user) {
            return respond(401, { error: 'No user found' });
        }

        const user = data.user;
        console.log('[DeleteAccount] User:', user.id, user.email);

        const adminClient = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Delete related data (ignore errors for tables that might not exist)
        const tables = [
            { name: 'bookings', column: 'userId' },
            { name: 'credit_transactions', column: 'user_id' },
            { name: 'membership_purchases', column: 'user_id' },
            { name: 'customers_extended', column: 'id' }
        ];

        for (const table of tables) {
            try {
                const { error } = await adminClient.from(table.name).delete().eq(table.column, user.id);
                if (error) console.log(`[DeleteAccount] ${table.name}:`, error.message);
                else console.log(`[DeleteAccount] Deleted from ${table.name}`);
            } catch (e) {
                console.log(`[DeleteAccount] ${table.name} skip:`, e.message);
            }
        }

        // Delete the user
        console.log('[DeleteAccount] Deleting auth user...');
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

        if (deleteError) {
            console.error('[DeleteAccount] Delete failed:', deleteError.message);
            return respond(500, { error: 'Delete failed: ' + deleteError.message });
        }

        console.log('[DeleteAccount] Success');
        return respond(200, { message: 'Account deleted' });

    } catch (error) {
        console.error('[DeleteAccount] Crash:', error);
        return respond(500, { error: 'Server error: ' + (error.message || 'Unknown') });
    }
};
