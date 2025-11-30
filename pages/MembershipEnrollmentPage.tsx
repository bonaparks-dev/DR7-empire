import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../hooks/useAuth';
import { MEMBERSHIP_TIERS, CRYPTO_ADDRESSES } from '../constants';
import type { Stripe, StripeCardElement } from '@stripe/stripe-js';

// Safely access the Stripe publishable key from Vite's environment variables.
// If it's not available (e.g., in a non-Vite environment), it falls back to a placeholder.
// The subsequent check will log an error if the key remains a placeholder.
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51S3dDjQcprtTyo8tBfBy5mAZj8PQXkxfZ1RCnWskrWFZ2WEnm1u93ZnE2tBi316Gz2CCrvLV98IjSoiXb0vSDpOQ003fNG69Y2';

const MembershipEnrollmentPage: React.FC = () => {
    const { tierId } = useParams<{ tierId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const { t, lang } = useTranslation();
    const { currency } = useCurrency();
    const { user, updateUser } = useAuth();
    
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>(searchParams.get('billing') === 'monthly' ? 'monthly' : 'annually');
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'crypto'>('stripe');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const [stripe, setStripe] = useState<Stripe | null>(null);
    const [cardElement, setCardElement] = useState<StripeCardElement | null>(null);
    const cardElementRef = useRef<HTMLDivElement>(null);
    const [stripeError, setStripeError] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isClientSecretLoading, setIsClientSecretLoading] = useState(false);
    const [selectedCrypto, setSelectedCrypto] = useState('btc');
    
    const tier = useMemo(() => MEMBERSHIP_TIERS.find(t => t.id === tierId), [tierId]);
    const price = useMemo(() => tier?.price[billingCycle][currency] || 0, [tier, billingCycle, currency]);

    useEffect(() => {
        if ((window as any).Stripe) {
            if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.startsWith('YOUR_')) {
                console.error("Stripe.js has loaded, but the publishable key is not set. Please replace 'YOUR_STRIPE_PUBLISHABLE_KEY' in MembershipEnrollmentPage.tsx.");
                // Optionally handle UI error state here
                return;
            }
            setStripe((window as any).Stripe(STRIPE_PUBLISHABLE_KEY));
        }
    }, []);

    useEffect(() => {
        if (price > 0) {
            setIsClientSecretLoading(true);
            fetch('/.netlify/functions/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: price, currency })
            }).then(res => res.json()).then(data => {
                if(data.error) setStripeError(data.error);
                else setClientSecret(data.clientSecret);
            }).catch(() => setStripeError('Could not connect to payment server.'))
            .finally(() => setIsClientSecretLoading(false));
        }
    }, [price, currency]);

    useEffect(() => {
        if (stripe && clientSecret && cardElementRef.current && paymentMethod === 'stripe') {
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
    }, [stripe, clientSecret, paymentMethod]);

    const formatPrice = (p: number) => new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-US', { style: 'currency', currency: currency.toUpperCase() }).format(p);

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        if (paymentMethod === 'stripe') {
            if (!stripe || !cardElement || !clientSecret) {
                setStripeError("Payment system is not ready.");
                setIsProcessing(false);
                return;
            }
            const { error } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: { card: cardElement, billing_details: { name: user?.fullName, email: user?.email } }
            });

            if (error) {
                setStripeError(error.message || "An unexpected error occurred.");
                setIsProcessing(false);
            } else {
                await finalizeEnrollment();
            }
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await finalizeEnrollment();
        }
    };

    const finalizeEnrollment = async () => {
        if (!tier) return;
        const renewalDate = new Date();
        if (billingCycle === 'monthly') renewalDate.setMonth(renewalDate.getMonth() + 1);
        else renewalDate.setFullYear(renewalDate.getFullYear() + 1);

        await updateUser({
            membership: {
                tierId: tier.id,
                billingCycle: billingCycle,
                renewalDate: renewalDate.toISOString()
            }
        });

        // Generate WhatsApp message for membership enrollment
        const tierName = tier.name[lang];
        const billingText = billingCycle === 'monthly' ? (lang === 'it' ? 'Mensile' : 'Monthly') : (lang === 'it' ? 'Annuale' : 'Annual');
        const renewalDateFormatted = renewalDate.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let message = `Ciao! Mi sono appena iscritto al DR7 Club.\n\n`;
        message += `Membership: ${tierName}\n`;
        message += `Piano: ${billingText}\n`;
        message += `Prezzo: ${formatPrice(price)}\n`;
        message += `Data rinnovo: ${renewalDateFormatted}\n\n`;
        if (user) {
            message += `Nome: ${user.fullName || ''}\n`;
            message += `Email: ${user.email || ''}\n\n`;
        }
        message += `Grazie!`;

        const whatsappUrl = `https://wa.me/393457905205?text=${encodeURIComponent(message)}`;
        setTimeout(() => {
            window.open(whatsappUrl, '_blank');
        }, 1000);

        setIsProcessing(false);
        setIsConfirmed(true);
    };

    if (!tier) return <div className="pt-32 text-center text-white">Membership tier not found.</div>;

    if (isConfirmed) {
        return (
            <div className="pt-32 pb-24 bg-black min-h-screen flex items-center justify-center">
                <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} className="text-center text-white p-8">
                    <h1 className="text-4xl font-bold mb-4">{t('Welcome_to_the_Club')}</h1>
                    <p className="text-lg text-gray-300 mb-8">{t('Your_membership_is_now_active')}</p>
                    <button onClick={() => navigate('/account/membership')} className="bg-white text-black font-bold py-3 px-8 rounded-full">{t('Go_to_Dashboard')}</button>
                </motion.div>
            </div>
        )
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-32 pb-24 bg-black min-h-screen">
            <div className="container mx-auto px-6 max-w-3xl">
                <h1 className="text-4xl font-bold text-white text-center mb-10">{t('Enroll_in_DR7_Club')}</h1>
                <div className="grid md:grid-cols-2 gap-8 items-start">
                    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                        <h2 className="text-xl font-bold text-white mb-4">{t('Membership_Summary')}</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-gray-400">{t('Selected_Tier')}</span><span className="font-semibold text-white">{tier.name[lang]}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">{t('Billing_Cycle')}</span><span className="font-semibold text-white">{t(billingCycle === 'monthly' ? 'Monthly' : 'Annually')}</span></div>
                            <div className="border-t border-gray-700 my-2"></div>
                            <div className="flex justify-between text-lg"><span className="text-gray-300 font-bold">{t('Total')}</span><span className="font-bold text-white">{formatPrice(price)}</span></div>
                        </div>
                    </div>
                    <form onSubmit={handleConfirm} className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                        <h2 className="text-xl font-bold text-white mb-4">{t('Payment')}</h2>
                        <div className="flex border-b border-gray-700 mb-6">
                            <button type="button" onClick={() => setPaymentMethod('stripe')} className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 ${paymentMethod === 'stripe' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>{t('Credit_Card')}</button>
                            <button type="button" onClick={() => setPaymentMethod('crypto')} className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 ${paymentMethod === 'crypto' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>{t('Cryptocurrency')}</button>
                        </div>

                        {paymentMethod === 'stripe' ? (
                            <div>
                                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                    {isClientSecretLoading ? <p className="text-gray-400 text-sm">Initializing payment...</p> : <div ref={cardElementRef} />}
                                </div>
                                {stripeError && <p className="text-xs text-red-400 mt-2">{stripeError}</p>}
                            </div>
                        ) : (
                            <div className="text-center">
                                <label className="text-sm text-gray-300 block mb-2">{t('Select_your_crypto')}</label>
                                <div className="flex border border-gray-700 rounded-full p-1 max-w-sm mx-auto mb-4">
                                    {Object.keys(CRYPTO_ADDRESSES).map(c => (
                                    <button type="button" key={c} onClick={() => setSelectedCrypto(c)} className={`flex-1 py-1 text-sm rounded-full transition-colors ${selectedCrypto === c ? 'bg-white text-black font-bold' : 'text-gray-300'}`}>{c.toUpperCase()}</button>
                                    ))}
                                </div>
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${CRYPTO_ADDRESSES[selectedCrypto]}`} alt={`${selectedCrypto.toUpperCase()} QR Code`} className="w-32 h-32 mx-auto bg-white p-1 rounded-md" />
                                <input type="text" readOnly value={CRYPTO_ADDRESSES[selectedCrypto]} className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-4 text-white text-center text-xs tracking-tight"/>
                            </div>
                        )}

                        <button type="submit" disabled={isProcessing} className="w-full mt-6 bg-white text-black font-bold py-3 px-4 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60">
                            {isProcessing ? t('Processing') : t('Confirm_and_Pay')}
                        </button>
                    </form>
                </div>
            </div>
        </motion.div>
    );
};

export default MembershipEnrollmentPage;