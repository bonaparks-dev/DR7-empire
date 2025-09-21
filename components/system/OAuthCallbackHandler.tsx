
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const OAuthCallbackHandler: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handlePkceCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');

            if (code) {
                // Prevent the effect from running again with the same code
                // by cleaning the URL immediately. The final navigate call will
                // also clean it, but this is a safeguard.
                window.history.replaceState({}, document.title, window.location.pathname);
                
                try {
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                    
                    if (error) {
                        console.error('Error exchanging code for session:', error.message);
                        navigate('/', { replace: true });
                        return;
                    }

                    // If `data.session` is null, it means the user signed up via OAuth
                    // but email verification is required in the Supabase project settings.
                    if (data.user && !data.session) {
                        navigate('/check-email', { replace: true });
                    } else {
                        // If there is a session, it means either an existing user logged in,
                        // or a new user signed up and auto-confirmation is enabled.
                        // The onAuthStateChange listener in AuthContext will handle the session
                        // and the AuthRedirector will navigate to the correct dashboard page.
                        // We navigate to the base path to ensure the router re-evaluates.
                        navigate('/', { replace: true });
                    }

                } catch (error) {
                    console.error('A critical error occurred during code exchange:', error);
                    navigate('/', { replace: true });
                }
            }
        };
        
        handlePkceCallback();
    // This effect should run only once on component mount after the redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null; // This component does not render any UI.
};

export default OAuthCallbackHandler;
