const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        // Parse body to get token
        let token;
        try {
            const body = JSON.parse(event.body || '{}');
            token = body.token;
        } catch (e) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
        }

        if (!token) {
            console.log('No token in body');
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Token required' }) };
        }

        console.log('Token received, length:', token.length);

        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        console.log('Env check:', { url: !!supabaseUrl, service: !!serviceKey, anon: !!anonKey });

        if (!supabaseUrl || !serviceKey || !anonKey) {
            return { statusCode: 500, headers, body: JSON.stringify({
                error: 'Missing env vars',
                missing: {
                    url: !supabaseUrl,
                    serviceKey: !serviceKey,
                    anonKey: !anonKey
                }
            })};
        }

        // Get user from token
        console.log('Creating Supabase client...');
        const userClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        console.log('Calling getUser...');
        const { data: userData, error: userError } = await userClient.auth.getUser();
        console.log('getUser result:', { hasData: !!userData, hasUser: !!userData?.user, hasError: !!userError });

        if (userError) {
            console.error('Auth error:', userError.message);
            return { statusCode: 401, headers, body: JSON.stringify({ error: userError.message }) };
        }

        if (!userData?.user) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'No user found' }) };
        }

        const userId = userData.user.id;
        const userEmail = userData.user.email;

        console.log('Deleting user:', userId, userEmail);

        // Admin client for deletions
        const admin = createClient(supabaseUrl, serviceKey);

        // Delete all user data
        await admin.from('bookings').delete().eq('userId', userId);
        await admin.from('bookings').delete().eq('userId', userId.toString());
        await admin.from('credit_transactions').delete().eq('user_id', userId);
        await admin.from('membership_purchases').delete().eq('user_id', userId);
        await admin.from('customers_extended').delete().eq('id', userId);

        // Delete the user account
        const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error('Delete user error:', deleteError);
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to delete user' }) };
        }

        console.log('User deleted successfully:', userId);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
    }
};
