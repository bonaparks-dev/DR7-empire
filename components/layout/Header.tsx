import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTranslation } from '../../hooks/useTranslation';
import { RENTAL_CATEGORIES } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuIcon, XIcon, UsersIcon } from '../icons/Icons';
import { useAuth } from '../../hooks/useAuth';

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center border border-gray-700 rounded-full">
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-sm rounded-full transition-colors duration-300 ${language === 'en' ? 'bg-white text-black' : 'text-gray-300 hover:text-white'}`}
            >
                EN
            </button>
            <button
                onClick={() => setLanguage('it')}
                className={`px-3 py-1 text-sm rounded-full transition-colors duration-300 ${language === 'it' ? 'bg-white text-black' : 'text-gray-300 hover:text-white'}`}
            >
                IT
            </button>
        </div>
    );
};

const CurrencySwitcher: React.FC = () => {
    const { currency, setCurrency } = useCurrency();

    return (
        <div className="flex items-center border border-gray-700 rounded-full">
            <button
                onClick={() => setCurrency('usd')}
                className={`px-3 py-1 text-sm rounded-full transition-colors duration-300 ${currency === 'usd' ? 'bg-white text-black' : 'text-gray-300 hover:text-white'}`}
            >
                USD
            </button>
            <button
                onClick={() => setCurrency('eur')}
                className={`px-3 py-1 text-sm rounded-full transition-colors duration-300 ${currency === 'eur' ? 'bg-white text-black' : 'text-gray-300 hover:text-white'}`}
            >
                EUR
            </button>
        </div>
    );
};

const UserMenu: React.FC = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors">
                <UsersIcon className="w-6 h-6" />
                <span className="text-sm font-medium hidden lg:block">{user.fullName}</span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-50"
                    >
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    logout();
                                    setIsOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                            >
                                {t('Sign_Out')}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MobileMenu: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
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
    
    const navLinkClasses = "text-3xl font-bold text-gray-300 hover:text-white transition-colors duration-300";

    const handleLogout = () => {
        logout();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: '100%' }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: '100%' }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 p-6 flex flex-col"
                >
                    <div className="flex justify-between items-center">
                        <NavLink to="/" onClick={onClose}>
                            <img src="/DR7logo.png" alt="DR7 Empire Logo" className="h-10 w-auto" />
                        </NavLink>
                        <button onClick={onClose} aria-label="Close menu" className="text-gray-300 hover:text-white">
                            <XIcon className="w-8 h-8"/>
                        </button>
                    </div>

                    <nav className="flex flex-col items-center justify-center flex-grow space-y-6">
                        {RENTAL_CATEGORIES.map(cat => (
                            <NavLink key={cat.id} to={`/${cat.id}`} onClick={onClose} className={({isActive}) => `${navLinkClasses} ${isActive ? 'text-white' : ''}`}>
                                {t(cat.label.en.replace(/ /g, '_') as any)}
                            </NavLink>
                        ))}
                        <NavLink to="/lottery" onClick={onClose} className={({isActive}) => `${navLinkClasses} ${isActive ? 'text-white' : ''}`}>{t('Lottery')}</NavLink>
                        <NavLink to="/membership" onClick={onClose} className={({isActive}) => `${navLinkClasses} ${isActive ? 'text-white' : ''}`}>{t('Membership')}</NavLink>
                    </nav>
                    
                    <div className="mt-auto pt-8 border-t border-gray-800">
                         {user ? (
                            <div className="text-center">
                                <p className="text-lg text-white mb-4">{t('Welcome')}, {user.fullName}</p>
                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-white text-black py-3 rounded-full font-bold text-sm"
                                >
                                    {t('Sign_Out')}
                                </button>
                            </div>
                        ) : (
                            <Link 
                                to="/signin" 
                                onClick={onClose} 
                                className="block w-full text-center bg-white text-black py-3 rounded-full font-bold text-sm"
                            >
                                {t('Sign_In')}
                            </Link>
                        )}
                        <div className="flex justify-center space-x-4 mt-6">
                            <LanguageSwitcher />
                            <CurrencySwitcher />
                        </div>
                    </div>

                </motion.div>
            )}
        </AnimatePresence>
    );
};


const Header: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinkClasses = "px-3 py-2 text-gray-300 hover:text-white transition-colors duration-300 relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 after:-translate-x-1/2 hover:after:w-4/5";

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
                    <nav className="hidden md:flex items-center space-x-2 text-sm font-medium">
                        {RENTAL_CATEGORIES.map(cat => (
                             <NavLink key={cat.id} to={`/${cat.id}`} className={({isActive}) => `${navLinkClasses} ${isActive ? 'text-white' : ''}`}>
                                {t(cat.label.en.replace(/ /g, '_') as any)}
                            </NavLink>
                        ))}
                        <NavLink to="/lottery" className={({isActive}) => `${navLinkClasses} ${isActive ? 'text-white' : ''}`}>{t('Lottery')}</NavLink>
                        <NavLink to="/membership" className={({isActive}) => `${navLinkClasses} ${isActive ? 'text-white' : ''}`}>{t('Membership')}</NavLink>
                    </nav>
                    <div className="hidden md:flex items-center space-x-4">
                        <LanguageSwitcher />
                        <CurrencySwitcher />
                        {user ? (
                            <UserMenu />
                        ) : (
                            <Link to="/signin" className="px-4 py-2 text-sm font-semibold text-black bg-white rounded-full hover:bg-gray-200 transition-colors">
                                {t('Sign_In')}
                            </Link>
                        )}
                    </div>

                    <div className="md:hidden">
                        <button onClick={() => setIsMenuOpen(true)} aria-label="Open menu" className="text-gray-200 hover:text-white">
                            <MenuIcon className="w-7 h-7" />
                        </button>
                    </div>
                </div>
            </motion.header>
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
    );
};

export default Header;