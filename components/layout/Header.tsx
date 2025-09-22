import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTranslation } from '../../hooks/useTranslation';
import { RENTAL_CATEGORIES } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuIcon, XIcon, UsersIcon, SignOutIcon, TicketIcon, StarIcon } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center border border-gray-700 rounded-full p-1">
            <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-1 text-sm rounded-full transition-colors duration-300 ${language === 'en' ? 'bg-white text-black' : 'text-gray-300 hover:bg-gray-800'}`}
            >
                EN
            </button>
            <button
                onClick={() => setLanguage('it')}
                className={`px-4 py-1 text-sm rounded-full transition-colors duration-300 ${language === 'it' ? 'bg-white text-black' : 'text-gray-300 hover:bg-gray-800'}`}
            >
                IT
            </button>
        </div>
    );
};

const CurrencySwitcher: React.FC = () => {
    const { currency, setCurrency } = useCurrency();

    return (
        <div className="flex items-center border border-gray-700 rounded-full p-1">
            <button
                onClick={() => setCurrency('usd')}
                className={`px-4 py-1 text-sm rounded-full transition-colors duration-300 ${currency === 'usd' ? 'bg-white text-black' : 'text-gray-300 hover:bg-gray-800'}`}
            >
                USD
            </button>
            <button
                onClick={() => setCurrency('eur')}
                className={`px-4 py-1 text-sm rounded-full transition-colors duration-300 ${currency === 'eur' ? 'bg-white text-black' : 'text-gray-300 hover:bg-gray-800'}`}
            >
                EUR
            </button>
        </div>
    );
};

const NavigationMenu: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);
    
    const navLinkClasses = "flex items-center space-x-4 py-2.5 text-xl font-semibold text-gray-300 hover:text-white transition-colors duration-300";

    const handleLogout = () => {
        logout();
        onClose();
    };
    
    const accountLink = user?.role === 'business' ? '/partner/dashboard' : '/account';
    const accountLabel = user?.role === 'business' ? t('Partner_Dashboard') : t('My_Account');

    const menuVariants = {
        hidden: { x: '100%' },
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
                        className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-black border-l border-gray-800 shadow-2xl flex flex-col p-6"
                    >
                        <div className="flex justify-between items-center mb-12">
                            <button onClick={onClose} aria-label="Close menu" className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800">
                                <XIcon className="w-6 h-6"/>
                            </button>
                            <NavLink to="/" onClick={onClose}>
                                <img src="/DR7logo.png" alt="DR7 Empire Logo" className="h-10 w-auto" />
                            </NavLink>
                        </div>

                        <nav className="flex-grow space-y-1">
                            {RENTAL_CATEGORIES.map(cat => {
                                const Icon = cat.icon;
                                return (
                                <NavLink key={cat.id} to={`/${cat.id}`} onClick={onClose} className={navLinkClasses}>
                                    {Icon && <Icon className="w-6 h-6" />}
                                    <span>{t(cat.label.en.replace(/ /g, '_') as any)}</span>
                                </NavLink>
                            )})}
                            <NavLink to="/lottery" onClick={onClose} className={navLinkClasses}>
                                <TicketIcon className="w-6 h-6" />
                                <span>{t('Lottery')}</span>
                            </NavLink>
                            <NavLink to="/membership" onClick={onClose} className={navLinkClasses}>
                                <StarIcon className="w-6 h-6" />
                                <span>{t('Membership')}</span>
                            </NavLink>
                        </nav>
                        
                        <div className="mt-auto pt-8 border-t border-gray-800">
                             {user ? (
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                                            {user.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{user.fullName}</p>
                                            <p className="text-xs text-gray-400">{user.email}</p>
                                        </div>
                                    </div>
                                    <Link to={accountLink} onClick={onClose} className="flex items-center justify-center w-full bg-gray-800 text-white py-3 rounded-full font-bold text-sm hover:bg-gray-700">
                                        <UsersIcon className="w-5 h-5 mr-2" />
                                        {accountLabel}
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center justify-center w-full bg-gray-200 text-black py-3 rounded-full font-bold text-sm hover:bg-white"
                                    >
                                        <SignOutIcon className="w-5 h-5 mr-2" />
                                        {t('Sign_Out')}
                                    </button>
                                </div>
                            ) : (
                                <Link 
                                    to="/signin" 
                                    onClick={onClose} 
                                    className="block w-full text-center bg-white text-black py-3 rounded-full font-bold text-sm hover:bg-gray-200"
                                >
                                    {t('Sign_In_Register')}
                                </Link>
                            )}
                            <div className="flex justify-between items-center mt-6">
                                <LanguageSwitcher />
                                <CurrencySwitcher />
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
                className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-black/50 backdrop-blur-lg border-b border-gray-800' : 'bg-transparent'}`}
            >
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <NavLink to="/" className="flex items-center">
                        <img src="/DR7logo.png" alt="DR7 Empire Logo" className="h-10 w-auto" />
                    </NavLink>
                    
                    <div className="flex items-center space-x-4">
                        <AnimatePresence mode="wait">
                            {user && (
                                <motion.div
                                    key="user-controls"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="flex items-center space-x-3"
                                >
                                    <Link
                                        to={user.role === 'business' ? '/partner/dashboard' : '/account'}
                                        className="flex items-center justify-center w-9 h-9 bg-gray-800/70 border border-gray-700 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                                        title={user.role === 'business' ? t('Partner_Dashboard') : t('My_Account')}
                                    >
                                        <UsersIcon className="w-5 h-5" />
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="flex items-center justify-center w-9 h-9 bg-gray-800/70 border border-gray-700 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                                        title={t('Sign_Out')}
                                    >
                                        <SignOutIcon className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <button onClick={() => setIsMenuOpen(true)} aria-label="Open menu" className="text-gray-200 hover:text-white p-2 -mr-2 rounded-full hover:bg-gray-800">
                            <MenuIcon className="w-7 h-7" />
                        </button>
                    </div>
                </div>
            </motion.header>
            <NavigationMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
    );
};

export default Header;