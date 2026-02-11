import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../hooks/useAuth';
import { MEMBERSHIP_TIERS } from '../constants';
// Nexi payment - no Stripe imports needed
// Credit wallet disabled for membership purchases - card only
import { supabase } from '../supabaseClient';

// Nexi payment - no publishable key needed

const MembershipEnrollmentPage: React.FC = () => {
    const { tierId } = useParams<{ tierId: string }>();
    const [searchParams] = useSearchParams();

    const { t, lang } = useTranslation();
    const { currency } = useCurrency();
    const { user } = useAuth();

    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>(searchParams.get('billing') === 'monthly' ? 'monthly' : 'annually');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const tier = useMemo(() => MEMBERSHIP_TIERS.find(t => t.id === tierId), [tierId]);
    const price = useMemo(() => tier?.price[billingCycle][currency] || 0, [tier, billingCycle, currency]);

    // Nexi payment - no initialization needed

    // Membership purchases are card-only (no credit wallet)

    // Nexi payment - no payment intent needed

    // Nexi payment - no card element needed

    const formatPrice = (p: number) => new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-US', { style: 'currency', currency: currency.toUpperCase() }).format(p);

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        // Card payment only (Nexi)
        if (!tier || !user?.id) {
            setPaymentError("Payment system is not ready.");
            setIsProcessing(false);
            return;
        }

        try {
            // Calculate renewal date: extend from current expiry if renewing early
            let baseDate = new Date();
            if (user.membership?.renewalDate) {
                const currentExpiry = new Date(user.membership.renewalDate);
                if (currentExpiry > baseDate) {
                    baseDate = currentExpiry; // Extend from current expiry, don't lose remaining days
                }
            }
            const daysToAdd = billingCycle === 'monthly' ? 30 : 365;
            const renewalDate = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

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
                    subscription_status: 'active',
                    renewal_date: renewalDate.toISOString()
                })
                .select()
                .single();

            if (dbError) {
                console.error('Supabase error:', dbError);
                throw new Error(`Failed to save purchase record: ${dbError.message}`);
            }

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
                    customerName: user.fullName,
                })
            });

            const nexiData = await nexiResponse.json();
            if (!nexiResponse.ok) throw new Error(nexiData.error || 'Failed to create payment');

            // 5. Save orderId for PaymentSuccessPage fallback (in case Nexi doesn't append params to redirect)
            sessionStorage.setItem('dr7_pending_order', nexiOrderId);
            sessionStorage.setItem('dr7_pending_type', 'membership');

            // 6. Redirect to Nexi HPP
            window.location.href = nexiData.paymentUrl;
        } catch (error: any) {
            setPaymentError(error.message || 'Payment failed');
            setIsProcessing(false);
        }
    };

    // finalizeEnrollment removed — membership activation is handled by nexi-callback
    // which updates user metadata via supabase.auth.admin.updateUserById()

    if (!tier) return <div className="pt-32 text-center text-white">Membership tier not found.</div>;

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
                        <div className="mb-6">
                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                                <p className="text-gray-300 mb-2">Verrai reindirizzato alla pagina di pagamento sicura Nexi</p>
                                <p className="text-gray-400 text-sm">Pagamento protetto e certificato</p>
                            </div>
                            {paymentError && <p className="text-xs text-red-400 mt-2">{paymentError}</p>}
                        </div>

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