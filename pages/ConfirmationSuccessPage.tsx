import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CheckCircleIcon } from '../components/icons/Icons';
import { Button } from '../components/ui/Button';

const ConfirmationSuccessPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
    // Render nothing while auth state is resolving
    return null;
  }

  if (!user) {
    // If auth state is resolved and there's no user, they shouldn't be here.
    return <Navigate to="/signin" replace />;
  }

  const destination = user.role === 'business' ? '/partner/dashboard' : '/account';

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
          <div className="w-20 h-20 bg-green-500/20 text-green-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold mb-4">{t('Email_Confirmed')}</h1>
          <p className="mb-8 text-gray-300">
            {t('Account_Successfully_Created')}
          </p>
          <Button as={Link} to={destination} variant="primary" size="lg">
            {t('Proceed_to_My_Account')}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ConfirmationSuccessPage;
