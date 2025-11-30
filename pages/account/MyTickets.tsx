import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { Link } from 'react-router-dom';
import type { CommercialOperationTicket } from '../../types';
import TicketDisplay from '../../components/ui/TicketDisplay';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../supabaseClient';

const MyTickets = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [tickets, setTickets] = useState<CommercialOperationTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTickets = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch tickets from Supabase database
                const { data: dbTickets, error } = await supabase
                    .from('commercial_operation_tickets')
                    .select('*')
                    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
                    .order('purchase_date', { ascending: false });

                if (error) {
                    console.error("Failed to load tickets from database:", error);
                }

                // Link tickets to user if they match by email but don't have user_id
                if (dbTickets && user.email) {
                    const ticketsToLink = dbTickets.filter(
                        ticket => !ticket.user_id && ticket.email === user.email
                    );

                    if (ticketsToLink.length > 0) {
                        // Update tickets with user_id
                        const updatePromises = ticketsToLink.map(ticket =>
                            supabase
                                .from('commercial_operation_tickets')
                                .update({ user_id: user.id })
                                .eq('uuid', ticket.uuid)
                        );

                        await Promise.all(updatePromises);
                        console.log(`Linked ${ticketsToLink.length} tickets to user account`);
                    }
                }

                // Also load from localStorage for backwards compatibility
                const userTicketsKey = `commercial_operation_tickets_${user.id}`;
                const localTickets = JSON.parse(localStorage.getItem(userTicketsKey) || '[]');

                // Merge tickets from both sources
                const allTickets = [
                    ...(dbTickets || []).map(ticket => ({
                        uuid: ticket.uuid,
                        number: ticket.ticket_number,
                        email: ticket.email,
                        fullName: ticket.full_name,
                        paymentIntentId: ticket.payment_intent_id,
                        purchaseDate: ticket.purchase_date,
                    })),
                    ...localTickets
                ];

                // Remove duplicates based on UUID
                const uniqueTickets = allTickets.filter((ticket, index, self) =>
                    index === self.findIndex(t => t.uuid === ticket.uuid)
                );

                setTickets(uniqueTickets);
            } catch (error) {
                console.error("Failed to load tickets:", error);
                setTickets([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, [user]);

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">{t('My_Tickets')}</h2>
                    <p className="text-sm text-gray-400 mt-1">View your purchased tickets here.</p>
                </div>
            </div>
            <div className="p-6">
                {loading ? (
                    <div className="text-center text-gray-400 py-8">Loading tickets...</div>
                ) : tickets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tickets.map((ticket) => (
                            <TicketDisplay key={ticket.uuid} ticket={{...ticket, ownerName: user?.fullName || ''}} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-semibold text-white">{t('You_have_not_purchased_any_tickets_yet')}</h3>
                        <Link to="/commercial-operation" className="mt-4 inline-block px-5 py-2.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors text-sm">
                            DR7 Millions
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTickets;
