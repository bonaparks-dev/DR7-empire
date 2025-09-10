import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../contexts/CurrencyContext';
import { LOTTERY_GIVEAWAY } from '../constants';
import type { Lottery } from '../types';

// Helper to calculate time left
const calculateTimeLeft = (drawDate: string) => {
    const difference = +new Date(drawDate) - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
        timeLeft = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    }

    return timeLeft;
};

const TimerBox: React.FC<{ value: number, label: string }> = ({ value, label }) => (
    <div className="bg-stone-800/50 p-3 rounded-md">
        <div className="text-3xl font-bold text-white">{String(value).padStart(2, '0')}</div>
        <div className="text-xs text-stone-400 uppercase">{label}</div>
    </div>
);

const LotteryPage: React.FC = () => {
    const { t, getTranslated } = useTranslation();
    const { user } = useAuth();
    const { currency } = useCurrency();
    const giveaway: Lottery = LOTTERY_GIVEAWAY;

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(giveaway.drawDate));
    const [quantity, setQuantity] = useState(1);
    const [userTickets, setUserTickets] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft(giveaway.drawDate));
        }, 1000);
        return () => clearTimeout(timer);
    });

    // Load user's tickets from localStorage
    useEffect(() => {
        if (user) {
            const allTickets = JSON.parse(localStorage.getItem('dr7-lottery-tickets') || '{}');
            setUserTickets(allTickets[user.id]?.[giveaway.id] || 0);
        }
    }, [user, giveaway.id]);

    const handleQuantityChange = (amount: number) => {
        setQuantity(prev => Math.max(1, prev + amount));
    };

    const handleBuyClick = () => {
        setShowConfirmModal(true);
    };
    
    const confirmPurchase = () => {
        setShowConfirmModal(false);
        if (!user) return;

        const allTickets = JSON.parse(localStorage.getItem('dr7-lottery-tickets') || '{}');
        const userGiveawayTickets = allTickets[user.id]?.[giveaway.id] || 0;
        
        const updatedTickets = {
            ...allTickets,
            [user.id]: {
                ...allTickets[user.id],
                [giveaway.id]: userGiveawayTickets + quantity,
            },
        };

        localStorage.setItem('dr7-lottery-tickets', JSON.stringify(updatedTickets));
        setUserTickets(userGiveawayTickets + quantity);
        
        setSuccessMessage(t('Purchase_Successful_Message').replace('{count}', String(quantity)));
        setTimeout(() => setSuccessMessage(''), 5000);

        setQuantity(1);
    };
    
    const ticketPrice = currency === 'usd' ? giveaway.ticketPriceUSD : giveaway.ticketPriceEUR;
    const totalPrice = useMemo(() => quantity * ticketPrice, [quantity, ticketPrice]);
    
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
          style: 'currency',
          currency: currency.toUpperCase(),
        }).format(price);
    };

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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white">
                        {t('The_DR7_Lottery')}
                    </h1>
                    <p className="mt-4 text-lg text-amber-400 max-w-2xl mx-auto">{t('Current_Giveaway')}</p>
                </motion.div>

                <div className="mt-12 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="rounded-lg overflow-hidden border border-stone-800 shadow-2xl shadow-amber-500/10"
                    >
                        <img src={giveaway.image} alt={getTranslated(giveaway.name)} className="w-full h-auto object-cover" />
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="bg-stone-900/50 p-8 rounded-lg border border-stone-800"
                    >
                        <h2 className="text-3xl font-bold text-amber-400">{getTranslated(giveaway.name)}</h2>
                        <p className="text-stone-300 mt-2 mb-6">{getTranslated(giveaway.description)}</p>

                        <div className="mb-6">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-2">{t('Draw_Ends_In')}</h3>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <TimerBox value={timeLeft.days} label={t('Days')} />
                                <TimerBox value={timeLeft.hours} label={t('Hours')} />
                                <TimerBox value={timeLeft.minutes} label={t('Minutes')} />
                                <TimerBox value={timeLeft.seconds} label={t('Seconds')} />
                            </div>
                        </div>

                        <div className="bg-stone-800/50 p-4 rounded-lg mb-6">
                             <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-2">{t('Your_Tickets')}</h3>
                             <p className="text-white text-lg font-semibold">
                                {userTickets > 0 ? t('You_have_tickets_count').replace('{count}', String(userTickets)) : t('You_currently_have_no_tickets')}
                             </p>
                        </div>
                        
                        <AnimatePresence>
                        {successMessage && 
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-green-500/20 text-green-300 p-3 rounded-md mb-4 text-center text-sm font-medium"
                            >
                                {successMessage}
                            </motion.div>
                        }
                        </AnimatePresence>


                        <div className="border-t border-stone-700 pt-6">
                             <div className="mb-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-white">{t('How_many_tickets')}</h3>
                                    <div className="flex items-center space-x-2 bg-stone-800 border border-stone-700 rounded-full p-1">
                                        <button type="button" onClick={() => handleQuantityChange(-1)} className="w-8 h-8 text-lg font-bold text-white rounded-full hover:bg-stone-700 transition-colors flex items-center justify-center" aria-label="Decrease ticket quantity">-</button>
                                        <span className="w-12 text-center text-white text-xl font-bold" aria-live="polite">{quantity}</span>
                                        <button type="button" onClick={() => handleQuantityChange(1)} className="w-8 h-8 text-lg font-bold text-white rounded-full hover:bg-stone-700 transition-colors flex items-center justify-center" aria-label="Increase ticket quantity">+</button>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 mt-2">
                                    {[5, 10, 25, 50].map(val => (
                                        <button 
                                            key={val}
                                            type="button"
                                            onClick={() => setQuantity(val)} 
                                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${quantity === val ? 'bg-amber-400 text-black border-amber-400' : 'bg-stone-700/80 border-stone-600 text-stone-300 hover:border-amber-400'}`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xl font-bold mb-6">
                                <span className="text-stone-300">{t('Total_Price_Lottery')}</span>
                                <span className="text-amber-400">{formatPrice(totalPrice)}</span>
                            </div>
                            <button onClick={handleBuyClick} className="w-full py-4 px-6 bg-amber-400 text-black rounded-full font-bold uppercase tracking-wider text-sm hover:bg-amber-300 transition-all duration-300 transform hover:scale-105">
                                {t('Buy_Tickets')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
            
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowConfirmModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="relative bg-stone-900/80 border border-stone-700 rounded-lg shadow-2xl w-full max-w-md p-8 text-center"
                        >
                            <h2 className="text-2xl font-bold text-amber-400 mb-4">{t('Confirm_Purchase')}</h2>
                            <p className="text-stone-300 mb-6">{t('Are_you_sure_you_want_to_buy_tickets').replace('{count}', String(quantity)).replace('{price}', formatPrice(totalPrice))}</p>
                             <div className="flex justify-center space-x-4">
                                <button onClick={() => setShowConfirmModal(false)} className="px-8 py-3 bg-stone-700 text-white font-bold rounded-full hover:bg-stone-600 transition-colors">
                                    {t('Cancel')}
                                </button>
                                <button onClick={confirmPurchase} className="px-8 py-3 bg-amber-400 text-black font-bold rounded-full hover:bg-amber-300 transition-colors">
                                    {t('Confirm_Purchase')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default LotteryPage;