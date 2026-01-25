import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import MarketingConsentModal from '../../components/ui/MarketingConsentModal';

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

    const handlePrefChange = async (key: keyof typeof prefs, value: boolean) => {
        // If trying to enable newsletter and no marketing consent yet, show modal
        if (key === 'newsletter' && value && !prefs.marketingConsent) {
            setShowConsentModal(true);
            return;
        }

        const newPrefs = { ...prefs, [key]: value };
        setPrefs(newPrefs);
        await updateUser({ notifications: newPrefs });
    };

    const handleConsentAccept = async () => {
        const newPrefs = {
            ...prefs,
            newsletter: true,
            marketingConsent: true
        };
        setPrefs(newPrefs);
        await updateUser({ notifications: newPrefs });
        setShowConsentModal(false);
    };

    const handleConsentDecline = () => {
        setShowConsentModal(false);
    };

    if (!user) return null;

    return (
        <>
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
