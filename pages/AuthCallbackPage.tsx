import React from 'react';
import { motion } from 'framer-motion';

const AuthCallbackPage: React.FC = () => {
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
