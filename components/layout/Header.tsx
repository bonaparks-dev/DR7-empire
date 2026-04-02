import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
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
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [bookingPickupDate, setBookingPickupDate] = useState('');
  const [bookingPickupTime, setBookingPickupTime] = useState('10:00');
  const [bookingReturnDate, setBookingReturnDate] = useState('');
  const [bookingReturnTime, setBookingReturnTime] = useState('10:00');
  const [bookingPickupLocation, setBookingPickupLocation] = useState('dr7_office');
  const [bookingReturnLocation, setBookingReturnLocation] = useState('dr7_office');
  const [bookingSameReturn, setBookingSameReturn] = useState(true);
  const nav = useNavigate();

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
    'block py-3 pl-3 text-[15px] font-normal text-gray-400 hover:text-white transition-all duration-200 rounded-lg hover:bg-white/5';

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
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            onClick={onClose}
          />
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 bottom-0 w-full max-w-sm bg-[#0a0a0a] border-r border-white/10 shadow-2xl flex flex-col px-5 py-8 overflow-y-auto"
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

            <nav className="flex-grow flex flex-col space-y-5">
              {/* PRENOTA ORA */}
              <button
                onClick={() => setShowBookingPopup(true)}
                className="w-full py-3.5 bg-white text-black font-semibold text-base tracking-wide rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all duration-200"
              >
                Prenota Ora
              </button>

              {/* LA NOSTRA FLOTTA + OFFERTE ATTIVE */}
              <div className="flex flex-col items-center space-y-2 pb-5 border-b border-white/[0.06]">
                <NavLink to="/supercar-luxury" onClick={onClose} className="text-[13px] font-medium text-gray-400 hover:text-white tracking-widest uppercase transition-all duration-200">
                  La Nostra Flotta
                </NavLink>
                <NavLink to="/membership" onClick={onClose} className="text-[13px] font-medium text-gray-400 hover:text-white tracking-widest uppercase transition-all duration-200">
                  Offerte Attive
                </NavLink>
              </div>

              {/* SERVIZI & MOBILITÀ DI LUSSO */}
              <div className="border-b border-white/[0.06] pb-5">
                <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2 pl-3">
                  Servizi & Mobilità di Lusso
                </h3>
                <div className="space-y-1">
                  <NavLink to="/supercar-luxury" onClick={onClose} className={navLinkClasses}>
                    <span>Supercar & Luxury Division</span>
                  </NavLink>
                  <NavLink to="/urban" onClick={onClose} className={navLinkClasses}>
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

              {/* ESPERIENZE & ACCESSO ESCLUSIVO */}
              <div className="border-b border-white/[0.06] pb-5">
                <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2 pl-3">
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
                        <span className="ml-2 px-3 py-0.5 bg-gray-800 border border-gray-700 rounded-full text-white text-xs font-bold">
                          {isLoadingBalance ? '...' : `€${creditBalance.toFixed(2)}`}
                        </span>
                      )}
                    </span>
                  </NavLink>
                </div>
              </div>

              {/* PRIME WASH */}
              <div className="border-b border-white/[0.06] pb-5">
                <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2 pl-3">
                  Prime Wash
                </h3>
                <div className="space-y-1">
                  <NavLink to="/prime-wash" onClick={onClose} className={navLinkClasses}>
                    <span>Detailing & Wash</span>
                  </NavLink>
                  <NavLink to="/prime-wash#mechanical" onClick={onClose} className={navLinkClasses}>
                    <span>Mechanical & Body Repair</span>
                  </NavLink>
                  <NavLink to="/prime-wash#courtesy" onClick={onClose} className={navLinkClasses}>
                    <span>Courtesy Car Service</span>
                  </NavLink>
                </div>
              </div>

              {/* BUSINESS & CORPORATE */}
              <div className="border-b border-white/[0.06] pb-5">
                <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2 pl-3">
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

              {/* DIGITAL INNOVATION */}
              <div className="border-b border-white/[0.06] pb-5">
                <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2 pl-3">
                  Digital Innovation
                </h3>
                <div className="space-y-1">
                  <NavLink to="/token" onClick={onClose} className={navLinkClasses}>
                    <span>Digital Asset & Token Division</span>
                  </NavLink>
                </div>
              </div>

              {/* CONTATTACI */}
              <div className="pt-2">
                <NavLink to="/contact" onClick={onClose} className="block py-3 text-center text-[13px] font-medium text-gray-400 hover:text-white tracking-widest uppercase rounded-lg hover:bg-white/5 transition-all duration-200">
                  Contattaci
                </NavLink>
              </div>
            </nav>

            {/* Old popup location removed — moved outside scroll container */}
            <AnimatePresence>
              {false && showBookingPopup && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
                  onClick={() => setShowBookingPopup(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setShowBookingPopup(false)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-white p-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <h3 className="text-xl font-semibold text-white text-center mb-1">Prenota Ora</h3>
                    <p className="text-gray-500 text-sm text-center mb-6">Seleziona luogo, date e orari</p>

                    <div className="space-y-4">
                      {/* Pickup location */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Luogo di ritiro</label>
                        <select
                          value={bookingPickupLocation}
                          onChange={(e) => {
                            setBookingPickupLocation(e.target.value);
                            if (bookingSameReturn) setBookingReturnLocation(e.target.value);
                          }}
                          className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                        >
                          {PICKUP_LOCATIONS.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.label.it}</option>
                          ))}
                        </select>
                      </div>

                      {/* Same return location toggle */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bookingSameReturn}
                          onChange={(e) => {
                            setBookingSameReturn(e.target.checked);
                            if (e.target.checked) setBookingReturnLocation(bookingPickupLocation);
                          }}
                          className="w-4 h-4 rounded bg-[#2c2c2e] border-white/20"
                        />
                        <span className="text-sm text-gray-400">Riconsegna nello stesso luogo</span>
                      </label>

                      {/* Return location (if different) */}
                      {!bookingSameReturn && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Luogo di riconsegna</label>
                          <select
                            value={bookingReturnLocation}
                            onChange={(e) => setBookingReturnLocation(e.target.value)}
                            className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                          >
                            {PICKUP_LOCATIONS.map(loc => (
                              <option key={loc.id} value={loc.id}>{loc.label.it}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Pickup date + time */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Ritiro</label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={bookingPickupDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => {
                              setBookingPickupDate(e.target.value);
                              if (!bookingReturnDate || e.target.value > bookingReturnDate) {
                                const next = new Date(e.target.value);
                                next.setDate(next.getDate() + 1);
                                setBookingReturnDate(next.toISOString().split('T')[0]);
                              }
                            }}
                            className="flex-1 bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                          />
                          <select
                            value={bookingPickupTime}
                            onChange={(e) => setBookingPickupTime(e.target.value)}
                            className="w-24 bg-[#2c2c2e] border border-white/10 rounded-xl px-2 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                          >
                            {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2,'0')}:00`, `${String(h).padStart(2,'0')}:30`]).flat().map(t => (
                              <option key={`p-${t}`} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Return date + time */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Restituzione</label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={bookingReturnDate}
                            min={bookingPickupDate || new Date().toISOString().split('T')[0]}
                            onChange={(e) => setBookingReturnDate(e.target.value)}
                            className="flex-1 bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                          />
                          <select
                            value={bookingReturnTime}
                            onChange={(e) => setBookingReturnTime(e.target.value)}
                            className="w-24 bg-[#2c2c2e] border border-white/10 rounded-xl px-2 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                          >
                            {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2,'0')}:00`, `${String(h).padStart(2,'0')}:30`]).flat().map(t => (
                              <option key={`r-${t}`} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Days count badge */}
                      {bookingPickupDate && bookingReturnDate && (
                        <div className="text-center">
                          <span className="inline-block px-3 py-1 bg-[#2c2c2e] border border-white/10 rounded-full text-sm text-gray-300">
                            {Math.max(1, Math.ceil((new Date(bookingReturnDate).getTime() - new Date(bookingPickupDate).getTime()) / (1000 * 60 * 60 * 24)))} giorni
                          </span>
                        </div>
                      )}

                      {/* Search button */}
                      <button
                        onClick={() => {
                          if (bookingPickupDate && bookingReturnDate) {
                            setShowBookingPopup(false);
                            onClose();
                            const params = new URLSearchParams({
                              pickup: bookingPickupDate,
                              pickupTime: bookingPickupTime,
                              return: bookingReturnDate,
                              returnTime: bookingReturnTime,
                              pickupLoc: bookingPickupLocation,
                              returnLoc: bookingReturnLocation,
                            });
                            nav(`/supercar-luxury?${params.toString()}`);
                          }
                        }}
                        disabled={!bookingPickupDate || !bookingReturnDate}
                        className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200 ${
                          bookingPickupDate && bookingReturnDate
                            ? 'bg-white text-black hover:bg-gray-100 active:scale-[0.98]'
                            : 'bg-[#2c2c2e] text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Cerca Auto Disponibili
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

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

          {/* PRENOTA ORA POPUP — outside scroll container for proper z-index */}
          <AnimatePresence>
            {showBookingPopup && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
                onClick={() => setShowBookingPopup(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setShowBookingPopup(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white p-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <h3 className="text-xl font-semibold text-white text-center mb-1">Prenota Ora</h3>
                  <p className="text-gray-500 text-sm text-center mb-6">Seleziona luogo, date e orari</p>

                  <div className="space-y-4">
                    {/* Pickup location */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Luogo di ritiro</label>
                      <select
                        value={bookingPickupLocation}
                        onChange={(e) => {
                          setBookingPickupLocation(e.target.value);
                          if (bookingSameReturn) setBookingReturnLocation(e.target.value);
                        }}
                        className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                      >
                        {PICKUP_LOCATIONS.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.label.it}</option>
                        ))}
                      </select>
                    </div>

                    {/* Same return toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bookingSameReturn}
                        onChange={(e) => {
                          setBookingSameReturn(e.target.checked);
                          if (e.target.checked) setBookingReturnLocation(bookingPickupLocation);
                        }}
                        className="w-4 h-4 rounded bg-[#2c2c2e] border-white/20"
                      />
                      <span className="text-sm text-gray-400">Riconsegna nello stesso luogo</span>
                    </label>

                    {/* Return location */}
                    {!bookingSameReturn && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Luogo di riconsegna</label>
                        <select
                          value={bookingReturnLocation}
                          onChange={(e) => setBookingReturnLocation(e.target.value)}
                          className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                        >
                          {PICKUP_LOCATIONS.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.label.it}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Pickup */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Ritiro</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={bookingPickupDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => {
                            setBookingPickupDate(e.target.value);
                            if (!bookingReturnDate || e.target.value > bookingReturnDate) {
                              const next = new Date(e.target.value);
                              next.setDate(next.getDate() + 1);
                              setBookingReturnDate(next.toISOString().split('T')[0]);
                            }
                          }}
                          className="flex-1 bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                        />
                        <select
                          value={bookingPickupTime}
                          onChange={(e) => setBookingPickupTime(e.target.value)}
                          className="w-24 bg-[#2c2c2e] border border-white/10 rounded-xl px-2 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                        >
                          {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2,'0')}:00`, `${String(h).padStart(2,'0')}:30`]).flat().map(t => (
                            <option key={`p2-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Return */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Restituzione</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={bookingReturnDate}
                          min={bookingPickupDate || new Date().toISOString().split('T')[0]}
                          onChange={(e) => setBookingReturnDate(e.target.value)}
                          className="flex-1 bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                        />
                        <select
                          value={bookingReturnTime}
                          onChange={(e) => setBookingReturnTime(e.target.value)}
                          className="w-24 bg-[#2c2c2e] border border-white/10 rounded-xl px-2 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
                        >
                          {Array.from({ length: 24 }, (_, h) => [`${String(h).padStart(2,'0')}:00`, `${String(h).padStart(2,'0')}:30`]).flat().map(t => (
                            <option key={`r2-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Days badge */}
                    {bookingPickupDate && bookingReturnDate && (
                      <div className="text-center">
                        <span className="inline-block px-3 py-1 bg-[#2c2c2e] border border-white/10 rounded-full text-sm text-gray-300">
                          {Math.max(1, Math.ceil((new Date(bookingReturnDate).getTime() - new Date(bookingPickupDate).getTime()) / (1000 * 60 * 60 * 24)))} giorni
                        </span>
                      </div>
                    )}

                    {/* Search */}
                    <button
                      onClick={() => {
                        if (bookingPickupDate && bookingReturnDate) {
                          setShowBookingPopup(false);
                          onClose();
                          const params = new URLSearchParams({
                            pickup: bookingPickupDate,
                            pickupTime: bookingPickupTime,
                            return: bookingReturnDate,
                            returnTime: bookingReturnTime,
                            pickupLoc: bookingPickupLocation,
                            returnLoc: bookingReturnLocation,
                          });
                          nav(`/supercar-luxury?${params.toString()}`);
                        }
                      }}
                      disabled={!bookingPickupDate || !bookingReturnDate}
                      className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200 ${
                        bookingPickupDate && bookingReturnDate
                          ? 'bg-white text-black hover:bg-gray-100 active:scale-[0.98]'
                          : 'bg-[#2c2c2e] text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Cerca Auto Disponibili
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
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

  // Fetch credit balance when user is logged in + refresh on navigation/focus
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
        setCreditBalance(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    // Fetch on mount
    const timer = setTimeout(fetchBalance, 500);

    // Re-fetch when user returns to tab or navigates
    const handleFocus = () => fetchBalance();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', handleFocus);
    };
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
