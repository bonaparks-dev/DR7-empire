import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';

const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) {
    return null; // Or a loading spinner, or a redirect
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg shadow-2xl shadow-black/50 p-8 space-y-6"
          >
            <h2 className="text-3xl font-bold text-white">{t('Your_Account')}</h2>
            <div className="text-left text-gray-300 space-y-2">
              <p>
                <span className="font-semibold text-white">{t('Email')}:</span> {user.email}
              </p>
              {user.user_metadata?.full_name && (
                <p>
                  <span className="font-semibold text-white">{t('Full_Name')}:</span> {user.user_metadata.full_name}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900 transition-colors"
            >
              {t('Logout')}
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AccountPage;
