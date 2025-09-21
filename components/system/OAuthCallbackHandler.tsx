import React from 'react';

/**
 * This component handles the callback from OAuth providers like Google.
 * With modern Supabase JS client libraries (v2 and above), the client automatically
 * detects and processes authentication tokens (like access_token or a PKCE code)
 * present in the URL hash or query parameters upon page load.
 *
 * Once the client processes the token and establishes a session, it fires the
 * onAuthStateChange event. The listener for this event in AuthContext.tsx
 * then updates the application's user state.
 *
 * Therefore, a manual implementation to exchange a code for a session is no longer
 * necessary and can conflict with the client library's built-in behavior. This
 * component is left as a placeholder but performs no actions, relying on the
 * Supabase client and the AuthContext to handle the sign-in flow correctly.
 */
const OAuthCallbackHandler: React.FC = () => {
  return null; // This component does not render any UI.
};

export default OAuthCallbackHandler;
