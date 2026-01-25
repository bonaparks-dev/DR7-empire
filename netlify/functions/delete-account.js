const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '{}' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { token } = JSON.parse(event.body || '{}');

        if (!token) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Token required' }) };
        }

        const supabaseUrl = 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU';
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceKey) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server not configured' }) };
        }

        // Verify the user with their token
        const userClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data: userData, error: userError } = await userClient.auth.getUser();

        if (userError || !userData?.user) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) };
        }

        const userId = userData.user.id;
        const userEmail = userData.user.email;

        // Admin client to delete user
        const adminClient = createClient(supabaseUrl, serviceKey);

        // Delete user data from tables
        await adminClient.from('bookings').delete().eq('userId', userId);
        await adminClient.from('credit_transactions').delete().eq('user_id', userId);
        await adminClient.from('membership_purchases').delete().eq('user_id', userId);
        await adminClient.from('customers_extended').delete().eq('id', userId);

        // Delete the user account
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

        if (deleteError) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to delete account' }) };
        }

        // Try to send confirmation email
        try {
            await fetch(`${process.env.URL || 'https://dr7empire.com'}/.netlify/functions/send-deletion-confirmation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });
        } catch (e) {
            // Email failed but account is deleted
        }

        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

    } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Server error' }) };
    }
};
