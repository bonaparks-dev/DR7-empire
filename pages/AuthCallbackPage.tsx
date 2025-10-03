import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // facultatif pour la redirection finale

  useEffect(() => {
    const run = async () => {
      console.log('[OAuth] Starting authentication callback...');

      // 1) Exchange the OAuth code in the URL for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession();
      if (error) {
        console.error('[OAuth] exchangeCodeForSession failed:', error);
        console.error('[OAuth] Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        navigate('/signin', {
          replace: true,
          state: {
            error: `Authentication failed: ${error.message}. Please check your Supabase OAuth configuration.`
          }
        });
        return;
      }

      console.log('[OAuth] Session exchange successful');

      // 2) Get fresh user data and redirect based on role
      const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser();

      if (userError || !freshUser) {
        console.error('[OAuth] Failed to get user:', userError);
        navigate('/signin', { replace: true, state: { error: 'Failed to retrieve user data.' } });
        return;
      }

      console.log('[OAuth] User retrieved:', freshUser.email, 'Role:', freshUser.user_metadata?.role);

      const destination =
        freshUser?.user_metadata?.role === 'business' ? '/partner/dashboard' : '/account';

      console.log('[OAuth] Redirecting to:', destination);
      navigate(destination, { replace: true });
    };

    run();
  }, [navigate]);

  // petit spinner
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
