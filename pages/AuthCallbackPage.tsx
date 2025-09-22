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
      // 1) Échange le code OAuth présent dans l’URL contre une session
      const { error } = await supabase.auth.exchangeCodeForSession();
      if (error) {
        console.error('[OAuth] exchangeCodeForSession failed:', error.message);
        navigate('/signin', { replace: true, state: { error: 'Authentication failed. Please try again.' } });
        return;
      }

      // 2) Redirige où tu veux (selon rôle si tu veux)
      // Tu peux récupérer le user à nouveau si besoin :
      const { data: { user: freshUser } } = await supabase.auth.getUser();

      const destination =
        freshUser?.user_metadata?.role === 'business' ? '/partner/dashboard' : '/account';

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
