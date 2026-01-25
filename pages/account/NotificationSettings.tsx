import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import MarketingConsentModal from '../../components/ui/MarketingConsentModal';
import { supabase } from '../../supabaseClient';

const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-white' : 'bg-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <div className={`absolute left-1 top-1 bg-black w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
    </button>
);

const NotificationSettings = () => {
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();

    const [prefs, setPrefs] = useState({
        bookingConfirmations: true,
        specialOffers: false,
        newsletter: false,
        marketingConsent: false,
    });

    const [showConsentModal, setShowConsentModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (user?.notifications) {
            setPrefs({
                bookingConfirmations: user.notifications.bookingConfirmations ?? true,
                specialOffers: user.notifications.specialOffers ?? false,
                newsletter: user.notifications.newsletter ?? false,
                marketingConsent: user.notifications.marketingConsent ?? false,
            });
        }
    }, [user]);

    const [pendingPref, setPendingPref] = useState<'newsletter' | 'specialOffers' | null>(null);

    const handlePrefChange = async (key: keyof typeof prefs, value: boolean) => {
        // If trying to enable newsletter or specialOffers and no marketing consent yet, show modal
        if ((key === 'newsletter' || key === 'specialOffers') && value && !prefs.marketingConsent) {
            setPendingPref(key);
            setShowConsentModal(true);
            return;
        }

        const newPrefs = { ...prefs, [key]: value };

        // If turning off newsletter or specialOffers, check if both are off to revoke consent
        if ((key === 'newsletter' || key === 'specialOffers') && !value) {
            const otherKey = key === 'newsletter' ? 'specialOffers' : 'newsletter';
            const bothOff = !value && !prefs[otherKey];

            if (bothOff) {
                newPrefs.marketingConsent = false;

                // Update marketing_consents table
                try {
                    await supabase.from('marketing_consents').upsert({
                        user_id: user!.id,
                        email: user!.email,
                        consented: false,
                        consented_at: new Date().toISOString(),
                        source: 'website_settings_revoked'
                    }, { onConflict: 'user_id' });
                } catch (e) {
                    console.error('Failed to update marketing consent:', e);
                }
            }
        }

        setPrefs(newPrefs);
        await updateUser({ notifications: newPrefs });
    };

    const handleConsentAccept = async () => {
        const newPrefs = {
            ...prefs,
            marketingConsent: true,
            ...(pendingPref === 'newsletter' && { newsletter: true }),
            ...(pendingPref === 'specialOffers' && { specialOffers: true }),
        };
        setPrefs(newPrefs);

        // Save to user metadata
        await updateUser({ notifications: newPrefs });

        // Save to marketing_consents table for GDPR compliance
        try {
            // Get userId - try user object first, then localStorage
            let userId = user.id;
            let userEmail = user.email;

            if (!userId) {
                const stored = localStorage.getItem('sb-ahpmzjgkfxrrgxyirasa-auth-token');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    userId = parsed?.user?.id;
                    userEmail = parsed?.user?.email || userEmail;
                }
            }

            console.log('Saving consent for userId:', userId, 'email:', userEmail);

            if (!userId) {
                console.error('No user ID found');
                return;
            }

            const { data, error } = await supabase.from('marketing_consents').upsert({
                user_id: userId,
                email: userEmail,
                consented: true,
                consented_at: new Date().toISOString(),
                consent_text: 'Acconsento a ricevere comunicazioni di marketing (promo, offerte, novità) da DR7 tramite email, SMS/telefono, WhatsApp e notifiche push.',
                source: 'website_settings'
            }, { onConflict: 'user_id' }).select();

            if (error) {
                console.error('Marketing consent save error:', error);
                setSuccessMessage('Errore: ' + error.message);
            } else {
                console.log('Marketing consent saved successfully:', data);
                setSuccessMessage('Consenso salvato con successo!');
            }
        } catch (e) {
            console.error('Failed to save marketing consent:', e);
            setSuccessMessage('Errore: ' + (e as Error).message);
        }

        setPendingPref(null);
        setShowConsentModal(false);

        // Clear message after 4 seconds
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    const handleConsentDecline = () => {
        setPendingPref(null);
        setShowConsentModal(false);
    };

    if (!user) return null;

    return (
        <>
            {/* Success/Error Message */}
            {successMessage && (
                <div className={`mb-4 p-4 rounded-lg text-center font-medium ${successMessage.includes('Errore') ? 'bg-red-900/50 text-red-300 border border-red-700' : 'bg-green-900/50 text-green-300 border border-green-700'}`}>
                    {successMessage}
                </div>
            )}

            <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">{t('Notification_Preferences')}</h2>
                    <p className="text-sm text-gray-400 mt-1">{t('Manage_how_we_communicate_with_you')}</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                        <div>
                            <p className="font-semibold text-white">{t('Booking_Confirmations')}</p>
                            <p className="text-sm text-gray-400">{t('Essential_updates_about_your_bookings')}</p>
                        </div>
                        <Switch checked={prefs.bookingConfirmations} onChange={() => { }} disabled />
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                        <div>
                            <p className="font-semibold text-white">{t('Special_Offers')}</p>
                            <p className="text-sm text-gray-400">{t('Exclusive_deals_and_promotions_for_you')}</p>
                        </div>
                        <Switch checked={prefs.specialOffers} onChange={(val) => handlePrefChange('specialOffers', val)} />
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                        <div>
                            <p className="font-semibold text-white">{t('Newsletter')}</p>
                            <p className="text-sm text-gray-400">{t('Latest_fleet_updates_and_news')}</p>
                        </div>
                        <Switch checked={prefs.newsletter} onChange={(val) => handlePrefChange('newsletter', val)} />
                    </div>
                </div>
            </div>

            {/* Marketing Consent Modal */}
            <MarketingConsentModal
                isOpen={showConsentModal}
                onConfirm={handleConsentAccept}
                onClose={handleConsentDecline}
            />
        </>
    );
};

export default NotificationSettings;
