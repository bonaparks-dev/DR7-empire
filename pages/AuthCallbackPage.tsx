import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AuthCallbackPage: React.FC = () => {
  const { user, loading, isFirstSignIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (user) {
      if (isFirstSignIn === true) {
        // This is a new user who just confirmed their email.
        // Redirect them to the success page for clear feedback.
        navigate('/confirmation-success', { replace: true });
      } else {
        // This is a returning user signing in via OAuth.
        // Redirect them to their dashboard.
        const destination = user.role === 'business' ? '/partner/dashboard' : '/account';
        navigate(destination, { replace: true });
      }
    } else {
      // If there's no user after loading, authentication might have failed.
      navigate('/signin', { replace: true, state: { error: 'Authentication failed. Please try again.' } });
    }
  }, [user, loading, isFirstSignIn, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="flex flex-col items-center text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-t-white border-gray-700 rounded-full mb-6"
        />
        <h1 className="text-3xl font-bold">Authenticating...</h1>
        <p className="text-gray-400 mt-2">Please wait while we securely sign you in.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
