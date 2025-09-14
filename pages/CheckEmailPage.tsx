import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Link } from 'react-router-dom';
import { MailIcon } from '../components/icons/Icons';

const CheckEmailPage: React.FC = () => {
  const { t } = useTranslation();

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
            <MailIcon className="w-16 h-16 mx-auto text-white" />
            <h2 className="text-3xl font-bold text-white">{t('Check_Your_Email')}</h2>
            <p className="mt-2 text-sm text-gray-400">
              {t('We_sent_a_confirmation_link_to_your_email_address_Please_click_the_link_to_confirm_your_account')}
            </p>
            <div className="mt-6">
              <Link
                to="/"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-gray-900 transition-colors"
              >
                {t('Back_to_Home')}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CheckEmailPage;
