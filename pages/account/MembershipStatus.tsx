import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { MEMBERSHIP_TIERS } from '../../constants';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const MembershipStatus = () => {
    const { user } = useAuth();
    const { t, lang } = useTranslation();
    const navigate = useNavigate();

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [membershipPurchase, setMembershipPurchase] = useState<any>(null);

    const currentTier = user?.membership ? MEMBERSHIP_TIERS.find(t => t.id === user.membership?.tierId) : null;

    // Fetch the actual membership purchase record for subscription details
    useEffect(() => {
        const fetchMembership = async () => {
            if (!user?.id) return;
            const { data } = await supabase
                .from('membership_purchases')
                .select('*')
                .eq('user_id', user.id)
                .eq('payment_status', 'succeeded')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) setMembershipPurchase(data);
        };
        fetchMembership();
    }, [user?.id]);

    const subscriptionStatus = user?.membership?.subscriptionStatus || membershipPurchase?.subscription_status || 'active';
    const isRecurring = user?.membership?.isRecurring || membershipPurchase?.is_recurring || false;

    const handleCancelSubscription = async () => {
        if (!membershipPurchase?.id) return;
        setCancelling(true);
        setCancelError(null);

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const res = await fetch('/.netlify/functions/cancel-membership', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ membershipId: membershipPurchase.id }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Cancellation failed');

            // Update local state
            setMembershipPurchase({ ...membershipPurchase, subscription_status: 'cancelled' });
            setShowCancelModal(false);
        } catch (err: any) {
            setCancelError(err.message);
        } finally {
            setCancelling(false);
        }
    };

    if (!user?.membership || !currentTier) {
        return (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
                <h2 className="text-xl font-bold text-white">{t('No_Active_Membership')}</h2>
                <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">{t('You_do_not_have_an_active_membership')}</p>
                <button onClick={() => navigate('/membership')} className="mt-6 px-5 py-2.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors text-sm">
                    {t('Explore_Tiers')}
                </button>
            </div>
        );
    }

    const renewalDate = new Date(user.membership.renewalDate).toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-800">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">{t('My_Membership')}</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {subscriptionStatus === 'cancelled'
                                ? `${lang === 'it' ? 'Attiva fino al' : 'Active until'} ${renewalDate}`
                                : `${t('Renews_on')} ${renewalDate}`
                            }
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Subscription status badge */}
                        {subscriptionStatus === 'cancelled' && (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-900/50 text-yellow-400 border border-yellow-800">
                                {lang === 'it' ? 'Cancellato' : 'Cancelled'}
                            </span>
                        )}
                        {subscriptionStatus === 'renewal_failed' && (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-900/50 text-red-400 border border-red-800">
                                {lang === 'it' ? 'Rinnovo fallito' : 'Renewal failed'}
                            </span>
                        )}
                        <span className={`px-3 py-1 text-sm font-bold rounded-full ${currentTier.isPopular ? 'bg-white text-black' : 'bg-gray-700 text-white'}`}>
                            {currentTier.name[lang]}
                        </span>
                    </div>
                </div>
            </div>

            {/* Auto-renewal indicator */}
            {isRecurring && subscriptionStatus === 'active' && (
                <div className="px-6 py-3 bg-blue-900/20 border-b border-gray-800">
                    <p className="text-xs text-blue-300">
                        {lang === 'it'
                            ? 'Rinnovo automatico attivo'
                            : 'Auto-renewal active'
                        }
                    </p>
                </div>
            )}

            <div className="p-6">
                 <h3 className="text-lg font-semibold text-white mb-4">{t('Your_Benefits')}</h3>
                 <ul className="space-y-3">
                     {currentTier.features[lang].map((feature, index) => (
                        <li key={index} className="flex items-start text-gray-300 text-sm">
                            {typeof feature === 'string' ? (
                                <>
                                    <svg className="w-4 h-4 text-white mr-2.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    <span>{feature}</span>
                                </>
                            ) : (
                                <>
                                    <feature.icon className="w-4 h-4 text-white mr-2.5 flex-shrink-0 mt-0.5" />
                                    <span>{feature.text}</span>
                                </>
                            )}
                        </li>
                     ))}
                 </ul>
            </div>

            <div className="p-6 bg-gray-900 flex items-center justify-end gap-3 rounded-b-lg">
                {isRecurring && subscriptionStatus === 'active' && (
                    <button
                        onClick={() => { setShowCancelModal(true); setCancelError(null); }}
                        className="px-5 py-2.5 bg-transparent border border-red-800 text-red-400 font-bold rounded-full text-sm hover:bg-red-900/30 transition-colors"
                    >
                        {lang === 'it' ? 'Cancella Abbonamento' : 'Cancel Subscription'}
                    </button>
                )}
                {subscriptionStatus === 'renewal_failed' && (
                    <button
                        onClick={() => navigate(`/membership/enroll/${currentTier.id}?billing=${user.membership?.billingCycle}`)}
                        className="px-5 py-2.5 bg-white text-black font-bold rounded-full text-sm hover:bg-gray-200 transition-colors"
                    >
                        {lang === 'it' ? 'Rinnova Manualmente' : 'Renew Manually'}
                    </button>
                )}
            </div>

            {/* Cancel confirmation modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-white mb-3">
                            {lang === 'it' ? 'Conferma Cancellazione' : 'Confirm Cancellation'}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">
                            {lang === 'it'
                                ? 'Sei sicuro di voler cancellare il tuo abbonamento?'
                                : 'Are you sure you want to cancel your subscription?'
                            }
                        </p>
                        <p className="text-gray-500 text-xs mb-6">
                            {lang === 'it'
                                ? `La tua membership resterà attiva fino al ${renewalDate}. Non verrà effettuato nessun altro addebito.`
                                : `Your membership will remain active until ${renewalDate}. No further charges will be made.`
                            }
                        </p>

                        {cancelError && (
                            <p className="text-red-400 text-xs mb-4">{cancelError}</p>
                        )}

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setShowCancelModal(false); setCancelError(null); }}
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                                disabled={cancelling}
                            >
                                {lang === 'it' ? 'Annulla' : 'Go Back'}
                            </button>
                            <button
                                onClick={handleCancelSubscription}
                                disabled={cancelling}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
                            >
                                {cancelling
                                    ? (lang === 'it' ? 'Cancellazione...' : 'Cancelling...')
                                    : (lang === 'it' ? 'Conferma Cancellazione' : 'Confirm Cancellation')
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipStatus;
