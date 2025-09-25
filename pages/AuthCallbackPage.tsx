import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// FIX: Unused imports removed as auth logic is handled globally by AuthContext.
// import { supabase } from '../supabaseClient';
// import { useAuth } from '../hooks/useAuth';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // FIX: The explicit call to exchangeCodeForSession is removed.
    // For client-side OAuth, the Supabase client library automatically handles
    // exchanging the authorization code from the URL for a user session.
    // This triggers the onAuthStateChange listener in AuthContext, which then
    // allows the AuthRedirector component to navigate the user appropriately.
    // This page serves as a loading/interstitial view during this process.
  }, [navigate]);

  // This spinner is shown while the code is being exchanged for a session
  // and AuthContext is updating, before AuthRedirector navigates away.
  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="flex flex-col items-center text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-t-white border-gray-700 rounded-full mb-6"
        />
        <h1 className="text-3xl font-bold">Authenticating...</h1>
        <p className="text-gray-400 mt-2">Please wait while we securely sign you in.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
