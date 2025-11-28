import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { RENTAL_CATEGORIES } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuIcon, XIcon, UsersIcon, SignOutIcon, CogIcon } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';

const NavigationMenu: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const navLinkClasses =
    'block py-2.5 text-xl font-semibold text-gray-300 hover:text-white transition-colors duration-300';

  const handleLogout = () => {
    logout();
    onClose();
  };

  const accountLink = user?.role === 'business' ? '/partner/dashboard' : '/account';
  const accountLabel = user?.role === 'business' ? t('Partner_Dashboard') : t('My_Account');
  const userFullName = user?.fullName || 'User';

  const menuVariants = {
    hidden: { x: '-100%' },
    visible: { x: 0 },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 bottom-0 w-full max-w-sm bg-black border-r border-gray-800 shadow-2xl flex flex-col p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-12">
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800"
              >
                <XIcon className="w-6 h-6" />
              </button>
              <NavLink to="/" onClick={onClose}>
                <img src="/DR7logo1.png" alt="DR7 Empire Logo" className="h-10 w-auto" />
              </NavLink>
            </div>

            {/* Sign In/Sign Up Button at Top (when not logged in) */}
            {!user && (
              <div className="mb-6 pb-6 border-b border-gray-800">
                <Link
                  to="/signin"
                  onClick={onClose}
                  className="flex items-center justify-center w-full bg-white text-black py-4 rounded-full font-bold text-base hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {t('Sign_In')}
                </Link>
                <p className="text-center text-xs text-gray-400 mt-3">
                  {t('New_here')}? <Link to="/signin" onClick={onClose} className="text-white underline hover:text-gray-300">{t('Create_account')}</Link>
                </p>
              </div>
            )}

            <nav className="flex-grow flex flex-col space-y-1">
              <NavLink to="/cars" onClick={onClose} className={navLinkClasses}>
                <span>DR7 Supercar & Luxury Division</span>
              </NavLink>
              <NavLink to="/urban-cars" onClick={onClose} className={navLinkClasses}>
                <span>DR7 Urban Mobility Division</span>
              </NavLink>
              <NavLink to="/corporate-fleet" onClick={onClose} className={navLinkClasses}>
                <span>DR7 Corporate & Utility Fleet Division</span>
              </NavLink>
              <NavLink to="/yachts" onClick={onClose} className={navLinkClasses}>
                <span>DR7 Yachting Division</span>
              </NavLink>
              <NavLink to="/jets" onClick={onClose} className={navLinkClasses}>
                <span>DR7 Aviation Division</span>
              </NavLink>
              <NavLink to="/car-wash-services" onClick={onClose} className={navLinkClasses}>
                <span>DR7 Luxury Care Services</span>
              </NavLink>
              <NavLink to="/mechanical-services" onClick={onClose} className={navLinkClasses}>
                <span>DR7 Rapid Response Services</span>
              </NavLink>
              <NavLink to="/membership" onClick={onClose} className={navLinkClasses}>
                <span>DR7 Exclusive Members Club</span>
              </NavLink>
              <NavLink to="/commercial-operation" onClick={onClose} className={navLinkClasses}>
                <span>DR7 Official Lottery</span>
              </NavLink>
              <NavLink to="/franchising" onClick={onClose} className={navLinkClasses}>
                <span>DR7 Global Franchising</span>
              </NavLink>
              <NavLink to="/investitori" onClick={onClose} className={navLinkClasses}>
                <span>DR7 Investor Relations Office</span>
              </NavLink>
              <NavLink to="/token" onClick={onClose} className={navLinkClasses}>
                <span>DR7 Digital Asset & Token Division</span>
              </NavLink>
            </nav>

            <div className="mt-auto pt-8 border-t border-gray-800">
              {user && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                      {userFullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{userFullName}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    to={accountLink}
                    onClick={onClose}
                    className="flex items-center justify-center w-full bg-gray-800 text-white py-3 rounded-full font-bold text-sm hover:bg-gray-700"
                  >
                    {accountLabel}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center w-full bg-gray-200 text-black py-3 rounded-full font-bold text-sm hover:bg-white"
                  >
                    {t('Sign_Out')}
                  </button>
                </div>
              )}
              <div className={`flex justify-between items-center ${user ? 'mt-6' : ''}`}>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-black/50 backdrop-blur-lg border-b border-gray-800'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* EXPLORE menu button on the left */}
          <div className="flex items-center">
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              className="text-white hover:text-gray-300 font-bold text-lg tracking-wider transition-colors"
            >
              EXPLORE
            </button>
          </div>

          {/* Logo centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <NavLink to="/" className="flex items-center">
              <img src="/DR7logo1.png" alt="DR7 Empire Logo" className="h-14 md:h-16 w-auto" />
            </NavLink>
          </div>

          {/* User controls on the right */}
          <div className="flex items-center space-x-4">
            <AnimatePresence mode="wait">
              {user ? (
                <motion.div
                  key="user-controls"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center space-x-3"
                >
                  <Link
                    to={user.role === 'business' ? '/partner/dashboard' : '/account'}
                    className="hidden md:flex items-center justify-center w-9 h-9 bg-gray-800/70 border border-gray-700 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    title={
                      user.role === 'business' ? t('Partner_Dashboard') : t('My_Account')
                    }
                  >
                    <CogIcon className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={logout}
                    className="hidden md:flex items-center justify-center w-9 h-9 bg-gray-800/70 border border-gray-700 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    title={t('Sign_Out')}
                  >
                    <SignOutIcon className="w-5 h-5" />
                  </button>
                </motion.div>
              ) : (
                <Link
                  to="/signin"
                  className="hidden md:block bg-white text-black px-5 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  {t('Sign_In')}
                </Link>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      <NavigationMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default Header;
