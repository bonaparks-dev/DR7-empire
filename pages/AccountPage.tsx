import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { UsersIcon, ShieldIcon, FileTextIcon, StarIcon, BellIcon, CreditCardIcon, TicketIcon } from '../components/icons/Icons';

const AccountPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/account/profile', label: t('Profile'), icon: UsersIcon },
        { path: '/account/security', label: t('Security'), icon: ShieldIcon },
        { path: '/account/documents', label: t('Documents'), icon: FileTextIcon },
        { path: '/account/membership', label: t('My_Membership'), icon: StarIcon },
        { path: '/account/tickets', label: t('My_Tickets'), icon: TicketIcon },
        { path: '/account/notifications', label: t('Notifications'), icon: BellIcon },
    ];
    
    // Normalize path for accurate matching (e.g., /account/ -> /account/profile)
    const currentPath = location.pathname.endsWith('/account') || location.pathname.endsWith('/account/')
        ? '/account/profile'
        : location.pathname;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-32 pb-24 bg-black min-h-screen"
        >
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{t('Account_Settings')}</h1>
                    <p className="text-lg text-gray-400">Welcome back, {user?.fullName}</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                    <aside className="md:w-1/4 lg:w-1/5">
                        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible -mx-4 px-4 md:mx-0 md:px-0 space-x-2 md:space-x-0 md:space-y-2">
                            {navItems.map(item => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => 
                                        `flex items-center p-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ` +
                                        (isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white')
                                    }
                                >
                                    <item.icon className="w-5 h-5 mr-3 shrink-0" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </aside>
                    <main className="flex-1">
                         <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                         >
                            <Outlet />
                         </motion.div>
                    </main>
                </div>
            </div>
        </motion.div>
    );
};

export default AccountPage;