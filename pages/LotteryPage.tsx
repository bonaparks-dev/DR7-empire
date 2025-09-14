import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../contexts/CurrencyContext';
import { LOTTERY_GIVEAWAY } from '../constants';
import type { Lottery, Prize } from '../types';
import { TicketIcon } from '../components/icons/Icons';

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
    <div className="bg-black/50 backdrop-blur-sm p-3 rounded-lg text-center border border-white/20">
        <div className="text-4xl md:text-5xl font-bold text-white tracking-tighter" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>{String(value).padStart(2, '0')}</div>
        <div className="text-xs text-white/70 uppercase tracking-widest">{label}</div>
    </div>
);

const PrizeCard: React.FC<{ prize: Prize }> = ({ prize }) => {
    const { getTranslated } = useTranslation();
    const Icon = prize.icon;
    return (
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-gray-900">
            <div className="flex justify-center items-center mb-4">
                <Icon className="w-10 h-10 text-white" />
            </div>
            {prize.quantity && <p className="text-2xl font-bold text-white">{prize.quantity}x</p>}
            <h3 className="text-lg font-semibold text-white mt-1">{getTranslated(prize.name)}</h3>
            <p className="text-sm text-gray-400">{getTranslated(prize.tier)}</p>
        </div>
    );
};

const LotteryPage: React.FC = () => {
    const { t, getTranslated } = useTranslation();
    const { currency } = useCurrency();
    const giveaway: Lottery = LOTTERY_GIVEAWAY;

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(giveaway.drawDate));
    const [quantity, setQuantity] = useState(1);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft(giveaway.drawDate));
        }, 1000);
        return () => clearTimeout(timer);
    });

    const handleQuantityChange = (amount: number) => setQuantity(prev => Math.max(1, prev + amount));
    const handleBuyClick = () => setShowConfirmModal(true);
    
    const confirmPurchase = () => {
        setShowConfirmModal(false);
        setSuccessMessage(t('Purchase_Successful_Message').replace('{count}', String(quantity)));
        setTimeout(() => setSuccessMessage(''), 5000);
        setQuantity(1);
    };
    
    const ticketPrice = currency === 'usd' ? giveaway.ticketPriceUSD : giveaway.ticketPriceEUR;
    const totalPrice = useMemo(() => quantity * ticketPrice, [quantity, ticketPrice]);
    
    const formatPrice = (price: number) => new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', { style: 'currency', currency: currency.toUpperCase() }).format(price);
    
    const groupedPrizes = useMemo(() => {
        return giveaway.prizes.reduce((acc, prize) => {
            const tier = getTranslated(prize.tier);
            if (!acc[tier]) acc[tier] = [];
            acc[tier].push(prize);
            return acc;
        }, {} as Record<string, Prize[]>);
    }, [giveaway.prizes, getTranslated]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-black text-white">
            <div className="relative min-h-screen flex items-center justify-center text-center overflow-hidden pt-32 pb-24">
                <video src="/lottery-urus.mp4" autoPlay loop muted playsInline className="absolute inset-0 z-0 w-full h-full object-cover brightness-50" />
                <div className="absolute inset-0 bg-black/50 z-10"></div>
                <div className="relative z-20 px-6 container mx-auto">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-4xl md:text-6xl font-bold font-playfair uppercase tracking-wider" style={{ textShadow: '0 0 15px rgba(255,255,255,0.3)' }}>
                        {getTranslated(giveaway.name)}
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="mt-4 text-xl md:text-2xl text-white/80 font-semibold tracking-wide">
                        {getTranslated(giveaway.subtitle)}
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="mt-12">
                        <h3 className="text-lg font-semibold uppercase tracking-widest text-white/80 mb-4">{t('Draw_Ends_In')}</h3>
                        <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto">
                            <TimerBox value={timeLeft.days} label={t('Days')} />
                            <TimerBox value={timeLeft.hours} label={t('Hours')} />
                            <TimerBox value={timeLeft.minutes} label={t('Minutes')} />
                            <TimerBox value={timeLeft.seconds} label={t('Seconds')} />
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="py-24 bg-black">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-5 gap-12 items-start">
                        <div className="lg:col-span-3">
                            <h2 className="text-3xl font-bold font-playfair mb-8 text-center lg:text-left">{t('Prizes_Pool_Worth_Over').replace('€400,000', '')}<span className="text-yellow-400">€400,000</span></h2>
                            <div className="space-y-8">
                                {Object.entries(groupedPrizes).map(([tier, prizes]) => (
                                    <div key={tier}>
                                        <h3 className="text-xl font-semibold text-yellow-400 mb-4">{tier}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {prizes.map((prize, idx) => <PrizeCard key={idx} prize={prize} />)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-2 lg:sticky top-32">
                             <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 backdrop-blur-sm">
                                <AnimatePresence>{successMessage && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-green-500/20 text-green-300 p-3 rounded-md mb-4 text-center text-sm font-medium">{successMessage}</motion.div>}</AnimatePresence>
                                <div className="mb-4"><h3 className="text-lg font-semibold text-white">{t('How_many_tickets')}</h3><div className="flex items-center justify-between mt-2"><div className="flex items-center space-x-2 bg-gray-800 border border-gray-700 rounded-full p-1"><button onClick={() => handleQuantityChange(-1)} className="w-8 h-8 font-bold text-white rounded-full hover:bg-gray-700">-</button><span className="w-12 text-center text-white text-xl font-bold">{quantity}</span><button onClick={() => handleQuantityChange(1)} className="w-8 h-8 font-bold text-white rounded-full hover:bg-gray-700">+</button></div><div className="flex space-x-2">{[5, 10, 25, 50].map(val => (<button key={val} onClick={() => setQuantity(val)} className={`px-3 py-1 text-xs rounded-full border transition-colors ${quantity === val ? 'bg-white text-black border-white' : 'bg-gray-700/80 border-gray-600 text-gray-300 hover:border-white'}`}>{val}</button>))}</div></div></div>
                                <div className="flex justify-between items-center text-xl font-bold mb-6"><span className="text-gray-300">{t('Total_Price_Lottery')}</span><span className="text-white">{formatPrice(totalPrice)}</span></div>
                                <button onClick={handleBuyClick} className="w-full py-4 px-6 bg-white text-black rounded-full font-bold uppercase tracking-wider text-sm hover:bg-gray-200 transition-all duration-300 transform hover:scale-105">{t('Buy_Tickets')}</button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-24 max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold font-playfair mb-8 text-center">{t('How_It_Works')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div className="bg-gray-900/50 p-6 rounded-lg"><p className="text-yellow-400 font-bold mb-2">{t('Step_1')}</p><h3 className="text-lg font-semibold text-white">{t('Buy_your_tickets')}</h3></div>
                            <div className="bg-gray-900/50 p-6 rounded-lg"><p className="text-yellow-400 font-bold mb-2">{t('Step_2')}</p><h3 className="text-lg font-semibold text-white">{t('Wait_for_the_draw')}</h3></div>
                            <div className="bg-gray-900/50 p-6 rounded-lg"><p className="text-yellow-400 font-bold mb-2">{t('Step_3')}</p><h3 className="text-lg font-semibold text-white">{t('Win_amazing_prizes')}</h3></div>
                        </div>
                    </div>
                    
                     <div className="mt-24 max-w-4xl mx-auto text-center bg-yellow-900/20 border border-yellow-400/30 p-8 rounded-xl">
                        <TicketIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4"/>
                        <h2 className="text-2xl font-bold text-yellow-300 mb-4">{t('Guaranteed_Reward')}</h2>
                        <p className="text-yellow-200/80 max-w-2xl mx-auto">{getTranslated(giveaway.bonus)}</p>
                    </div>
                </div>
            </div>
            
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
                        <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="relative bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md p-8 text-center">
                            <h2 className="text-2xl font-bold text-white mb-4">{t('Confirm_Purchase')}</h2>
                            <p className="text-gray-300 mb-6">{t('Are_you_sure_you_want_to_buy_tickets').replace('{count}', String(quantity)).replace('{price}', formatPrice(totalPrice))}</p>
                            <div className="flex justify-center space-x-4"><button onClick={() => setShowConfirmModal(false)} className="px-8 py-3 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600">{t('Cancel')}</button><button onClick={confirmPurchase} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200">{t('Confirm_Purchase')}</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default LotteryPage;