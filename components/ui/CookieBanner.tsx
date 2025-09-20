import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from './Button';
import { CookieIcon } from '../icons/Icons';

const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const consent = localStorage.getItem('dr7-cookie-consent');
    if (consent === null) {
      // Delay showing the banner slightly to avoid layout shift on load
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (consent: boolean) => {
    localStorage.setItem('dr7-cookie-consent', String(consent));
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
        >
          <div className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
                <CookieIcon className="w-10 h-10 text-white" />
            </div>
            <div className="flex-grow text-center md:text-left">
                <h2 className="text-lg font-bold text-white mb-1">{t('cookie.title')}</h2>
                <p className="text-sm text-gray-300">
                    {t('cookie.description')}{' '}
                    <Link to="/cookie-policy" className="underline hover:text-white font-semibold">
                        {t('Cookie_Policy')}
                    </Link>.
                </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-4 w-full md:w-auto">
                <Button variant="outline" size="sm" onClick={() => handleConsent(false)} className="w-full">
                    {t('cookie.decline')}
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleConsent(true)} className="w-full">
                    {t('cookie.accept')}
                </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
