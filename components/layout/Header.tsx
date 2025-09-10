import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';
import { RENTAL_CATEGORIES } from '../../constants';
import { motion } from 'framer-motion';

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

const Header: React.FC = () => {
    const { t } = useTranslation();
    const { isLoggedIn, user, logout, isLoading } = useAuth();
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
                    <NavLink to="/membership" className={({isActive}) => `${navLinkClasses} ${isActive ? 'text-amber-400' : ''}`}>{t('Membership')}</NavLink>
                </nav>
                <div className="flex items-center space-x-4">
                    <LanguageSwitcher />
                    {!isLoading && (
                        isLoggedIn ? (
                             <div className="flex items-center space-x-4">
                                <span className="text-sm text-stone-300 hidden sm:block">{user?.fullName}</span>
                                <button onClick={logout} className="px-4 py-2 text-sm font-semibold bg-stone-700 text-white rounded-full hover:bg-stone-600 transition-colors duration-300">
                                    {t('Sign_Out')}
                                </button>
                            </div>
                        ) : (
                            <Link to="/signin" className="px-4 py-2 text-sm font-semibold bg-amber-400 text-black rounded-full hover:bg-amber-300 transition-colors duration-300 transform hover:scale-105">
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
