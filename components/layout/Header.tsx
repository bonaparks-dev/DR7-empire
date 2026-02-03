import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { RENTAL_CATEGORIES } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { CogIcon, SignOutIcon } from '../icons/Icons';
import { getUserCreditBalance } from '../../utils/creditWallet';

const NavigationMenu: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

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

  // Fetch credit balance when menu opens (with debounce to prevent rapid calls)
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const fetchBalance = async () => {
      setIsLoadingBalance(true);
      try {
        const balance = await getUserCreditBalance(user.id);
        setCreditBalance(balance);
      } catch (error) {
        console.error('Error fetching credit balance:', error);
        setCreditBalance(0); // Set to 0 on error to stop retries
      } finally {
        setIsLoadingBalance(false);
      }
    };

    // Debounce: only fetch after 300ms of menu being open
    const timer = setTimeout(fetchBalance, 300);
    return () => clearTimeout(timer);
  }, [isOpen, user?.id]);

  const navLinkClasses =
    'block py-2.5 text-base font-normal text-gray-300 hover:text-white transition-colors duration-300';

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
            {/* Logo centered at top */}
            <div className="flex flex-col items-center mb-8">
              <NavLink to="/" onClick={onClose} className="mb-6">
                <img src="/DR7logo1.png" alt="DR7 Empire Logo" className="h-14 md:h-16 w-auto" />
              </NavLink>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800"
              >

              </button>
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

            <nav className="flex-grow flex flex-col space-y-6">
              {/* ESPERIENZE & ACCESSO ESCLUSIVO */}
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3 px-1">
                  Esperienze & Accesso Esclusivo
                </h3>
                <div className="space-y-1">
                  <NavLink to="/membership" onClick={onClose} className={navLinkClasses}>
                    <span>Exclusive Members Club</span>
                  </NavLink>
                  <NavLink to="/credit-wallet" onClick={onClose} className={navLinkClasses}>
                    <span className="flex items-center justify-between w-full">
                      <span>DR7 Credit Wallet</span>
                      {user && (
                        <span className="text-white font-bold ml-2">
                          {isLoadingBalance ? '...' : `€${creditBalance.toFixed(2)}`}
                        </span>
                      )}
                    </span>
                  </NavLink>
                </div>
              </div>


              {/* BUSINESS & CORPORATE */}
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3 px-1">
                  Business & Corporate
                </h3>
                <div className="space-y-1">
                  <NavLink to="/franchising" onClick={onClose} className={navLinkClasses}>
                    <span>Global Franchising</span>
                  </NavLink>
                  <NavLink to="/investitori" onClick={onClose} className={navLinkClasses}>
                    <span>Investor Relations</span>
                  </NavLink>
                </div>
              </div>

              {/* SERVIZI & MOBILITÀ DI LUSSO */}
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3 px-1">
                  Servizi & Mobilità di Lusso
                </h3>
                <div className="space-y-1">
                  <NavLink to="/cars" onClick={onClose} className={navLinkClasses}>
                    <span>Supercar & Luxury Division</span>
                  </NavLink>
                  <NavLink to="/urban-cars" onClick={onClose} className={navLinkClasses}>
                    <span>Urban Mobility Division</span>
                  </NavLink>
                  <NavLink to="/corporate-fleet" onClick={onClose} className={navLinkClasses}>
                    <span>Corporate & Utility Fleet</span>
                  </NavLink>
                  <NavLink to="/yachts" onClick={onClose} className={navLinkClasses}>
                    <span>Yachting Division</span>
                  </NavLink>
                  <NavLink to="/jets" onClick={onClose} className={navLinkClasses}>
                    <span>Aviation Division</span>
                  </NavLink>
                </div>
              </div>

              {/* PRIME WASH */}
              <div>
                <NavLink to="/car-wash-services" onClick={onClose}>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3 px-1 hover:text-gray-300 transition-colors">
                    Prime Wash
                  </h3>
                </NavLink>
                <div className="space-y-1">
                  <NavLink to="/car-wash-services" onClick={onClose} className={navLinkClasses}>
                    <span>Detailing & Wash</span>
                  </NavLink>
                  <NavLink to="/car-wash-services#mechanical" onClick={onClose} className={navLinkClasses}>
                    <span>Mechanical & Body Repair</span>
                  </NavLink>
                  <NavLink to="/car-wash-services#courtesy" onClick={onClose} className={navLinkClasses}>
                    <span>Courtesy Car Service</span>
                  </NavLink>
                </div>
              </div>

              {/* DIGITAL INNOVATION */}
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-3 px-1">
                  Digital Innovation
                </h3>
                <div className="space-y-1">
                  <NavLink to="/token" onClick={onClose} className={navLinkClasses}>
                    <span>Digital Asset & Token Division</span>
                  </NavLink>
                </div>
              </div>
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
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch credit balance when user is logged in (with debounce)
  useEffect(() => {
    if (!user?.id) {
      setCreditBalance(0);
      return;
    }

    const fetchBalance = async () => {
      setIsLoadingBalance(true);
      try {
        const balance = await getUserCreditBalance(user.id);
        setCreditBalance(balance);
      } catch (error) {
        console.error('Error fetching credit balance:', error);
        setCreditBalance(0); // Set to 0 on error to stop retries
      } finally {
        setIsLoadingBalance(false);
      }
    };

    // Debounce: wait 500ms before fetching to avoid rapid calls
    const timer = setTimeout(fetchBalance, 500);
    return () => clearTimeout(timer);
  }, [user?.id]);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled
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
              className="text-white hover:text-gray-300 font-normal text-sm tracking-wider transition-colors"
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
                    to="/credit-wallet"
                    className="flex items-center gap-2 bg-black text-white px-3 md:px-4 py-2 rounded-full font-bold text-xs hover:bg-gray-900 transition-colors border border-gray-700"
                  >
                    <span className="hidden md:inline">Credit Wallet</span>
                    <span className="bg-black text-white px-2 py-0.5 rounded-full text-xs">
                      {isLoadingBalance ? '...' : `€${creditBalance.toFixed(2)}`}
                    </span>
                  </Link>
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
