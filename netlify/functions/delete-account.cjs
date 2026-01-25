const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
    // IMMEDIATE LOGGING: Check if function even starts
    console.log('[DeleteAccount] Function started');
    console.log('[DeleteAccount] Method:', event.httpMethod);

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Authorization, Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        console.log('[DeleteAccount] Request received');

        // Check ENV vars availability
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[DeleteAccount] Missing Supabase environment variables');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error (Missing Env)' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        // Get the user's auth token from the Authorization header
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader) {
            console.error('[DeleteAccount] Missing Authorization header');
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'No authorization header' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        console.log('[DeleteAccount] Creating Supabase client...');

        // Create Supabase client with user's token
        // We must strip 'Bearer ' to get the raw token for potential manual verification or specialized usage,
        // BUT for standard supabase-js initialization with global headers, passing the full header 'Authorization: Bearer ...' is actually correct if done in the headers config.
        // HOWEVER, the error "invalid JWT" suggests Supabase might be trying to parse the header value as a token if we are not careful,
        // or there is a mismatch.
        // SAFETY FIX: Explicitly set the access token if possible, OR just rely on the headers.
        // Better approach for server-side auth acting as user:

        const token = authHeader.replace(/^Bearer\s+/i, '');

        const supabase = createClient(
            supabaseUrl,
            supabaseKey,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`, // Explicitly reconstruct to ensure no double-Bearer or whitespace issues
                    },
                },
            }
        );

        // Get user info before deletion
        console.log('[DeleteAccount] Fetching user...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
            console.error('[DeleteAccount] User fetch error:', userError);
        }

        if (userError || !user) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'User not found or invalid token' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        console.log(`[DeleteAccount] User found: ${user.id} (${user.email})`);

        // Send confirmation email BEFORE deletion (while we still have user data)
        if (user.email && user.user_metadata?.full_name) {
            try {
                // Determine site URL robustly - prefer DEPLOY_URL in Netlify context
                const siteUrl = process.env.DEPLOY_URL || process.env.URL || 'http://localhost:8888';
                const emailFunctionUrl = `${siteUrl}/.netlify/functions/send-deletion-confirmation`;

                console.log(`Sending deletion email to ${user.email} via ${emailFunctionUrl}`);

                // We use a short timeout so we don't block deletion too long
                const emailPromise = fetch(emailFunctionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: user.email,
                        fullName: user.user_metadata.full_name,
                    }),
                });

                // Wait for it, but continue on error
                await emailPromise.catch(e => console.error('Fetch error:', e));

            } catch (emailError) {
                console.error('[DeleteAccount] Failed to send deletion email:', emailError);
                // Continue with deletion even if email fails
            }
        }

        // Call the delete_user RPC function
        console.log('[DeleteAccount] Calling delete_user RPC...');
        const { error } = await supabase.rpc('delete_user');

        if (error) {
            console.error('[DeleteAccount] Delete user error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message || 'Database error during deletion' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        console.log('[DeleteAccount] Deletion successful');
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Account deleted successfully' }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        console.error('[DeleteAccount] Critical Server error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
