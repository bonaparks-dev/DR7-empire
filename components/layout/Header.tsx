import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';
import { RENTAL_CATEGORIES } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center border border-stone-700 rounded-full">
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-sm rounded-full transition-colors duration-300 ${language === 'en' ? 'bg-amber-400 text-black' : 'text-stone-300 hover:text-white'}`}
            >
                EN
            </button>
            <button
                onClick={() => setLanguage('it')}
                className={`px-3 py-1 text-sm rounded-full transition-colors duration-300 ${language === 'it' ? 'bg-amber-400 text-black' : 'text-stone-300 hover:text-white'}`}
            >
                IT
            </button>
        </div>
    );
};

const CurrencySwitcher: React.FC = () => {
    const { currency, setCurrency } = useCurrency();

    return (
        <div className="flex items-center border border-stone-700 rounded-full">
            <button
                onClick={() => setCurrency('usd')}
                className={`px-3 py-1 text-sm rounded-full transition-colors duration-300 ${currency === 'usd' ? 'bg-amber-400 text-black' : 'text-stone-300 hover:text-white'}`}
            >
                USD
            </button>
            <button
                onClick={() => setCurrency('eur')}
                className={`px-3 py-1 text-sm rounded-full transition-colors duration-300 ${currency === 'eur' ? 'bg-amber-400 text-black' : 'text-stone-300 hover:text-white'}`}
            >
                EUR
            </button>
        </div>
    );
};

const UserMenu: React.FC = () => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-full bg-stone-700 flex items-center justify-center border-2 border-stone-600 hover:border-amber-400 transition-colors duration-300">
                    {user.profilePicture ? (
                        <img src={user.profilePicture} alt="User" className="w-full h-full rounded-full object-cover"/>
                    ) : (
                        <span className="text-sm font-bold text-amber-400">{getInitials(user.fullName)}</span>
                    )}
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-56 origin-top-right bg-stone-900/80 backdrop-blur-lg border border-stone-700 rounded-md shadow-2xl z-20"
                    >
                        <div className="p-2">
                            <div className="px-3 py-2 border-b border-stone-700">
                                <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
                                <p className="text-xs text-stone-400 truncate">{user.email}</p>
                            </div>
                            <div className="py-1">
                                <Link to="/account/profile" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-amber-400 rounded-md transition-colors">
                                    {t('My_Account')}
                                </Link>
                                {user.membership && (
                                     <Link to="/club-dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-amber-400 rounded-md transition-colors">
                                        {t('Club_Dashboard')}
                                    </Link>
                                )}
                                <button
                                    onClick={() => { logout(); setIsOpen(false); }}
                                    className="w-full text-left block px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 hover:text-amber-400 rounded-md transition-colors"
                                >
                                    {t('Sign_Out')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


const Header: React.FC = () => {
    const { t } = useTranslation();
    const { user, isLoggedIn, isLoading } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinkClasses = "px-3 py-2 text-stone-300 hover:text-amber-400 transition-colors duration-300 relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:w-0 after:h-[1px] after:bg-amber-400 after:transition-all after:duration-300 after:-translate-x-1/2 hover:after:w-4/5";

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/50 backdrop-blur-lg border-b border-stone-800' : 'bg-transparent'}`}
        >
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <NavLink to="/" className="text-2xl font-bold tracking-wider text-white">
                    DR<span className="text-amber-400">7</span>
                </NavLink>
                <nav className="hidden md:flex items-center space-x-2 text-sm font-medium">
                    {RENTAL_CATEGORIES.map(cat => (
                         <NavLink key={cat.id} to={`/${cat.id}`} className={({isActive}) => `${navLinkClasses} ${isActive ? 'text-amber-400' : ''}`}>
                            {t(cat.label.en.replace(/ /g, '_') as any)}
                        </NavLink>
                    ))}
                    {user?.membership ? (
                         <NavLink to="/club-dashboard" className={({isActive}) => `${navLinkClasses} ${isActive ? 'text-amber-400' : ''}`}>{t('Club_Dashboard')}</NavLink>
                    ) : (
                        <NavLink to="/membership" className={({isActive}) => `${navLinkClasses} ${isActive ? 'text-amber-400' : ''}`}>{t('Membership')}</NavLink>
                    )}
                    <NavLink to="/lottery" className={({isActive}) => `${navLinkClasses} ${isActive ? 'text-amber-400' : ''}`}>{t('Lottery')}</NavLink>
                </nav>
                <div className="flex items-center space-x-4">
                    <LanguageSwitcher />
                    <CurrencySwitcher />
                    {!isLoading && (
                        isLoggedIn ? (
                             <UserMenu />
                        ) : (
                            <Link to="/signin" className="px-5 py-2 text-sm font-semibold bg-transparent border border-amber-400 text-amber-400 rounded-full hover:bg-amber-400 hover:text-black transition-colors duration-300">
                                {t('Sign_In')}
                            </Link>
                        )
                    )}
                </div>
            </div>
        </motion.header>
    );
};

export default Header;