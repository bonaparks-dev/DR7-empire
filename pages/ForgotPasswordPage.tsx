import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ForgotPasswordPage: React.FC = () => {
  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Forgot Password</h1>
        <p className="mb-8">This feature is coming soon.</p>
        <Link to="/signin" className="font-medium text-white hover:text-gray-300 underline">
            Back to Sign In
        </Link>
      </div>
    </motion.div>
  );
};

export default ForgotPasswordPage;
