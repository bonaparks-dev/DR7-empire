import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { CommercialOperationTicket } from '../types';
import TicketDisplay from '../components/ui/TicketDisplay';
import { supabase } from '../supabaseClient';

const CommercialOperationSuccessPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const { tickets, ownerName } = location.state as { tickets: Omit<CommercialOperationTicket, 'ownerName'>[]; ownerName: string; } || { tickets: [], ownerName: '' };

    const ticketsWithData: CommercialOperationTicket[] = tickets.map(t => ({...t, ownerName: ownerName || user?.fullName || ''}));

    useEffect(() => {
        const linkTicketsToUser = async () => {
            if (user && ticketsWithData && ticketsWithData.length > 0) {
                try {
                    // Save to localStorage for backwards compatibility
                    const userTicketsKey = `commercial_operation_tickets_${user.id}`;
                    const existingTickets = JSON.parse(localStorage.getItem(userTicketsKey) || '[]') as CommercialOperationTicket[];
                    const newTickets = ticketsWithData.filter(
                        (newTicket: CommercialOperationTicket) => !existingTickets.some((existing: CommercialOperationTicket) => existing.uuid === newTicket.uuid)
                    );
                    if (newTickets.length > 0) {
                        localStorage.setItem(userTicketsKey, JSON.stringify([...existingTickets, ...newTickets]));
                    }

                    // Link tickets in database to user_id if they're not already linked
                    if (user.email) {
                        const updatePromises = ticketsWithData.map(ticket =>
                            supabase
                                .from('commercial_operation_tickets')
                                .update({ user_id: user.id })
                                .eq('uuid', ticket.uuid)
                                .is('user_id', null)
                        );

                        await Promise.all(updatePromises);
                        console.log(`Linked ${ticketsWithData.length} tickets to user account in database`);
                    }
                } catch (error) {
                    console.error("Failed to save/link tickets:", error);
                }
            }
        };

        linkTicketsToUser();
    }, [user, ticketsWithData]);

    if (!tickets || tickets.length === 0) {
        // Redirect if no ticket data is present
        React.useEffect(() => {
            navigate('/commercial-operation');
        }, [navigate]);
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-32 pb-24 bg-black min-h-screen"
        >
            <div className="container mx-auto px-6 text-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                    className="w-20 h-20 bg-green-500/20 text-green-300 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <motion.svg 
                        initial={{ pathLength: 0 }} 
                        animate={{ pathLength: 1 }} 
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="w-10 h-10" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </motion.svg>
                </motion.div>
                <h1 className="text-4xl font-bold text-white mb-4">
                    {t('Purchase_Success').replace('{count}', String(tickets.length))}
                </h1>
                <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
                    {t('Tickets_Sent_Message')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                    {ticketsWithData.map((ticket, i) => (
                        <TicketDisplay key={i} ticket={ticket} />
                    ))}
                </div>

                <div className='flex justify-center items-center gap-4'>
                    <Button as={Link} to="/account/tickets" variant="primary" size="lg" className="mt-12">
                        {t('View_My_Tickets')}
                    </Button>
                    <Button as={Link} to="/commercial-operation" variant="outline" size="lg" className="mt-12">
                        {t('Back_To_Commercial_Operation')}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};

export default CommercialOperationSuccessPage;