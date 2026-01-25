const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU';

exports.handler = async (event) => {
    // Always return JSON with these headers
    const reply = (success, message, status = 200) => ({
        statusCode: status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*'
        },
        body: JSON.stringify({ success, message })
    });

    // CORS
    if (event.httpMethod === 'OPTIONS') {
        return reply(true, 'ok');
    }

    if (event.httpMethod !== 'POST') {
        return reply(false, 'POST required');
    }

    try {
        const { token } = JSON.parse(event.body || '{}');

        if (!token) {
            return reply(false, 'Token missing');
        }

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
            return reply(false, 'Service key not configured');
        }

        // Get user from token
        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        const { data, error } = await client.auth.getUser();

        if (error || !data?.user) {
            return reply(false, error?.message || 'Invalid token');
        }

        const userId = data.user.id;
        const userEmail = data.user.email;
        const userName = data.user.user_metadata?.full_name || 'Customer';
        console.log('DELETE USER:', userId, userEmail);

        // Admin client
        const admin = createClient(SUPABASE_URL, serviceKey);

        // Delete data
        await admin.from('bookings').delete().eq('userId', userId).catch(()=>{});
        await admin.from('credit_transactions').delete().eq('user_id', userId).catch(()=>{});
        await admin.from('membership_purchases').delete().eq('user_id', userId).catch(()=>{});
        await admin.from('customers_extended').delete().eq('id', userId).catch(()=>{});

        // Delete user
        const { error: delErr } = await admin.auth.admin.deleteUser(userId);

        if (delErr) {
            return reply(false, delErr.message);
        }

        // Send confirmation email
        try {
            const siteUrl = process.env.URL || 'https://dr7empire.com';
            await fetch(`${siteUrl}/.netlify/functions/send-deletion-confirmation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, fullName: userName })
            });
            console.log('Confirmation email sent to:', userEmail);
        } catch (emailErr) {
            console.error('Email error:', emailErr);
            // Continue even if email fails
        }

        return reply(true, 'Account deleted');

    } catch (err) {
        console.error(err);
        return reply(false, err.message || 'Error');
    }
};
