import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../contexts/CurrencyContext';
import { COMMERCIAL_OPERATION_GIVEAWAY } from '../constants';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import type { CommercialOperation, Prize } from '../types';
import { useAuth } from '../hooks/useAuth';
import type { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { supabase } from '../supabaseClient';
import NewClientModal from '../components/NewClientModal';
import { getUserCreditBalance, deductCredits, hasSufficientBalance } from '../utils/creditWallet';

// Lottery Promo Bundle Prices
// 10 tickets = €219
// 50 tickets = €899
// 100 tickets = €1699
// 150 tickets = €1999 (New Tier)

// Safely access the Stripe publishable key from Vite's environment variables.
// If it's not available (e.g., in a non-Vite environment), it falls back to a placeholder.
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51S3dDjQcprtTyo8tBfBy5mAZj8PQXkxfZ1RCnWskrWFZ2WEnm1u93ZnE2tBi316Gz2CCrvLV98IjSoiXb0vSDpOQ003fNG69Y2';

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
        <div className="text-[9px] sm:text-[10px] text-white/80 uppercase tracking-wider">{label}</div>
    </div>
);

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

const CommercialOperationPage: React.FC = () => {
    const { t, getTranslated } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const giveaway: CommercialOperation = COMMERCIAL_OPERATION_GIVEAWAY;

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(giveaway.drawDate));
    const [quantity, setQuantity] = useState(1);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');

    const [stripe, setStripe] = useState<Stripe | null>(null);
    const [elements, setElements] = useState<StripeElements | null>(null);
    const cardElementRef = useRef<HTMLDivElement>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isClientSecretLoading, setIsClientSecretLoading] = useState(false);
    const [stripeError, setStripeError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showClientModal, setShowClientModal] = useState(false);
    const [clientId, setClientId] = useState<string | null>(null);
    const [customerExtendedData, setCustomerExtendedData] = useState<any>(null);

    // Credit wallet state
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'credit'>('stripe');
    const [creditBalance, setCreditBalance] = useState<number>(0);
    const [isLoadingBalance, setIsLoadingBalance] = useState(true);

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

    // We always show NewClientModal now, so no need to check for existing record
    // This prevents unnecessary Supabase queries that could fail due to network issues

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft(giveaway.drawDate));
        }, 1000);
        return () => clearTimeout(timer);
    });

    const ticketPrice = giveaway.ticketPriceEUR;

    // Calculate discounted price based on quantity
    const calculateTotalPrice = (qty: number): number => {
        if (qty < 10) {
            // No discount for less than 10 tickets
            return qty * 25;
        } else if (qty >= 10 && qty < 50) {
            // Tier 1: 10 tickets for 219€ -> 21.9€/ticket
            // For intermediate, let's keep it simple: 21.9 * qty? 
            // Or just step-based? User asked for specific bundles.
            // If they pick 11? Let's interpolate or just use the per-ticket price of the nearest lower tier.
            // 10 tickets = 219. (21.9/ticket)
            return qty * 21.9;
        } else if (qty >= 50 && qty < 100) {
            // Tier 2: 50 tickets for 899€ -> ~17.98€/ticket
            return qty * 17.98;
        } else if (qty >= 100 && qty < 150) {
            // Tier 3: 100 tickets for 1699€ -> 16.99€/ticket
            return qty * 16.99;
        } else {
            // Tier 4: 150 tickets for 1999€ -> 13.33€/ticket
            // For > 150, apply 13.33 each
            return qty * 13.326; // approx to match 1999 for 150
        }
    };

    const totalPrice = useMemo(() => calculateTotalPrice(quantity), [quantity]);

    const handleQuantityChange = (amount: number) => setQuantity(prev => Math.max(1, prev + amount));

    const handleBuyClick = async () => {
        if (!user) {
            navigate('/signin', { state: { from: location } });
            return;
        }

        try {
            // 1. Check customers_extended first
            let clientData = null;
            let source = '';

            const { data: extData } = await supabase
                .from('customers_extended')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (extData) {
                clientData = extData;
                source = 'extended';
            } else {
                // 2. Check clienti_estesi (legacy)
                const { data: legacyData } = await supabase
                    .from('clienti_estesi')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (legacyData) {
                    clientData = legacyData;
                    source = 'legacy';
                }
            }

            if (clientData) {
                // User has existing client data matching our records
                setClientId(clientData.id);
                setCustomerExtendedData(clientData);

                // Pre-fill payment form with existing customer data
                if (source === 'extended') {
                    setFullName(
                        clientData.tipo_cliente === 'azienda'
                            ? clientData.denominazione || clientData.ragione_sociale || ''
                            : `${clientData.nome || ''} ${clientData.cognome || ''}`.trim()
                    );
                    setEmail(clientData.email || user.email || '');
                    setPhoneNumber(clientData.telefono || '');
                } else {
                    // Legacy mapping
                    if (clientData.tipo_cliente === 'persona_fisica') {
                        setFullName(`${clientData.nome || ''} ${clientData.cognome || ''}`.trim());
                    } else if (clientData.tipo_cliente === 'azienda') {
                        setFullName(clientData.ragione_sociale || clientData.denominazione || '');
                    } else if (clientData.tipo_cliente === 'pubblica_amministrazione') {
                        setFullName(clientData.denominazione || clientData.ente_ufficio || '');
                    }
                    setEmail(clientData.email || user.email || '');
                    setPhoneNumber(clientData.telefono || '');
                }

                setShowConfirmModal(true);
            } else {
                // No existing detailed client data found
                // BYPASS NewClientModal -> Go directly to payment with Auth data
                setClientId(null);
                setCustomerExtendedData(null);

                setFullName(user.fullName || '');
                setEmail(user.email || '');
                setPhoneNumber(user.phone || '');

                setShowConfirmModal(true);
            }

        } catch (err) {
            console.error('Error in handleBuyClick:', err);
            // On error, fallback to direct payment modal with basic auth info
            setClientId(null);
            setFullName(user.fullName || '');
            setEmail(user.email || '');
            setShowConfirmModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowConfirmModal(false);
        setClientSecret(null);
        setStripeError(null);
    };

    const handleClientCreated = (newClientId: string, customerData: any) => {
        setClientId(newClientId);
        setCustomerExtendedData(customerData); // Store the complete customer data
        setShowClientModal(false);

        // Pre-fill payment form with customer data
        if (customerData) {
            // Extract name based on customer type
            if (customerData.tipo_cliente === 'persona_fisica') {
                setFullName(`${customerData.nome || ''} ${customerData.cognome || ''}`.trim());
            } else if (customerData.tipo_cliente === 'azienda') {
                setFullName(customerData.ragione_sociale || customerData.denominazione || '');
            } else if (customerData.tipo_cliente === 'pubblica_amministrazione') {
                setFullName(customerData.denominazione || customerData.ente_ufficio || '');
            }

            setEmail(customerData.email || '');
            setPhoneNumber(customerData.telefono || '');
        }

        // Automatically show the payment modal after client creation
        setShowConfirmModal(true);
    };

    // Fetch credit balance
    useEffect(() => {
        const fetchBalance = async () => {
            if (user?.id) {
                setIsLoadingBalance(true);
                try {
                    const balance = await getUserCreditBalance(user.id);
                    setCreditBalance(balance);
                } catch (error) {
                    console.error('Error fetching credit balance:', error);
                } finally {
                    setIsLoadingBalance(false);
                }
            }
        };

        fetchBalance();
    }, [user]);

    useEffect(() => {
        if (showConfirmModal && totalPrice > 0) {
            setIsClientSecretLoading(true);
            setStripeError(null);
            setClientSecret(null);

            fetch('/.netlify/functions/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: totalPrice, currency: 'eur', email: user?.email })
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
    }, [showConfirmModal, totalPrice, user]);

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
        if (!stripe || !elements || !clientSecret || isProcessing || !user) return;

        if (!fullName || fullName.trim() === '') {
            setStripeError("Il nome completo è obbligatorio.");
            return;
        }

        if (!email || email.trim() === '' || !email.includes('@')) {
            setStripeError("Un indirizzo email valido è obbligatorio.");
            return;
        }

        if (!phoneNumber || phoneNumber.trim() === '') {
            setStripeError("Il numero di telefono è obbligatorio.");
            return;
        }

        const cardElement = elements.getElement('card');
        if (!cardElement) {
            setStripeError("Card element not found. Please try again.");
            return;
        }

        setIsProcessing(true);
        setStripeError(null);

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: fullName,
                    email: email,
                    phone: phoneNumber,
                },
            },
        });

        if (error) {
            setStripeError(error.message || "An unexpected error occurred.");
            setIsProcessing(false);
        } else {
            fetch('/.netlify/functions/generate-commercial-operation-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    fullName: fullName,
                    phone: phoneNumber,
                    quantity,
                    paymentIntentId: paymentIntent.id,
                    clientId: clientId,
                    customerData: customerExtendedData // Pass complete customer data for email
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        navigate('/commercial-operation/success', { state: { tickets: data.tickets, ownerName: fullName } });
                    } else {
                        setStripeError(data.error || 'Failed to generate tickets after payment.');
                    }
                })
                .catch(err => {
                    console.error(err);
                    setStripeError('An error occurred while finalizing your purchase.');
                })
                .finally(() => {
                    setIsProcessing(false);
                    setShowConfirmModal(false);
                });
        }
    };

    const formatPrice = (price: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(price);

    const stelvioImages = useMemo(() => {
        return Array.from({ length: 28 }, (_, i) => `/s${i + 1}.jpeg`);
    }, []);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-black text-white font-exo2">
            <div className="relative min-h-screen flex items-center justify-center text-center overflow-hidden pt-32 pb-24">
                {/* Background Carousel */}
                <div className="absolute inset-0 z-0">
                    <ImageCarousel images={stelvioImages} autoplaySpeed={1200} />
                    <div className="absolute inset-0 bg-black/70" />
                </div>

                <div className="relative z-20 px-4 sm:px-6 container mx-auto">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-exo2 uppercase tracking-wider mb-4" style={{ textShadow: '0 0 15px rgba(255,255,255,0.3)' }}>
                        LOTTERIA
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 font-semibold tracking-wide mb-12">
                        Vinci un'Alfa Romeo Stelvio Quadrifoglio
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="mt-4">
                        <h3 className="text-base sm:text-lg font-semibold uppercase tracking-widest text-white/90 mb-4">L'estrazione termina tra</h3>
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
                        {/* Info Section */}
                        <div className="text-center mb-12 space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-xl sm:text-2xl font-semibold text-white/90">In palio: 50.000€</h3>
                                </div>

                                <div className="space-y-3 max-w-3xl mx-auto">
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                                        ALFA ROMEO STELVIO QUADRIFOGLIO 510 CV
                                    </h2>
                                    <p className="text-lg sm:text-xl text-white/80">
                                        Motore Ferrari. Potenza pura. Un mostro da strada.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <p className="text-lg sm:text-xl text-white/90 font-semibold">
                                    LA VETTURA È VISIBILE IN VIALE MARCONI 229, Cagliari
                                </p>

                                <div className="space-y-4 max-w-2xl mx-auto">
                                    <p className="text-2xl sm:text-3xl font-bold text-white">
                                        UN BIGLIETTO. 25€.
                                    </p>
                                    <p className="text-lg sm:text-xl text-white/80">
                                        Una chance reale di portarti a casa un'auto da sogno.
                                    </p>
                                    <p className="text-xl sm:text-2xl font-bold text-white">
                                        GIOCA ORA.
                                    </p>
                                    <p className="text-lg text-white/70">
                                        Prima che finiscano.
                                    </p>
                                </div>
                            </div>
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
                                            {[10, 50, 100, 150].map(val => (
                                                <button
                                                    key={val}
                                                    onClick={() => setQuantity(val)}
                                                    className={`px-3 py-1 text-xs sm:text-sm rounded-full border transition-colors ${quantity === val
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

                                {/* Show discount information */}
                                <div className="mb-4 p-3 bg-dr7-gold/20 border border-dr7-gold rounded-lg">
                                    <p className="text-sm text-dr7-gold font-semibold text-center">
                                        {quantity >= 10 && quantity < 50 && `Sconto applicato: ${(quantity * 25 - totalPrice).toFixed(2)}€ risparmiati!`}
                                        {quantity >= 50 && quantity < 100 && `Sconto applicato: ${(quantity * 25 - totalPrice).toFixed(2)}€ risparmiati!`}
                                        {quantity >= 100 && quantity < 150 && `Sconto applicato: ${(quantity * 25 - totalPrice).toFixed(2)}€ risparmiati!`}
                                        {quantity >= 150 && `MAX SCONTO applicato: ${(quantity * 25 - totalPrice).toFixed(2)}€ risparmiati!`}
                                    </p>
                                </div>

                                <div className="flex justify-between items-center text-lg sm:text-xl font-bold mb-6">
                                    <span className="text-white/80">{t('Total_Price')}</span>
                                    <div className="flex flex-col items-end">
                                        {quantity >= 10 && (
                                            <span className="text-sm text-white/50 line-through">€{(quantity * 25).toFixed(2)}</span>
                                        )}
                                        <span className="text-white">{formatPrice(totalPrice)}</span>
                                    </div>
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
                        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">{t('How_It_Works')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center">
                            <div className="bg-black/80 border border-white/40 p-6 rounded-lg">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-lg font-bold text-black">1</span>
                                </div>
                                <p className="text-white font-bold mb-2">{t('Step_1')}</p>
                                <h3 className="text-base sm:text-lg font-semibold text-white">{t('Buy_your_tickets')}</h3>
                                <p className="text-sm text-white/70 mt-2">Fine vendita: 22 Gennaio 2025</p>
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
                        <div className="text-center mt-12">
                            <Link to="/win-rules" className="inline-block py-3 sm:py-4 px-8 bg-white text-black rounded-full font-bold uppercase tracking-wider text-sm sm:text-base hover:bg-gray-200 transition-all duration-300 transform hover:scale-105">
                                Regolamento
                            </Link>
                        </div>
                    </div>

                </div>
            </div>

            {/* New Client Modal - shown when user doesn't have a client record */}
            <NewClientModal
                isOpen={showClientModal}
                onClose={() => setShowClientModal(false)}
                onClientCreated={handleClientCreated}
            />

            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={handleCloseModal} />
                        <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="relative bg-black border border-white/40 rounded-lg shadow-2xl w-full max-w-sm sm:max-w-md p-6 md:p-8 mx-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">{t('Confirm_Purchase')}</h2>
                            <p className="text-white/80 mb-4 sm:mb-6 text-center text-sm sm:text-base">{t('Are_you_sure_you_want_to_buy_tickets').replace('{count}', String(quantity)).replace('{price}', formatPrice(totalPrice))}</p>

                            {clientId ? (
                                <div className="bg-white/5 border border-white/20 rounded-lg p-4 mb-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dati Intestatario</h3>
                                        <button
                                            onClick={() => {
                                                setClientId(null);
                                                // Keep the data in state so they can edit it
                                            }}
                                            className="text-xs text-dr7-gold hover:text-white underline"
                                        >
                                            Modifica
                                        </button>
                                    </div>
                                    <div className="space-y-1 text-sm text-white/80">
                                        <p><span className="text-white/50">Nome:</span> {fullName}</p>
                                        <p><span className="text-white/50">Email:</span> {email}</p>
                                        <p><span className="text-white/50">Tel:</span> {phoneNumber}</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="my-4 sm:my-6">
                                        <label className="block text-sm sm:text-base font-medium text-white text-left mb-2">Nome Completo *</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-white/10 border border-white/30 rounded-lg p-3 sm:p-4 text-white placeholder-white/30 focus:outline-none focus:border-white transition-colors"
                                            placeholder="Inserisci il tuo nome completo"
                                        />
                                    </div>

                                    <div className="my-4 sm:my-6">
                                        <label className="block text-sm sm:text-base font-medium text-white text-left mb-2">Email *</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white/10 border border-white/30 rounded-lg p-3 sm:p-4 text-white placeholder-white/30 focus:outline-none focus:border-white transition-colors"
                                            placeholder="Inserisci la tua email"
                                        />
                                    </div>

                                    <div className="my-4 sm:my-6">
                                        <label className="block text-sm sm:text-base font-medium text-white text-left mb-2">Numero di Telefono *</label>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="w-full bg-white/10 border border-white/30 rounded-lg p-3 sm:p-4 text-white placeholder-white/30 focus:outline-none focus:border-white transition-colors"
                                            placeholder="Inserisci il tuo numero di telefono"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="my-4 sm:my-6">
                                <label className="block text-sm sm:text-base font-medium text-white text-left mb-2">{t('Credit_Card')}</label>
                                <div className="bg-white/10 border border-white/50 rounded-lg p-3 sm:p-4 min-h-[48px] sm:min-h-[56px] flex items-center">
                                    {isClientSecretLoading ?
                                        <div className="flex items-center text-white/70 text-sm sm:text-base">
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-t-white border-white/30 rounded-full mr-2" />
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

export default CommercialOperationPage;
