import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * This component handles the client-side routing aspect of OAuth callbacks with HashRouter.
 * 1. A user is redirected from Supabase to the app root with tokens in the hash (e.g., /#access_token=...).
 * 2. The Supabase client library starts processing these tokens in the background on app load.
 * 3. HashRouter, not recognizing a path in the hash, renders the default route ('/').
 * 4. This component's effect runs, detects the token hash, and sees the path is still '/'.
 * 5. It navigates to '/auth/callback', showing the user the "Authenticating..." page while the
 *    Supabase client finishes its work and the onAuthStateChange event fires.
 */
const OAuthCallbackHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.hash.includes('access_token')) {
      if (location.pathname === '/') {
        navigate('/auth/callback', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return null;
};

export default OAuthCallbackHandler;
