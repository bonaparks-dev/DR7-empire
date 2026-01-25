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


        // Get user info before deletion
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'User not found' }),
            };
        }

        // Send confirmation email BEFORE deletion (while we still have user data)
        if (user.email && user.user_metadata?.full_name) {
            try {
                // Determine site URL robustly - prefer DEPLOY_URL in Netlify context
                const siteUrl = process.env.DEPLOY_URL || process.env.URL || 'http://localhost:8888';
                const emailFunctionUrl = `${siteUrl}/.netlify/functions/send-deletion-confirmation`;

                console.log(`Sending deletion email to ${user.email} via ${emailFunctionUrl}`);

                await fetch(emailFunctionUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user.email,
                        fullName: user.user_metadata.full_name,
                    }),
                });
            } catch (emailError) {
                console.error('Failed to send deletion email:', emailError);
                // Continue with deletion even if email fails
            }
        }

        // Call the delete_user RPC function
        const { error } = await supabase.rpc('delete_user');

        if (error) {
            console.error('Delete user error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message || 'Database error' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Account deleted successfully' }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        console.error('Server error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
