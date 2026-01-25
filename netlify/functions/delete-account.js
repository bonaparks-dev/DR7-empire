const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Get the user's auth token from the Authorization header
        const authHeader = event.headers.authorization;
        if (!authHeader) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'No authorization header' }),
            };
        }

        // Create Supabase client with user's token
        const supabase = createClient(
            process.env.VITE_SUPABASE_URL,
            process.env.VITE_SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: authHeader,
                    },
                },
            }
        );

        // Call the delete_user RPC function
        const { error } = await supabase.rpc('delete_user');

        if (error) {
            console.error('Delete user error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Account deleted successfully' }),
        };
    } catch (error) {
        console.error('Server error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to delete account' }),
        };
    }
};
