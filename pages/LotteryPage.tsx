import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../contexts/CurrencyContext';
import { LOTTERY_GIVEAWAY } from '../constants';
import type { Lottery, Prize } from '../types';
import { TicketIcon } from '../components/icons/Icons';
import { useAuth } from '../hooks/useAuth';
import type { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

// Use the Stripe publishable key from environment variables.
const STRIPE_PUBLISHABLE_KEY = process.env.VITE_STRIPE_PUBLISHABLE_KEY;

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
    <div className="bg-black/50 backdrop-blur-sm p-2 sm:p-3 rounded-lg text-center border border-white/20">
        <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tighter" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>{String(value).padStart(2, '0')}</div>
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
    const { user } = useAuth();
    const giveaway: Lottery = LOTTERY_GIVEAWAY;

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(giveaway.drawDate));
    const [quantity, setQuantity] = useState(1);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [stripe, setStripe] = useState<Stripe | null>(null);
    const [cardElement, setCardElement] = useState<StripeCardElement | null>(null);
    const cardElementRef = useRef<HTMLDivElement>(null);
    const [stripeError, setStripeError] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    const ticketPrice = currency === 'eur' ? giveaway.ticketPriceEUR : giveaway.ticketPriceUSD;
    const totalPrice = quantity * ticketPrice;
    const formattedPrice = new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(totalPrice);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(giveaway.drawDate));
        }, 1000);
        return () => clearInterval(timer);
    }, [giveaway.drawDate]);
    
    useEffect(() => {
        if ((window as any).Stripe) {
            if (!STRIPE_PUBLISHABLE_KEY || !STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
                console.error("Stripe.js has loaded, but the publishable key is invalid. Ensure VITE_STRIPE_PUBLISHABLE_KEY is set correctly in your environment.");
                setStripeError("Payment service is not configured correctly. Please contact support.");
                return;
            }
            setStripe((window as any).Stripe(STRIPE_PUBLISHABLE_KEY));
        }
    }, []);

    useEffect(() => {
        if (showConfirmModal && totalPrice > 0) {
            fetch('/.netlify/functions/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: totalPrice, currency })
            }).then(res => res.json()).then(data => {
                if(data.error) setStripeError(data.error);
                else setClientSecret(data.clientSecret);
            }).catch(() => setStripeError('Could not connect to payment server.'));
        }
    }, [showConfirmModal, totalPrice, currency]);

    useEffect(() => {
        if (stripe && clientSecret && cardElementRef.current) {
            const elements = stripe.elements();
            const card = elements.create('card', {
                style: {
                    base: { color: '#ffffff', fontFamily: '"Exo 2", sans-serif', fontSize: '16px', '::placeholder': { color: '#a0aec0' } },
                    invalid: { color: '#ef4444', iconColor: '#ef4444' }
                }
            });
            card.mount(cardElementRef.current);
            setCardElement(card);
            card.on('change', event => setStripeError(event.error ? event.error.message : null));

            return () => card.destroy();
        }
    }, [stripe, clientSecret]);

    const handleConfirmPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        if (!stripe || !cardElement || !clientSecret) {
            setStripeError("Payment system is not ready.");
            setIsProcessing(false);
            return;
        }

        const { error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement, billing_details: { name: user?.fullName || 'Guest', email: user?.email } }
        });

        if (error) {
            setStripeError(error.message || "An unexpected error occurred.");
            setIsProcessing(false);
        } else {
            setShowConfirmModal(false);
            setIsConfirmed(true);
            setIsProcessing(false);
        }
    };
    
    // ... rest of the component
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <div className="relative pt-32 pb-24 bg-black min-h-screen text-white">
                <div className="absolute inset-0 z-0 opacity-30">
                    <img src={giveaway.image} alt={getTranslated(giveaway.name)} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/70"></div>
                </div>
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center">
                        <motion.h1 initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.2}} className="text-4xl md:text-6xl font-bold font-playfair">{getTranslated(giveaway.name)}</motion.h1>
                        <motion.p initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.4}} className="text-xl md:text-2xl text-gray-300 mt-4">{getTranslated(giveaway.subtitle)}</motion.p>
                    </div>

                    <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.6}} className="mt-12 flex justify-center gap-2 sm:gap-4 md:gap-6">
                        <TimerBox value={timeLeft.days} label="Days" />
                        <TimerBox value={timeLeft.hours} label="Hours" />
                        <TimerBox value={timeLeft.minutes} label="Minutes" />
                        <TimerBox value={timeLeft.seconds} label="Seconds" />
                    </motion.div>
                    
                    <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.8}} className="mt-12 max-w-md mx-auto bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold">{t('How_many_tickets')}</h2>
                        </div>
                        <div className="flex items-center justify-between bg-gray-800 rounded-full p-2">
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 bg-gray-700 rounded-full text-2xl hover:bg-gray-600">-</button>
                            <span className="text-3xl font-bold w-24 text-center">{quantity}</span>
                            <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 bg-gray-700 rounded-full text-2xl hover:bg-gray-600">+</button>
                        </div>
                        <div className="flex justify-between items-baseline mt-6">
                            <span className="text-lg text-gray-400">{t('Total_Price_Lottery')}</span>
                            <span className="text-3xl font-bold">{formattedPrice}</span>
                        </div>
                        <button onClick={() => setShowConfirmModal(true)} className="w-full mt-6 bg-white text-black font-bold py-4 px-6 rounded-full text-lg uppercase tracking-wider hover:bg-gray-200 transition-transform transform hover:scale-105">
                            {t('Buy_Tickets')}
                        </button>
                    </motion.div>
                </div>
            </div>
            {/* ... prize and how it works sections */}
        </motion.div>
    );
};

export default LotteryPage;