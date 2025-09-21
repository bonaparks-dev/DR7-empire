import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const OAuthCallbackHandler: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handlePkceCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');

            // This effect should only run once when a code is present.
            if (code) {
                try {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) {
                        // If there's an error during exchange, log it and navigate to an error page or home.
                        console.error('Error exchanging code for session:', error.message);
                        navigate('/', { replace: true });
                        return;
                    }
                    
                    // On successful exchange, the `onAuthStateChange` listener in `AuthContext`
                    // will detect the new session and update the user state. The `AuthRedirector`
                    // component will then handle redirecting the user to their dashboard.
                    // Here, we simply clean up the URL by removing the query parameters.
                    navigate('/', { replace: true });

                } catch (error) {
                    console.error('A critical error occurred during code exchange:', error);
                    navigate('/', { replace: true });
                }
            }
        };
        
        handlePkceCallback();
    }, [navigate]);

    return null; // This component does not render any UI.
};

export default OAuthCallbackHandler;
