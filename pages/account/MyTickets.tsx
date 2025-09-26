import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { Link } from 'react-router-dom';
import { TicketIcon } from '../../components/icons/Icons';
import type { LotteryTicket } from '../../types';
import TicketDisplay from '../../components/ui/TicketDisplay';
import { Button } from '../../components/ui/Button';

const MyTickets = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [tickets, setTickets] = useState<LotteryTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setLoading(true);
            try {
                const userTicketsKey = `lottery_tickets_${user.id}`;
                const savedTickets = JSON.parse(localStorage.getItem(userTicketsKey) || '[]');
                setTickets(savedTickets);
            } catch (error) {
                console.error("Failed to load tickets from local storage", error);
                setTickets([]);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [user]);

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">{t('My_Tickets')}</h2>
                    <p className="text-sm text-gray-400 mt-1">View your purchased lottery tickets here.</p>
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
                        <TicketIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold text-white">{t('You_have_not_purchased_any_lottery_tickets_yet')}</h3>
                        <Link to="/lottery" className="mt-4 inline-block px-5 py-2.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors text-sm">
                            {t('Go_to_Lottery')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTickets;
