import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { MEMBERSHIP_TIERS, RENTAL_CATEGORIES } from '../constants';

const ClubDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { t, lang, getTranslated } = useTranslation();
    const navigate = useNavigate();

    const membership = user?.membership;
    const tierDetails = membership ? MEMBERSHIP_TIERS.find(t => t.id === membership.tierId) : null;
    
    if (!user || !membership || !tierDetails) {
        // This should theoretically not be reached due to ProtectedRoute, but as a fallback
        return (
            <div className="pt-32 text-center text-white">
                <p>No active membership found.</p>
                <button onClick={() => navigate('/membership')} className="mt-4 px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
                    {t('Join_The_Club')}
                </button>
            </div>
        );
    }
    
    const renewalDate = new Date(membership.renewalDate).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const exclusiveOffer = RENTAL_CATEGORIES.find(c => c.id === 'cars')?.data[1]; // Example offer

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-32 pb-24 bg-black min-h-screen"
        >
            <div className="container mx-auto px-6">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white">
                        {t('Welcome')}, <span className="text-white">{user.fullName.split(' ')[0]}</span>
                    </h1>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-1 space-y-8"
                    >
                        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                            <h2 className="text-2xl font-bold text-white mb-4">{t('Your_Membership')}</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">{t('Current_Tier')}</span>
                                    <span className="font-bold text-white text-lg">{getTranslated(tierDetails.name)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">{t('Renews_On')}</span>
                                    <span className="font-semibold text-white">{renewalDate}</span>
                                </div>
                            </div>
                            <button className="mt-6 w-full px-6 py-2 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors text-sm">
                                {t('Manage_Subscription')}
                            </button>
                        </div>
                        
                        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                            <h2 className="text-2xl font-bold text-white mb-4">{t('Concierge_Service')}</h2>
                            <p className="text-gray-300 text-sm mb-4">{t('Our_247_concierge_is_at_your_disposal_for_any_request')}</p>
                            <button className="w-full px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors text-sm">
                                {t('Contact_Concierge')}
                            </button>
                        </div>
                    </motion.div>

                    {/* Right Column */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="lg:col-span-2 space-y-8"
                    >
                        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                            <h2 className="text-2xl font-bold text-white mb-2">{t('Exclusive_Offers')}</h2>
                            <p className="text-gray-400 text-sm mb-6">{t('Access_early_bird_reservations_and_special_rates_only_for_members')}</p>
                            
                            {exclusiveOffer && (
                                <div className="bg-gray-800/40 rounded-lg overflow-hidden flex flex-col md:flex-row group">
                                    <img src={exclusiveOffer.image} alt={exclusiveOffer.name} className="w-full md:w-1/3 h-48 md:h-auto object-cover transition-transform duration-300 group-hover:scale-105"/>
                                    <div className="p-6 flex flex-col justify-between">
                                        <div>
                                            <p className="text-sm text-white font-semibold">MEMBER EXCLUSIVE</p>
                                            <h3 className="text-xl font-bold text-white mt-1">{exclusiveOffer.name}</h3>
                                        </div>
                                        <button onClick={() => navigate(`/book/cars/${exclusiveOffer.id}`)} className="mt-4 self-start px-6 py-2 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-black transition-colors text-sm">
                                            {t('Book_Now')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                            <h2 className="text-2xl font-bold text-white mb-4">{t('Upcoming_Events')}</h2>
                            <div className="text-center py-8">
                                <p className="text-gray-400">{t('No_upcoming_events')}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default ClubDashboardPage;