import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileTextIcon, CalendarIcon, ZapIcon, PlusIcon, ShieldIcon, TicketIcon,
} from '../../components/icons/Icons';
import type { RentalItem, CommercialOperationTicket } from '../../types';
import { Button } from '../../components/ui/Button';
import TicketDisplay from '../../components/ui/TicketDisplay';

const StatusBadge: React.FC<{ status: 'unverified' | 'pending' | 'verified' }> = ({ status }) => {
    const { t } = useTranslation();
    const statusMap = {
        unverified: { text: t('Unverified'), color: 'bg-red-500/20 text-red-400' },
        pending: { text: t('Pending'), color: 'bg-yellow-500/20 text-yellow-400' },
        verified: { text: t('Verified'), color: 'bg-green-500/20 text-green-400' },
    };
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusMap[status].color}`}>{statusMap[status].text}</span>;
}


const PartnerDashboardPage: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [myListings, setMyListings] = useState<RentalItem[]>([]);
    const [tickets, setTickets] = useState<CommercialOperationTicket[]>([]);

    useEffect(() => {
        if (location.state?.newListing) {
            setMyListings(prev => [...prev, location.state.newListing]);
            // Clear location state to prevent re-adding on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate]);

    // Load tickets from localStorage
    useEffect(() => {
        if (user) {
            try {
                const userTicketsKey = `commercial_operation_tickets_${user.id}`;
                const savedTickets = JSON.parse(localStorage.getItem(userTicketsKey) || '[]');
                setTickets(savedTickets);
            } catch (error) {
                console.error("Failed to load tickets from local storage", error);
                setTickets([]);
            }
        }
    }, [user]);

    const FeatureCard: React.FC<{ icon: React.FC<{className?: string}>, title: string, description: string }> = ({ icon: Icon, title, description }) => (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 text-center relative overflow-hidden h-full">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gray-700/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">{t(title as any)}</h3>
                <p className="text-sm text-gray-400 mt-2">{t(description as any)}</p>
                <div className="mt-4">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{t('Coming_Soon')}</span>
                </div>
            </div>
        </div>
    );
    
    const verificationStatus = user?.businessVerification?.status || 'unverified';

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
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{t('Welcome_to_your_Partner_Dashboard')}</h1>
                    <p className="text-lg text-gray-400">Welcome, {user?.companyName || user?.fullName}</p>
                </div>
                
                <div className="max-w-5xl mx-auto">
                    {verificationStatus !== 'verified' && (
                        <motion.div initial={{opacity:0, y: -10}} animate={{opacity:1, y: 0}} className="bg-yellow-900/30 border border-yellow-400/40 rounded-lg p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                           <div className="flex items-center gap-4">
                                <ShieldIcon className="w-8 h-8 text-yellow-300 flex-shrink-0"/>
                                <div>
                                    <h3 className="font-bold text-white">{t('Account_Status')}: <StatusBadge status={verificationStatus} /></h3>
                                    <p className="text-sm text-yellow-200/80">{t('Verification_Required_Partner')}</p>
                                </div>
                           </div>
                            <Button as={Link} to="/partner/verification" variant="outline" size="sm" className="bg-yellow-400/10 border-yellow-400/50 text-yellow-300 hover:bg-yellow-400/20 hover:border-yellow-400/80 shrink-0">
                                {t('Verify_Account')}
                            </Button>
                        </motion.div>
                    )}
                    
                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 md:p-8 mb-12">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <h2 className="text-2xl font-bold text-white">{t('Your_Listings')}</h2>
                            <Button as={Link} to="/partner/listings/new" size="sm" disabled={verificationStatus !== 'verified'} title={verificationStatus !== 'verified' ? t('Verification_Required_Partner') : ''}>
                                <PlusIcon className="w-4 h-4 mr-2" />
                                {t('Create_New_Listing')}
                            </Button>
                        </div>
                        {myListings.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
                                <FileTextIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                                <h3 className="text-lg font-semibold text-white">{t('No_listings_yet')}</h3>
                                <p className="text-gray-400 mt-1">{t('Create_your_first_listing_to_get_started')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myListings.map(item => (
                                    <motion.div key={item.id} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                                        <img src={item.image} alt={item.name} className="w-full h-40 object-cover"/>
                                        <div className="p-4">
                                            <h4 className="font-bold text-white truncate">{item.name}</h4>
                                            <p className="text-sm text-gray-300 mt-1">{item.pricePerDay?.eur.toLocaleString('it-IT', { style: 'currency', currency: 'EUR'})} / {t('day')}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* My Tickets Section */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 md:p-8 mb-12">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div className="flex items-center gap-3">
                                <TicketIcon className="w-6 h-6 text-white" />
                                <h2 className="text-2xl font-bold text-white">{t('My_Tickets')}</h2>
                            </div>
                            <Button as={Link} to="/commercial-operation" size="sm" variant="outline">
                                {t('Buy_More_Tickets')}
                            </Button>
                        </div>
                        {tickets.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
                                <TicketIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                                <h3 className="text-lg font-semibold text-white">{t('You_have_not_purchased_any_tickets_yet')}</h3>
                                <p className="text-gray-400 mt-1">{t('Purchase_tickets_to_participate_in_the_giveaway')}</p>
                                <Button as={Link} to="/commercial-operation" size="sm" className="mt-4">
                                    DR7 Millions
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tickets.map((ticket) => (
                                    <TicketDisplay key={ticket.uuid} ticket={{...ticket, ownerName: user?.fullName || ''}} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={CalendarIcon}
                            title="View_Bookings"
                            description="Track_upcoming_and_past_bookings"
                        />
                        <FeatureCard
                            icon={ZapIcon}
                            title="Analytics"
                            description="Gain_insights_into_your_performance"
                        />
                         <FeatureCard
                            icon={FileTextIcon}
                            title="Manage_Listings"
                            description="Add_edit_and_organize_your_assets"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PartnerDashboardPage;