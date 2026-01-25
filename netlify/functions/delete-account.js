const { createClient } = require('@supabase/supabase-js');

// CORS headers for all responses
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

// Helper to create response
const response = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body)
});

exports.handler = async (event) => {
    console.log('[DeleteAccount] Starting - Method:', event.httpMethod);

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    // Only POST allowed
    if (event.httpMethod !== 'POST') {
        return response(405, { error: 'Method not allowed' });
    }

    try {
        // Get Supabase config
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('[DeleteAccount] Missing env vars');
            return response(500, { error: 'Server configuration error' });
        }

        // Get auth token
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('[DeleteAccount] No auth header');
            return response(401, { error: 'Not authenticated' });
        }

        const token = authHeader.replace('Bearer ', '');

        // Create client with user token to get user info
        const userClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } }
        });

        // Get user
        const { data: { user }, error: userError } = await userClient.auth.getUser();

        if (userError || !user) {
            console.error('[DeleteAccount] User error:', userError?.message);
            return response(401, { error: 'Invalid session' });
        }

        console.log('[DeleteAccount] Deleting user:', user.id, user.email);

        // Use service role client to delete user (has admin privileges)
        const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Delete related data first
        try {
            // Delete bookings
            await adminClient.from('bookings').delete().eq('userId', user.id);
            console.log('[DeleteAccount] Deleted bookings');
        } catch (e) {
            console.log('[DeleteAccount] No bookings to delete or error:', e.message);
        }

        try {
            // Delete credit transactions
            await adminClient.from('credit_transactions').delete().eq('user_id', user.id);
            console.log('[DeleteAccount] Deleted credit transactions');
        } catch (e) {
            console.log('[DeleteAccount] No credit transactions or error:', e.message);
        }

        try {
            // Delete membership purchases
            await adminClient.from('membership_purchases').delete().eq('user_id', user.id);
            console.log('[DeleteAccount] Deleted membership purchases');
        } catch (e) {
            console.log('[DeleteAccount] No membership purchases or error:', e.message);
        }

        try {
            // Delete customers_extended
            await adminClient.from('customers_extended').delete().eq('id', user.id);
            console.log('[DeleteAccount] Deleted customers_extended');
        } catch (e) {
            console.log('[DeleteAccount] No customers_extended or error:', e.message);
        }

        // Finally delete the auth user
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

        if (deleteError) {
            console.error('[DeleteAccount] Delete error:', deleteError.message);
            return response(500, { error: 'Failed to delete account: ' + deleteError.message });
        }

        console.log('[DeleteAccount] Success - User deleted:', user.id);
        return response(200, { message: 'Account deleted successfully' });

    } catch (error) {
        console.error('[DeleteAccount] Error:', error.message);
        return response(500, { error: 'Server error: ' + error.message });
    }
};
