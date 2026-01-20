import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../hooks/useAuth';
import { MEMBERSHIP_TIERS, CRYPTO_ADDRESSES } from '../constants';
// Nexi payment - no Stripe imports needed
import { getUserCreditBalance, deductCredits, hasSufficientBalance } from '../utils/creditWallet';
import { supabase } from '../supabaseClient';

// Nexi payment - no publishable key needed

const MembershipEnrollmentPage: React.FC = () => {
    const { tierId } = useParams<{ tierId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const { t, lang } = useTranslation();
    const { currency } = useCurrency();
    const { user, updateUser } = useAuth();

    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>(searchParams.get('billing') === 'monthly' ? 'monthly' : 'annually');
    const [paymentMethod, setPaymentMethod] = useState<'nexi' | 'crypto' | 'credit'>('nexi');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [selectedCrypto, setSelectedCrypto] = useState('btc');

    // Credit wallet state
    const [creditBalance, setCreditBalance] = useState<number>(0);
    const [isLoadingBalance, setIsLoadingBalance] = useState(true);

    const tier = useMemo(() => MEMBERSHIP_TIERS.find(t => t.id === tierId), [tierId]);
    const price = useMemo(() => tier?.price[billingCycle][currency] || 0, [tier, billingCycle, currency]);

    // Nexi payment - no initialization needed

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

    // Nexi payment - no payment intent needed

    // Nexi payment - no card element needed

    const formatPrice = (p: number) => new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-US', { style: 'currency', currency: currency.toUpperCase() }).format(p);

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        if (paymentMethod === 'credit') {
            // Credit wallet payment
            if (!user?.id) {
                setPaymentError('User not logged in');
                setIsProcessing(false);
                return;
            }

            // Check sufficient balance
            const hasBalance = await hasSufficientBalance(user.id, price);
            if (!hasBalance) {
                setPaymentError(`Credito insufficiente. Saldo attuale: €${creditBalance.toFixed(2)}, Richiesto: €${price.toFixed(2)}`);
                setIsProcessing(false);
                return;
            }

            // Deduct credits
            const deductResult = await deductCredits(
                user.id,
                price,
                `Membership ${tier?.name[lang]} - ${billingCycle === 'monthly' ? 'Mensile' : 'Annuale'}`,
                undefined,
                'membership_purchase'
            );

            if (!deductResult.success) {
                setPaymentError(deductResult.error || 'Failed to deduct credits');
                setIsProcessing(false);
                return;
            }

            await finalizeEnrollment();
        } else if (paymentMethod === 'nexi') {
            // Nexi redirect payment
            if (!tier || !user?.id) {
                setPaymentError("Payment system is not ready.");
                setIsProcessing(false);
                return;
            }

            try {
                // 1. Save membership purchase as pending
                const { data: purchaseData, error: dbError } = await supabase
                    .from('membership_purchases')
                    .insert({
                        user_id: user.id,
                        tier_id: tier.id,
                        tier_name: tier.name[lang],
                        billing_cycle: billingCycle,
                        price: price,
                        currency: currency.toUpperCase(),
                        payment_method: 'nexi',
                        payment_status: 'pending',
                        renewal_date: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString()
                    })
                    .select()
                    .single();

                if (dbError) throw new Error('Failed to save purchase record');

                // 2. Generate nexi_order_id
                const timestamp = Date.now().toString().substring(5);
                const random = Math.floor(100 + Math.random() * 900).toString();
                const nexiOrderId = `${timestamp}${random}`;

                // 3. Update with nexi_order_id
                await supabase
                    .from('membership_purchases')
                    .update({ nexi_order_id: nexiOrderId })
                    .eq('id', purchaseData.id);

                // 4. Create Nexi payment
                const nexiResponse = await fetch('/.netlify/functions/create-nexi-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: nexiOrderId,
                        amount: Math.round(price * 100),
                        currency: 'EUR',
                        description: `Membership ${tier.name[lang]} - ${billingCycle}`,
                        customerEmail: user.email,
                        customerName: user.fullName
                    })
                });

                const nexiData = await nexiResponse.json();
                if (!nexiResponse.ok) throw new Error(nexiData.error || 'Failed to create payment');

                // 5. Redirect to Nexi HPP
                window.location.href = nexiData.paymentUrl;
            } catch (error: any) {
                setPaymentError(error.message || 'Payment failed');
                setIsProcessing(false);
            }
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await finalizeEnrollment();
        }
    };

    const finalizeEnrollment = async () => {
        if (!tier || !user?.id) return;
        const renewalDate = new Date();
        if (billingCycle === 'monthly') renewalDate.setMonth(renewalDate.getMonth() + 1);
        else renewalDate.setFullYear(renewalDate.getFullYear() + 1);

        // Update user's membership status
        await updateUser({
            membership: {
                tierId: tier.id,
                billingCycle: billingCycle,
                renewalDate: renewalDate.toISOString()
            }
        });

        // Save purchase record to database
        const { error: purchaseError } = await supabase
            .from('membership_purchases')
            .insert({
                user_id: user.id,
                tier_id: tier.id,
                tier_name: tier.name[lang],
                billing_cycle: billingCycle,
                price: price,
                currency: currency.toUpperCase(),
                payment_method: paymentMethod,
                payment_status: 'completed',
                renewal_date: renewalDate.toISOString()
            });

        if (purchaseError) {
            console.error('Error saving membership purchase:', purchaseError);
            // Don't block the user, just log the error
        }

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
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center text-white p-8">
                    <h1 className="text-5xl font-bold mb-4">{t('Welcome_to_the_Club')}</h1>
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
                            <button type="button" onClick={() => setPaymentMethod('credit')} className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 ${paymentMethod === 'credit' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>
                                Credit Wallet
                            </button>
                            <button type="button" onClick={() => setPaymentMethod('nexi')} className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 ${paymentMethod === 'nexi' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Carta</button>
                        </div>

                        {paymentMethod === 'credit' ? (
                            <div className="text-center py-6">
                                {isLoadingBalance ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-t-white border-gray-600 rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm text-gray-400 mb-2">Saldo Disponibile</p>
                                        <p className="text-4xl font-bold text-white mb-4">€{creditBalance.toFixed(2)}</p>
                                        {creditBalance < price ? (
                                            <p className="text-sm text-red-400">Credito insufficiente. Richiesto: €{price.toFixed(2)}</p>
                                        ) : (
                                            <p className="text-sm text-green-400">✓ Saldo sufficiente</p>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                                    <p className="text-gray-300 mb-2">Verrai reindirizzato alla pagina di pagamento sicura Nexi</p>
                                    <p className="text-gray-400 text-sm">Pagamento protetto e certificato</p>
                                </div>
                                {paymentError && <p className="text-xs text-red-400 mt-2">{paymentError}</p>}
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