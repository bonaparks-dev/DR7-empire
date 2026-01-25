const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU';

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
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST only' }) };
    }

    try {
        const { email, password } = JSON.parse(event.body || '{}');

        if (!email || !password) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email and password required' }) };
        }

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
        }

        // Sign in to verify credentials
        const client = createClient(SUPABASE_URL, ANON_KEY);
        const { data: authData, error: authError } = await client.auth.signInWithPassword({ email, password });

        if (authError || !authData.user) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
        }

        const userId = authData.user.id;
        const userEmail = authData.user.email;

        // Admin client
        const admin = createClient(SUPABASE_URL, serviceKey);

        // Delete data
        await admin.from('bookings').delete().eq('userId', userId).catch(() => {});
        await admin.from('credit_transactions').delete().eq('user_id', userId).catch(() => {});
        await admin.from('membership_purchases').delete().eq('user_id', userId).catch(() => {});
        await admin.from('customers_extended').delete().eq('id', userId).catch(() => {});

        // Delete user
        const { error: delError } = await admin.auth.admin.deleteUser(userId);
        if (delError) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Delete failed: ' + delError.message }) };
        }

        // Send email
        try {
            await fetch(`${process.env.URL || 'https://dr7empire.com'}/.netlify/functions/send-deletion-confirmation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });
        } catch (e) {}

        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
