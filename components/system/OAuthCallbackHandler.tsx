import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const OAuthCallbackHandler: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handlePkceCallback = async () => {
            // In a HashRouter setup, OAuth callback parameters might be in the hash.
            // The URL looks like: /#/signin?code=...
            // `useLocation` should correctly parse this, but we'll be robust.
            const hash = location.hash;
            const queryIndex = hash.indexOf('?');
            
            // Prefer params from hash if they exist, otherwise fallback to location.search
            const searchParamsString = queryIndex > -1 ? hash.substring(queryIndex) : location.search;

            const urlParams = new URLSearchParams(searchParamsString);
            const code = urlParams.get('code');

            if (code) {
                try {
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                    
                    if (error) {
                        console.error('Error exchanging code for session:', error.message);
                        // Navigate to sign-in page on error so user can retry
                        navigate('/signin', { replace: true });
                        return;
                    }

                    // If "Confirm email" is enabled for social providers, Supabase creates a user
                    // but doesn't return a session until the email is verified.
                    if (data.user && !data.session) {
                        navigate('/check-email', { replace: true });
                    } else {
                        // On successful login/signup, navigate to a clean root path.
                        // The AuthRedirector component will then handle redirecting to the correct dashboard.
                        navigate('/', { replace: true });
                    }

                } catch (error) {
                    console.error('A critical error occurred during code exchange:', error);
                    navigate('/signin', { replace: true });
                }
            }
        };
        
        handlePkceCallback();
    }, [location.search, location.hash, navigate]);

    return null; // This component does not render any UI.
};

export default OAuthCallbackHandler;
