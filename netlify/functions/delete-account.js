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
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST only' }) };
    }

    try {
        const { userId } = JSON.parse(event.body || '{}');

        if (!userId) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'User ID required' }) };
        }

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
        }

        const admin = createClient('https://ahpmzjgkfxrrgxyirasa.supabase.co', serviceKey);

        // Delete ALL user data from all tables
        try { await admin.from('bookings').delete().eq('userId', userId); } catch(e) {}
        try { await admin.from('credit_transactions').delete().eq('user_id', userId); } catch(e) {}
        try { await admin.from('membership_purchases').delete().eq('user_id', userId); } catch(e) {}
        try { await admin.from('customers_extended').delete().eq('user_id', userId); } catch(e) {}
        try { await admin.from('user_credit_balance').delete().eq('user_id', userId); } catch(e) {}
        try { await admin.from('user_documents').delete().eq('user_id', userId); } catch(e) {}
        try { await admin.from('aviation_quotes').delete().eq('user_id', userId); } catch(e) {}
        try { await admin.from('credit_wallet_purchases').delete().eq('user_id', userId); } catch(e) {}
        try { await admin.from('commercial_operation_tickets').delete().eq('user_id', userId); } catch(e) {}

        // Delete user files from storage
        try {
            await admin.storage.from('driver-licenses').remove([`${userId}`]);
            await admin.storage.from('carta-identita').remove([`${userId}`]);
        } catch(e) {}

        // Delete user account
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
