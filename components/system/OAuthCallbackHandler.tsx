import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const OAuthCallbackHandler: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handlePkceCallback = async () => {
            const urlParams = new URLSearchParams(location.search);
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

                    // If user exists but no session, email verification is likely required
                    if (data.user && !data.session) {
                        navigate('/check-email', { replace: true });
                    } else {
                        // On successful login/signup, navigate to root.
                        // The AuthRedirector component will handle redirecting to the correct dashboard.
                        navigate('/', { replace: true });
                    }

                } catch (error) {
                    console.error('A critical error occurred during code exchange:', error);
                    navigate('/signin', { replace: true });
                }
            }
        };
        
        handlePkceCallback();
    // This effect should run when the search params in the URL change (i.e., when the code arrives)
    }, [location.search, navigate]);

    return null; // This component does not render any UI.
};

export default OAuthCallbackHandler;