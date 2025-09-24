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
                            className="relative bg-black border border-white/30 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md p-6 sm:p-8 backdrop-blur-xl mx-4"
                        >
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">
                                {t('Confirm_Purchase')}
                            </h2>
                            <p className="text-white/80 mb-4 sm:mb-6 text-center text-sm sm:text-base">
                                {t('Are_you_sure_you_want_to_buy_tickets')
                                    .replace('{count}', String(quantity))
                                    .replace('{price}', formatPrice(totalPrice))}
                            </p>
                            
                            <div className="mb-4 sm:mb-6">
                                <label className="block text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                                    {t('Credit_Card')}
                                </label>
                                <div className="bg-white/10 border border-white/50 rounded-xl p-3 sm:p-4 min-h-[48px] sm:min-h-[56px] flex items-center">
                                    {isClientSecretLoading ? 
                                        <div className="flex items-center text-white/70 text-sm sm:text-base">
                                            <motion.div 
                                                animate={{ rotate: 360 }} 
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }} 
                                                className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-t-white border-white/30 rounded-full mr-2 sm:mr-3"
                                            />
                                            <span>{t('Processing')}...</span>
                                        </div> : 
                                        <div ref={cardElementRef} className="w-full" />
                                    }
                                </div>
                                {stripeError && (
                                    <p className="text-red-400 mt-2 sm:mt-3 text-xs sm:text-sm">{stripeError}</p>
                                )}
                            </div>

                            <div className="flex space-x-3 sm:space-x-4">
                                <button 
                                    onClick={handleCloseModal} 
                                    className="flex-1 py-2.5 sm:py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors text-sm sm:text-base"
                                >
                                    {t('Cancel')}
                                </button>
                                <button 
                                    onClick={confirmPurchase} 
                                    disabled={isProcessing || !clientSecret || isClientSecretLoading} 
                                    className="flex-1 py-2.5 sm:py-3 bg-white hover:bg-gray-200 text-black font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                >
                                    {isProcessing ? t('Processing') : t('Confirm_Purchase')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../contexts/CurrencyContext';
import { LOTTERY_GIVEAWAY } from '../constants';
import type { Lottery, Prize } from '../types';
import { useAuth } from '../hooks/useAuth';
import type { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { PrizeCarousel } from '../components/ui/PrizeCarousel';

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
    <div className="bg-black/80 backdrop-blur-sm p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl text-center border border-white/30">
        <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
            {String(value).padStart(2, '0')}
        </div>
        <div className="text-xs sm:text-sm text-white/80 uppercase tracking-wider">{label}</div>
    </div>
);

const PrizeCard: React.FC<{ prize: Prize }> = ({ prize }) => {
    const { getTranslated } = useTranslation();
    
    return (
        <div className="bg-black/60 border border-white/30 rounded-xl p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-black/80">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-black">
                    {prize.quantity ? prize.quantity : '1'}
                </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{getTranslated(prize.name)}</h3>
            <p className="text-sm text-white/80 font-medium">{getTranslated(prize.tier)}</p>
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
            className="bg-black text-white min-h-screen"
        >
            {/* Hero Section */}
            <div className="relative min-h-screen flex items-center justify-center text-center overflow-hidden">
                <video 
                    src="/lottery.mp4" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="absolute inset-0 z-0 w-full h-full object-cover opacity-40" 
                />
                <div className="absolute inset-0 bg-black/20 z-10"></div>
                
                <div className="relative z-20 px-4 sm:px-6 container mx-auto max-w-6xl">
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.8, delay: 0.2 }} 
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 px-2"
                        style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}
                    >
                        {getTranslated(giveaway.name)}
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.8, delay: 0.4 }} 
                        className="text-lg sm:text-xl md:text-2xl text-white/90 mb-12 sm:mb-16 max-w-3xl mx-auto leading-relaxed px-4"
                    >
                        {getTranslated(giveaway.subtitle)}
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.8, delay: 0.6 }} 
                        className="mb-8 sm:mb-12"
                    >
                        <h3 className="text-lg sm:text-xl font-semibold uppercase tracking-widest text-white mb-6 sm:mb-8">
                            {t('Draw_Ends_In')}
                        </h3>
                        <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xs sm:max-w-lg mx-auto px-4">
                            <TimerBox value={timeLeft.days} label={t('days')} />
                            <TimerBox value={timeLeft.hours} label={t('hours')} />
                            <TimerBox value={timeLeft.minutes} label={t('minutes')} />
                            <TimerBox value={timeLeft.seconds} label={t('seconds')} />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="py-16 sm:py-20 md:py-24 px-4 sm:px-6">
                <div className="container mx-auto max-w-7xl">
                    
                    {/* Prize Showcase */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.8 }}
                        className="mb-16 sm:mb-20 md:mb-24"
                    >
                        <div className="text-center mb-12 sm:mb-16">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 px-4">
                                {t('Prizes_Pool_Text')}
                            </h2>
                            <div className="text-xl sm:text-2xl font-semibold text-white px-4">
                                {t('Prizes_Pool_Value')}
                            </div>
                        </div>
                        
                        {/* Prize Carousel */}
                        <div className="px-2 sm:px-0">
                            <PrizeCarousel 
                                prizes={giveaway.prizes.filter(p => p.image)} 
                                autoplaySpeed={1800}
                                showDots={false}
                            />
                        </div>
                    </motion.div>

                    {/* Purchase Section */}
                    <div className="max-w-2xl mx-auto px-4">
                        <div className="bg-black/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/30">
                            
                            <AnimatePresence>
                                {successMessage && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }} 
                                        animate={{ opacity: 1, scale: 1 }} 
                                        exit={{ opacity: 0, scale: 0.95 }} 
                                        className="bg-green-600/30 text-green-200 p-4 rounded-xl mb-6 text-center font-medium border border-green-500/50"
                                    >
                                        {successMessage}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            <div className="text-center mb-6 sm:mb-8">
                                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                                    {t('How_many_tickets')}
                                </h3>
                                <p className="text-white/70 text-sm sm:text-base">Select the number of tickets you want to purchase</p>
                            </div>

                            <div className="mb-6 sm:mb-8">
                                <div className="flex items-center justify-center mb-4 sm:mb-6">
                                    <div className="flex items-center bg-white/10 rounded-full p-2 border border-white/30">
                                        <button 
                                            onClick={() => handleQuantityChange(-1)} 
                                            className="w-10 h-10 sm:w-12 sm:h-12 font-bold text-white rounded-full hover:bg-white/20 transition-colors text-lg sm:text-xl"
                                        >
                                            −
                                        </button>
                                        <span className="w-14 sm:w-16 text-center text-white text-xl sm:text-2xl font-bold">
                                            {quantity}
                                        </span>
                                        <button 
                                            onClick={() => handleQuantityChange(1)} 
                                            className="w-10 h-10 sm:w-12 sm:h-12 font-bold text-white rounded-full hover:bg-white/20 transition-colors text-lg sm:text-xl"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex justify-center space-x-2 sm:space-x-3 flex-wrap gap-2">
                                    {[5, 10, 25, 50].map(val => (
                                        <button 
                                            key={val} 
                                            onClick={() => setQuantity(val)} 
                                            className={`px-3 sm:px-4 py-2 rounded-full border transition-all text-sm sm:text-base ${
                                                quantity === val 
                                                    ? 'bg-white text-black border-white font-bold' 
                                                    : 'bg-black/50 border-white/50 text-white hover:border-white hover:bg-black/70'
                                            }`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-white/10 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-white/30">
                                <div className="flex justify-between items-center text-lg sm:text-xl">
                                    <span className="text-white/80">Total Price:</span>
                                    <span className="text-white font-bold text-xl sm:text-2xl">
                                        {formatPrice(totalPrice)}
                                    </span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleBuyClick} 
                                className="w-full py-3 sm:py-4 bg-white text-black hover:bg-gray-200 rounded-xl font-bold text-base sm:text-lg uppercase tracking-wider transition-all duration-300 transform hover:scale-[1.02] shadow-xl"
                            >
                                {t('Buy_Tickets')}
                            </button>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="mt-16 sm:mt-20 md:mt-24 max-w-5xl mx-auto px-4">
                        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16">{t('How_It_Works')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                            <div className="text-center bg-black/80 p-6 sm:p-8 rounded-2xl border border-white/30">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                    <span className="text-2xl font-bold text-black">1</span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">{t('Buy_your_tickets')}</h3>
                                <p className="text-white/80 text-sm sm:text-base">Choose your tickets and complete the purchase</p>
                            </div>
                            
                            <div className="text-center bg-black/80 p-6 sm:p-8 rounded-2xl border border-white/30">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                    <span className="text-2xl font-bold text-black">2</span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">{t('Wait_for_the_draw')}</h3>
                                <p className="text-white/80 text-sm sm:text-base">Sit back and wait for the draw results</p>
                            </div>
                            
                            <div className="text-center bg-black/80 p-6 sm:p-8 rounded-2xl border border-white/30">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                    <span className="text-2xl font-bold text-black">3</span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">{t('Win_amazing_prizes')}</h3>
                                <p className="text-white/80 text-sm sm:text-base">Claim your incredible rewards</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Guaranteed Reward */}
                    <div className="mt-16 sm:mt-20 md:mt-24 max-w-4xl mx-auto text-center px-4">
                        <div className="bg-black/80 border border-white/50 p-6 sm:p-8 rounded-2xl backdrop-blur-sm">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <span className="text-2xl sm:text-3xl">🎫</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">{t('Guaranteed_Reward')}</h2>
                            <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
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
                            className="relative bg-black border border-white/30 rounded-2xl shadow-2xl w-full max-w-md p-8 backdrop-blur-xl"
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
                                <div className="bg-white/10 border border-white/50 rounded-xl p-4 min-h-[56px] flex items-center">
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
                                    className="flex-1 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors"
                                >
                                    {t('Cancel')}
                                </button>
                                <button 
                                    onClick={confirmPurchase} 
                                    disabled={isProcessing || !clientSecret || isClientSecretLoading} 
                                    className="flex-1 py-3 bg-white hover:bg-gray-200 text-black font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
