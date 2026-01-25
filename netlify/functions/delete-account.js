const { createClient } = require('@supabase/supabase-js');

// Use the SAME credentials as the frontend
const SUPABASE_URL = 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU';

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
        // Get token from body
        let token;
        try {
            const body = JSON.parse(event.body || '{}');
            token = body.token;
        } catch (e) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid body' }) };
        }

        if (!token) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'No token' }) };
        }

        // Service key from env (required for admin operations)
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
            console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server config error' }) };
        }

        // Validate user with their token
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data: userData, error: authError } = await userClient.auth.getUser();

        if (authError || !userData?.user) {
            console.error('Auth failed:', authError?.message);
            return { statusCode: 401, headers, body: JSON.stringify({ error: authError?.message || 'Auth failed' }) };
        }

        const userId = userData.user.id;
        console.log('Deleting user:', userId);

        // Admin client for deletions
        const admin = createClient(SUPABASE_URL, serviceKey);

        // Delete all related data
        console.log('Deleting bookings...');
        await admin.from('bookings').delete().eq('userId', userId);
        await admin.from('bookings').delete().eq('userId', userId.toString());

        console.log('Deleting credit_transactions...');
        await admin.from('credit_transactions').delete().eq('user_id', userId);

        console.log('Deleting membership_purchases...');
        await admin.from('membership_purchases').delete().eq('user_id', userId);

        console.log('Deleting customers_extended...');
        await admin.from('customers_extended').delete().eq('id', userId);

        // Delete the user
        console.log('Deleting auth user...');
        const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error('Delete failed:', deleteError.message);
            return { statusCode: 500, headers, body: JSON.stringify({ error: deleteError.message }) };
        }

        console.log('User deleted successfully');
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
