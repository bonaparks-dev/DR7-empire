import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

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
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => handleConsent(true)}
          />

          {/* Centered cookie popup */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4"
            role="dialog"
            aria-live="polite"
            aria-label="Cookie consent"
          >
            <div className="bg-[#181818] border border-white/10 p-8 md:p-10">
              {/* Welcome message */}
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide mb-2">
                  WELCOME TO DR7 EMPIRE
                </h1>
                <div className="w-16 h-0.5 bg-white mx-auto" />
              </div>

              {/* Cookie message */}
              <div className="text-center mb-8">
                <h2 className="text-base font-semibold text-white mb-3 uppercase tracking-wider">
                  {t('cookie.title')}
                </h2>
                <p className="text-sm text-white/70 leading-relaxed mb-4">
                  {t('cookie.description')}{' '}
                  <Link to="/cookie-policy" className="text-white underline hover:text-white/90 transition-colors">
                    {t('Cookie_Policy')}
                  </Link>.
                </p>
                <p className="text-xs text-white/60 italic">
                  Entrando, confermi di avere più di 18 anni.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => handleConsent(false)}
                  className="px-8 py-3 border border-white text-white text-sm font-semibold uppercase tracking-widest transition-all duration-300 hover:bg-white hover:text-black"
                  style={{ backgroundColor: 'transparent' }}
                >
                  {t('cookie.decline')}
                </button>
                <button
                  onClick={() => handleConsent(true)}
                  className="px-8 py-3 border border-white text-sm font-semibold uppercase tracking-widest transition-all duration-300 hover:bg-transparent hover:text-white"
                  style={{ backgroundColor: 'white', color: 'black' }}
                >
                  {t('cookie.accept')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
