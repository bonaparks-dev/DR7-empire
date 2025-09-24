import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../contexts/CurrencyContext';
import { LOTTERY_GIVEAWAY } from '../constants';
import type { Lottery, Prize } from '../types';
import { useAuth } from '../hooks/useAuth';
import type { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { PrizeCarousel } from '../components/ui/PrizeCarousel';

// Safely access the Stripe publishable key from Vite's environment variables.
// If it's not available (e.g., in a non-Vite environment), it falls back to the live key.
const STRIPE_PUBLISHABLE_KEY = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51S3dDjQcprtTyo8tBfBy5mAZj8PQXkxfZ1RCnWskrWFZ2WEnm1u93ZnE2tBi316Gz2CCrvLV98IjSoiXb0vSDpOQ003fNG69Y2';

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
    <div className="bg-black/80 backdrop-blur-sm p-2 sm:p-3 rounded-lg text-center border border-white/30">
        <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tighter" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>{String(value).padStart(2, '0')}</div>
        <div className="text-xs sm:text-sm text-white/80 uppercase tracking-widest">{label}</div>
    </div>
);

// Simple text-only carousel component for prizes
const TextPrizeCarousel: React.FC<{ prizes: Prize[], autoplaySpeed?: number }> = ({ prizes, autoplaySpeed = 3000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const { getTranslated } = useTranslation();

    useEffect(() => {
        if (prizes.length === 0) return;
        
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % prizes.length);
        }, autoplaySpeed);

        return () => clearInterval(interval);
    }, [prizes.length, autoplaySpeed]);

    if (prizes.length === 0) return null;

    return (
        <div className="relative w-full max-w-md mx-auto">
            <div className="overflow-hidden rounded-2xl">
                <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {prizes.map((prize, index) => (
                        <div key={index} className="w-full flex-shrink-0">
                            <div className="bg-black/60 border border-white/40 rounded-2xl p-8 mx-4 text-center backdrop-blur-sm aspect-square flex flex-col justify-center">
                                {prize.quantity && <p className="text-3xl font-bold text-white mb-4">{prize.quantity}x</p>}
                                <h3 className="text-2xl font-semibold text-white mb-2">{getTranslated(prize.name)}</h3>
                                <p className="text-white/70 font-medium text-lg">{getTranslated(prize.tier)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PrizeCard: React.FC<{ prize: Prize }> = ({ prize }) => {
    const { getTranslated } = useTranslation();
    return (
        <div className="bg-black/60 border border-white/40 rounded-lg p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-black/80">
            {prize.quantity && <p className="text-2xl font-bold text-white mb-4">{prize.quantity}x</p>}
            <h3 className="text-lg font-semibold text-white">{getTranslated(prize.name)}</h3>
            <p className="text-sm text-white/70 mt-2">{getTranslated(prize.tier)}</p>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-black text-white">
            <div className="relative min-h-screen flex items-center justify-center text-center overflow-hidden pt-32 pb-24">
                <video src="/lottery.mp4" autoPlay loop muted playsInline className="absolute inset-0 z-0 w-full h-full object-cover brightness-75" />
                <div className="absolute inset-0 bg-black/20 z-10"></div>
                <div className="relative z-20 px-4 sm:px-6 container mx-auto">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-playfair uppercase tracking-wider" style={{ textShadow: '0 0 15px rgba(255,255,255,0.3)' }}>
                        {getTranslated(giveaway.name)}
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="mt-4 text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 font-semibold tracking-wide">
                        {getTranslated(giveaway.subtitle)}
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="mt-8 sm:mt-12">
                        <h3 className="text-base sm:text-lg font-semibold uppercase tracking-widest text-white/90 mb-4">{t('Draw_Ends_In')}</h3>
                        <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xs sm:max-w-sm mx-auto">
                            <TimerBox value={timeLeft.days} label={t('days')} />
                            <TimerBox value={timeLeft.hours} label={t('hours')} />
                            <TimerBox value={timeLeft.minutes} label={t('minutes')} />
                            <TimerBox value={timeLeft.seconds} label={t('seconds')} />
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="py-16 sm:py-20 md:py-24 bg-black">
                <div className="container mx-auto px-4 sm:px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.8 }}
                        className="mb-16 sm:mb-20 md:mb-24"
                    >
                        {/* First Carousel - Images */}
                        <div className="mb-12">
                            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Featured Prizes</h2>
                            <div className="max-w-md mx-auto">
                                <PrizeCarousel 
                                    prizes={giveaway.prizes.filter(p => p.image)} 
                                    autoplaySpeed={1500}
                                    showDots={false}
                                    dots={false}
                                    showIndicators={false}
                                />
                            </div>
                        </div>
                        
                        {/* Second Carousel - Text Prizes */}
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
                                Prize Pool Worth Over{' '}
                                <span className="text-white">$7,000,000</span>
                            </h2>
                            <TextPrizeCarousel 
                                prizes={giveaway.prizes} 
                                autoplaySpeed={1800}
                            />
                        </div>
                    </motion.div>

                    <div className="grid lg:grid-cols-1 gap-8 lg:gap-12 items-start">
                        <div className="lg:mx-auto max-w-2xl w-full">
                             <div className="bg-black/80 border border-white/40 rounded-xl p-6 md:p-8 backdrop-blur-sm">
                                <AnimatePresence>
                                    {successMessage && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            exit={{ opacity: 0, y: -10 }} 
                                            className="bg-green-600/30 text-green-200 p-3 rounded-md mb-4 text-center text-sm font-medium border border-green-500/50"
                                        >
                                            {successMessage}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="mb-4 sm:mb-6">
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">{t('How_many_tickets')}</h3>
                                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 mt-2">
                                        <div className="flex items-center space-x-2 bg-white/10 border border-white/30 rounded-full p-1">
                                            <button onClick={() => handleQuantityChange(-1)} className="w-8 h-8 sm:w-10 sm:h-10 font-bold text-white rounded-full hover:bg-white/20 transition-colors">-</button>
                                            <span className="w-12 sm:w-16 text-center text-white text-lg sm:text-xl font-bold">{quantity}</span>
                                            <button onClick={() => handleQuantityChange(1)} className="w-8 h-8 sm:w-10 sm:h-10 font-bold text-white rounded-full hover:bg-white/20 transition-colors">+</button>
                                        </div>
                                        <div className="flex space-x-2 w-full sm:w-auto justify-center flex-wrap gap-2">
                                            {[5, 10, 25, 50].map(val => (
                                                <button 
                                                    key={val} 
                                                    onClick={() => setQuantity(val)} 
                                                    className={`px-3 py-1 text-xs sm:text-sm rounded-full border transition-colors ${
                                                        quantity === val 
                                                            ? 'bg-white text-black border-white font-bold' 
                                                            : 'bg-black/60 border-white/60 text-white hover:border-white hover:bg-black/80'
                                                    }`}
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-lg sm:text-xl font-bold mb-6">
                                    <span className="text-white/80">{t('Total_Price_Lottery')}</span>
                                    <span className="text-white">{formatPrice(totalPrice)}</span>
                                </div>
                                <button 
                                    onClick={handleBuyClick} 
                                    className="w-full py-3 sm:py-4 px-6 bg-white text-black rounded-full font-bold uppercase tracking-wider text-sm sm:text-base hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
                                >
                                    {t('Buy_Tickets')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 sm:mt-20 md:mt-24 max-w-4xl mx-auto">
                        <h2 className="text-2xl sm:text-3xl font-bold font-playfair mb-6 sm:mb-8 text-center">{t('How_It_Works')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center">
                            <div className="bg-black/80 border border-white/40 p-6 rounded-lg">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-lg font-bold text-black">1</span>
                                </div>
                                <p className="text-white font-bold mb-2">{t('Step_1')}</p>
                                <h3 className="text-base sm:text-lg font-semibold text-white">{t('Buy_your_tickets')}</h3>
                            </div>
                            <div className="bg-black/80 border border-white/40 p-6 rounded-lg">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-lg font-bold text-black">2</span>
                                </div>
                                <p className="text-white font-bold mb-2">{t('Step_2')}</p>
                                <h3 className="text-base sm:text-lg font-semibold text-white">{t('Wait_for_the_draw')}</h3>
                            </div>
                            <div className="bg-black/80 border border-white/40 p-6 rounded-lg">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-lg font-bold text-black">3</span>
                                </div>
                                <p className="text-white font-bold mb-2">{t('Step_3')}</p>
                                <h3 className="text-base sm:text-lg font-semibold text-white">{t('Win_amazing_prizes')}</h3>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-16 sm:mt-20 md:mt-24 max-w-4xl mx-auto text-center">
                        <div className="bg-black/80 border border-white/50 p-6 sm:p-8 rounded-xl">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <span className="text-2xl sm:text-3xl">🎫</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">{t('Guaranteed_Reward')}</h2>
                            <p className="text-white/90 text-sm sm:text-base max-w-2xl mx-auto">{getTranslated(giveaway.bonus)}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={handleCloseModal} />
                        <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="relative bg-black border border-white/40 rounded-lg shadow-2xl w-full max-w-sm sm:max-w-md p-6 md:p-8 mx-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">{t('Confirm_Purchase')}</h2>
                            <p className="text-white/80 mb-4 sm:mb-6 text-center text-sm sm:text-base">{t('Are_you_sure_you_want_to_buy_tickets').replace('{count}', String(quantity)).replace('{price}', formatPrice(totalPrice))}</p>
                            
                            <div className="my-4 sm:my-6">
                                <label className="block text-sm sm:text-base font-medium text-white text-left mb-2">{t('Credit_Card')}</label>
                                <div className="bg-white/10 border border-white/50 rounded-lg p-3 sm:p-4 min-h-[48px] sm:min-h-[56px] flex items-center">
                                    {isClientSecretLoading ? 
                                        <div className="flex items-center text-white/70 text-sm sm:text-base">
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-t-white border-white/30 rounded-full mr-2"/>
                                            <span>{t('Processing')}...</span>
                                        </div> : 
                                        <div ref={cardElementRef} className="w-full" />
                                    }
                                </div>
                                {stripeError && <p className="text-xs sm:text-sm text-red-400 mt-2 text-left">{stripeError}</p>}
                            </div>

                            <div className="flex justify-center space-x-3 sm:space-x-4">
                                <button onClick={handleCloseModal} className="px-4 sm:px-6 py-2 sm:py-3 bg-white/20 text-white font-bold rounded-full hover:bg-white/30 text-sm sm:text-base transition-colors">{t('Cancel')}</button>
                                <button onClick={confirmPurchase} disabled={isProcessing || !clientSecret || isClientSecretLoading} className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-opacity disabled:opacity-60 text-sm sm:text-base">
                                    {isProcessing ? t('Processing') : `${t('Confirm_Purchase')} (${formatPrice(totalPrice)})`}
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
