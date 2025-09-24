import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../contexts/CurrencyContext';
import { LOTTERY_GIVEAWAY } from '../constants';
import type { Lottery, Prize } from '../types';
import { useAuth } from '../hooks/useAuth';
import type { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

const STRIPE_PUBLISHABLE_KEY = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || 'YOUR_STRIPE_PUBLISHABLE_KEY';

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
    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl text-center border border-white/20">
        <div className="text-4xl sm:text-5xl font-bold text-white mb-1" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
            {String(value).padStart(2, '0')}
        </div>
        <div className="text-sm text-white/70 uppercase tracking-wider">{label}</div>
    </div>
);

const PrizeCard: React.FC<{ prize: Prize }> = ({ prize }) => {
    const { getTranslated } = useTranslation();
    
    return (
        <div className="bg-white/5 border border-white/20 rounded-xl p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/10">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-black">
                    {prize.quantity ? prize.quantity : '1'}
                </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{getTranslated(prize.name)}</h3>
            <p className="text-sm text-amber-200/80 font-medium">{getTranslated(prize.tier)}</p>
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
    const [successMessage, setSuccessMessage] = useState('');

    const [stripe, setStripe] = useState<Stripe | null>(null);
    const [elements, setElements] = useState<StripeElements | null>(null);
    const cardElementRef = useRef<HTMLDivElement>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isClientSecretLoading, setIsClientSecretLoading] = useState(false);
    const [stripeError, setStripeError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if ((window as any).Stripe) {
            if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.startsWith('YOUR_')) {
                console.error("Stripe.js has loaded, but the publishable key is not set.");
                setStripeError("Payment service is not configured correctly. Please contact support.");
                return;
            }
            const stripeInstance = (window as any).Stripe(STRIPE_PUBLISHABLE_KEY);
            setStripe(stripeInstance);
            setElements(stripeInstance.elements());
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft(giveaway.drawDate));
        }, 1000);
        return () => clearTimeout(timer);
    });

    const ticketPrice = currency === 'usd' ? giveaway.ticketPriceUSD : giveaway.ticketPriceEUR;
    const totalPrice = useMemo(() => quantity * ticketPrice, [quantity, ticketPrice]);

    const handleQuantityChange = (amount: number) => setQuantity(prev => Math.max(1, prev + amount));
    
    const handleBuyClick = () => {
        setShowConfirmModal(true);
    };
    
    const handleCloseModal = () => {
        setShowConfirmModal(false);
        setClientSecret(null);
        setStripeError(null);
    };

    useEffect(() => {
        if (showConfirmModal && totalPrice > 0) {
            setIsClientSecretLoading(true);
            setStripeError(null);
            setClientSecret(null);

            fetch('/.netlify/functions/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: totalPrice, currency })
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setStripeError(data.error);
                } else {
                    setClientSecret(data.clientSecret);
                }
            })
            .catch(error => {
                console.error('Failed to fetch client secret:', error);
                setStripeError('Could not connect to payment server.');
            })
            .finally(() => {
                setIsClientSecretLoading(false);
            });
        }
    }, [showConfirmModal, totalPrice, currency]);

    useEffect(() => {
        if (elements && clientSecret && cardElementRef.current) {
            const card = elements.create('card', {
                style: {
                    base: { color: '#ffffff', fontFamily: '"Exo 2", sans-serif', fontSize: '16px', '::placeholder': { color: '#a0aec0' } },
                    invalid: { color: '#ef4444', iconColor: '#ef4444' }
                }
            });
            card.mount(cardElementRef.current);
            card.on('change', (event) => {
                setStripeError(event.error ? event.error.message : null);
            });

            return () => {
                card.destroy();
            };
        }
    }, [elements, clientSecret]);
    
    const confirmPurchase = async () => {
        if (!stripe || !elements || !clientSecret || isProcessing) return;
        
        const cardElement = elements.getElement('card');
        if (!cardElement) {
            setStripeError("Card element not found. Please try again.");
            return;
        }
        
        setIsProcessing(true);
        setStripeError(null);

        const { error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: user?.fullName || 'Guest Buyer',
                    email: user?.email,
                },
            },
        });

        if (error) {
            setStripeError(error.message || "An unexpected error occurred.");
            setIsProcessing(false);
        } else {
            setShowConfirmModal(false);
            setSuccessMessage(t('Purchase_Successful_Message').replace('{count}', String(quantity)));
            setTimeout(() => setSuccessMessage(''), 5000);
            setQuantity(1);
            setIsProcessing(false);
        }
    };
    
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
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white min-h-screen"
        >
            {/* Hero Section */}
            <div className="relative min-h-screen flex items-center justify-center text-center overflow-hidden">
                <video 
                    src="/lottery.mp4" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="absolute inset-0 z-0 w-full h-full object-cover opacity-30" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 z-10"></div>
                
                <div className="relative z-20 px-6 container mx-auto max-w-6xl">
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.8, delay: 0.2 }} 
                        className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
                        style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}
                    >
                        {getTranslated(giveaway.name)}
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.8, delay: 0.4 }} 
                        className="text-xl sm:text-2xl text-white/90 mb-16 max-w-3xl mx-auto leading-relaxed"
                    >
                        {getTranslated(giveaway.subtitle)}
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.8, delay: 0.6 }} 
                        className="mb-12"
                    >
                        <h3 className="text-xl font-semibold uppercase tracking-widest text-amber-300 mb-8">
                            {t('Draw_Ends_In')}
                        </h3>
                        <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
                            <TimerBox value={timeLeft.days} label={t('days')} />
                            <TimerBox value={timeLeft.hours} label={t('hours')} />
                            <TimerBox value={timeLeft.minutes} label={t('minutes')} />
                            <TimerBox value={timeLeft.seconds} label={t('seconds')} />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="py-24 px-6">
                <div className="container mx-auto max-w-7xl">
                    
                    {/* Prize Showcase */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.8 }}
                        className="mb-24"
                    >
                        <div className="text-center mb-16">
                            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                                {t('Prizes_Pool_Text')}
                            </h2>
                            <div className="text-2xl font-semibold text-amber-400">
                                {t('Prizes_Pool_Value')}
                            </div>
                        </div>
                        
                        <div className="space-y-16">
                            {Object.entries(groupedPrizes).map(([tier, prizes]) => (
                                <div key={tier} className="text-center">
                                    <h3 className="text-2xl font-bold text-amber-300 mb-8 uppercase tracking-wider">
                                        {tier}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
                                        {prizes.map((prize, idx) => (
                                            <PrizeCard key={idx} prize={prize} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Purchase Section */}
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                            
                            <AnimatePresence>
                                {successMessage && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }} 
                                        animate={{ opacity: 1, scale: 1 }} 
                                        exit={{ opacity: 0, scale: 0.95 }} 
                                        className="bg-green-500/20 text-green-300 p-4 rounded-xl mb-6 text-center font-medium border border-green-500/30"
                                    >
                                        {successMessage}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    {t('How_many_tickets')}
                                </h3>
                                <p className="text-white/70">Select the number of tickets you want to purchase</p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-center justify-center mb-6">
                                    <div className="flex items-center bg-black/30 rounded-full p-2 border border-white/20">
                                        <button 
                                            onClick={() => handleQuantityChange(-1)} 
                                            className="w-12 h-12 font-bold text-white rounded-full hover:bg-white/20 transition-colors"
                                        >
                                            −
                                        </button>
                                        <span className="w-16 text-center text-white text-2xl font-bold">
                                            {quantity}
                                        </span>
                                        <button 
                                            onClick={() => handleQuantityChange(1)} 
                                            className="w-12 h-12 font-bold text-white rounded-full hover:bg-white/20 transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex justify-center space-x-3 flex-wrap gap-2">
                                    {[5, 10, 25, 50].map(val => (
                                        <button 
                                            key={val} 
                                            onClick={() => setQuantity(val)} 
                                            className={`px-4 py-2 rounded-full border transition-all ${
                                                quantity === val 
                                                    ? 'bg-white text-black border-white font-bold' 
                                                    : 'bg-white/10 border-white/30 text-white hover:border-white/70 hover:bg-white/20'
                                            }`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-black/30 rounded-xl p-6 mb-8 border border-white/20">
                                <div className="flex justify-between items-center text-xl">
                                    <span className="text-white/80">Total Price:</span>
                                    <span className="text-white font-bold text-2xl">
                                        {formatPrice(totalPrice)}
                                    </span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleBuyClick} 
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-bold text-lg uppercase tracking-wider transition-all duration-300 transform hover:scale-[1.02] shadow-xl"
                            >
                                {t('Buy_Tickets')}
                            </button>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="mt-24 max-w-5xl mx-auto">
                        <h2 className="text-4xl font-bold text-center mb-16">{t('How_It_Works')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center bg-white/5 p-8 rounded-2xl border border-white/20">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-white">1</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-4">{t('Buy_your_tickets')}</h3>
                                <p className="text-white/70">Choose your tickets and complete the purchase</p>
                            </div>
                            
                            <div className="text-center bg-white/5 p-8 rounded-2xl border border-white/20">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-white">2</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-4">{t('Wait_for_the_draw')}</h3>
                                <p className="text-white/70">Sit back and wait for the draw results</p>
                            </div>
                            
                            <div className="text-center bg-white/5 p-8 rounded-2xl border border-white/20">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl font-bold text-white">3</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-4">{t('Win_amazing_prizes')}</h3>
                                <p className="text-white/70">Claim your incredible rewards</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Guaranteed Reward */}
                    <div className="mt-24 max-w-4xl mx-auto text-center">
                        <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-400/40 p-8 rounded-2xl backdrop-blur-sm">
                            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">🎫</span>
                            </div>
                            <h2 className="text-3xl font-bold text-amber-300 mb-6">{t('Guaranteed_Reward')}</h2>
                            <p className="text-amber-200/90 text-lg max-w-2xl mx-auto leading-relaxed">
                                {getTranslated(giveaway.bonus)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Purchase Modal */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
                            onClick={handleCloseModal} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.95 }} 
                            className="relative bg-slate-900 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md p-8 backdrop-blur-xl"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 text-center">
                                {t('Confirm_Purchase')}
                            </h2>
                            <p className="text-white/80 mb-6 text-center">
                                {t('Are_you_sure_you_want_to_buy_tickets')
                                    .replace('{count}', String(quantity))
                                    .replace('{price}', formatPrice(totalPrice))}
                            </p>
                            
                            <div className="mb-6">
                                <label className="block text-white font-medium mb-3">
                                    {t('Credit_Card')}
                                </label>
                                <div className="bg-black/20 border border-white/30 rounded-xl p-4 min-h-[56px] flex items-center">
                                    {isClientSecretLoading ? 
                                        <div className="flex items-center text-white/70">
                                            <motion.div 
                                                animate={{ rotate: 360 }} 
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }} 
                                                className="w-5 h-5 border-2 border-t-white border-white/30 rounded-full mr-3"
                                            />
                                            <span>{t('Processing')}...</span>
                                        </div> : 
                                        <div ref={cardElementRef} className="w-full" />
                                    }
                                </div>
                                {stripeError && (
                                    <p className="text-red-400 mt-3 text-sm">{stripeError}</p>
                                )}
                            </div>

                            <div className="flex space-x-4">
                                <button 
                                    onClick={handleCloseModal} 
                                    className="flex-1 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
                                >
                                    {t('Cancel')}
                                </button>
                                <button 
                                    onClick={confirmPurchase} 
                                    disabled={isProcessing || !clientSecret || isClientSecretLoading} 
                                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? t('Processing') : t('Confirm_Purchase')}
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
