import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const OAuthCallbackHandler: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // The URL from the OAuth provider will be like: /#/signin?code=...
        // We need to extract the 'code' from the URL's hash fragment.
        const hash = location.hash;
        
        // Check if there are parameters in the hash
        if (!hash.includes('?')) {
            return;
        }

        const searchParams = new URLSearchParams(hash.substring(hash.indexOf('?')));
        const code = searchParams.get('code');

        // Supabase client also looks for an 'error' parameter
        const error = searchParams.get('error');
        if (error) {
            console.error('OAuth callback error:', searchParams.get('error_description') || error);
            navigate('/signin', { replace: true, state: { error: 'Authentication failed. Please try again.' } });
            return;
        }

        if (code) {
            // A code was found, exchange it for a session
            const exchangeCode = async () => {
                const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

                if (exchangeError) {
                    console.error('Error exchanging code for session:', exchangeError.message);
                    // Navigate to sign-in page on error so user can retry, showing an error
                    navigate('/signin', { replace: true, state: { error: exchangeError.message } });
                    return;
                }

                // If Supabase requires email confirmation for social providers,
                // a user is created but a session is not returned immediately.
                if (data.user && !data.session) {
                    navigate('/check-email', { replace: true });
                } else {
                    // On successful login, navigate to a clean root path.
                    // This clears the code from the URL.
                    // The main AuthRedirector component will then handle redirecting
                    // the user to their appropriate dashboard page.
                    navigate('/', { replace: true });
                }
            };

            exchangeCode();
        }
    }, [location.hash, navigate]);

    return null; // This component does not render any UI.
};

export default OAuthCallbackHandler;
