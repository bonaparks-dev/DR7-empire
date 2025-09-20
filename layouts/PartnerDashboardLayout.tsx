import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { HomeIcon, ShieldIcon, CogIcon } from '../components/icons/Icons';

const PartnerDashboardLayout = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/partner/dashboard', label: t('Dashboard'), icon: HomeIcon },
        { path: '/partner/verification', label: t('Verification'), icon: ShieldIcon },
        { path: '/partner/settings', label: t('Settings'), icon: CogIcon },
    ];

    const settingsSubNavItems = [
        { path: '/partner/settings/profile', label: t('Profile') },
        { path: '/partner/settings/security', label: t('Security') },
        { path: '/partner/settings/notifications', label: t('Notifications') },
        { path: '/partner/settings/payouts', label: t('Payouts') },
    ];
    
    const isSettingsPage = location.pathname.startsWith('/partner/settings');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-32 pb-24 bg-black min-h-screen"
        >
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                    <aside className="md:w-1/4 lg:w-1/5">
                        <div className="mb-6 p-3">
                            <h2 className="text-lg font-bold text-white truncate">{user?.companyName}</h2>
                            <p className="text-sm text-gray-400">Partner Account</p>
                        </div>
                        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible -mx-4 px-4 md:mx-0 md:px-0 space-x-2 md:space-x-0 md:space-y-1">
                            {navItems.map(item => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => 
                                        `flex items-center p-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ` +
                                        (isActive || (item.path === '/partner/settings' && isSettingsPage) ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white')
                                    }
                                >
                                    <item.icon className="w-5 h-5 mr-3 shrink-0" />
                                    {item.label}
                                </NavLink>
                            ))}
                            {isSettingsPage && (
                                <motion.div initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} className="pl-5 mt-1 pt-1 border-l-2 border-gray-700 ml-4 space-y-1">
                                    {settingsSubNavItems.map(item => (
                                         <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) => 
                                                `block py-1.5 px-3 rounded-md text-sm transition-colors ` +
                                                (isActive ? 'font-semibold text-white' : 'text-gray-400 hover:text-white')
                                            }
                                        >
                                            {item.label}
                                        </NavLink>
                                    ))}
                                </motion.div>
                            )}
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

export default PartnerDashboardLayout;