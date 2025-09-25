import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Link } from 'react-router-dom';

const CheckEmailPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8 text-white"
    >
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg shadow-2xl shadow-black/50 p-8"
        >
          <h1 className="text-3xl font-bold mb-4">{t('Check_Your_Email')}</h1>
          <p className="mb-8 text-gray-300">
            {t('Weve_sent_a_verification_link_to_your_email')}
          </p>
          <Link
            to="/signin"
            className="font-medium text-white hover:text-gray-300 underline"
          >
            {t('Back_to_Sign_In')}
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CheckEmailPage;