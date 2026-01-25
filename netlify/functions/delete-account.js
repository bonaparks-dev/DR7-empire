const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU';

const json = (data, status = 200) => ({
    statusCode: status,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(data)
});

exports.handler = async (event) => {
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return json({ success: true });
    }

    // Method check
    if (event.httpMethod !== 'POST') {
        return json({ success: false, message: 'POST required' }, 405);
    }

    // Parse body safely
    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch (e) {
        return json({ success: false, message: 'Invalid JSON body' }, 400);
    }

    const { token } = body;

    // Token validation
    if (!token) {
        return json({ success: false, message: 'Token required' }, 401);
    }

    if (typeof token !== 'string') {
        return json({ success: false, message: 'Token must be string' }, 401);
    }

    if (token.length > 10000) {
        return json({ success: false, message: 'Token too large - please log out and log in again' }, 401);
    }

    if (token.split('.').length !== 3) {
        return json({ success: false, message: 'Invalid token format' }, 401);
    }

    // Service key check
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        return json({ success: false, message: 'Server misconfigured' }, 500);
    }

    try {
        // Validate user
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data, error } = await userClient.auth.getUser();

        if (error) {
            return json({ success: false, message: error.message }, 401);
        }

        if (!data?.user) {
            return json({ success: false, message: 'User not found' }, 401);
        }

        const userId = data.user.id;
        const userEmail = data.user.email;
        const userName = data.user.user_metadata?.full_name || 'Customer';

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
            return json({ success: false, message: delError.message }, 500);
        }

        // Send email
        try {
            await fetch(`${process.env.URL || 'https://dr7empire.com'}/.netlify/functions/send-deletion-confirmation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, fullName: userName })
            });
        } catch (e) {}

        return json({ success: true, message: 'Account deleted' });

    } catch (e) {
        return json({ success: false, message: e.message || 'Server error' }, 500);
    }
};
