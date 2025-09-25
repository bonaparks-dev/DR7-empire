import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { CreditCardIcon } from '../../components/icons/Icons';

const PaymentMethods = () => {
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();

    const handleSetDefault = async (cardId: string) => {
        if (!user) return;
        const updatedMethods = user.paymentMethods.map(pm => ({
            ...pm,
            isDefault: pm.id === cardId
        }));
        await updateUser({ paymentMethods: updatedMethods });
    };
    
    const handleRemove = async (cardId: string) => {
        if (!user) return;
        const updatedMethods = user.paymentMethods.filter(pm => pm.id !== cardId);
        // Ensure there's always a default if cards remain
        if (updatedMethods.length > 0 && !updatedMethods.some(pm => pm.isDefault)) {
            updatedMethods[0].isDefault = true;
        }
        await updateUser({ paymentMethods: updatedMethods });
    };

    if (!user) return null;

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">{t('Saved_Payment_Methods')}</h2>
                    <p className="text-sm text-gray-400 mt-1">{t('Manage_your_saved_payment_methods')}</p>
                </div>
                <button disabled className="px-4 py-2 bg-gray-700 text-white font-bold rounded-full text-sm disabled:opacity-60 cursor-not-allowed">
                    {t('Add_New_Card')}
                </button>
            </div>
            <div className="p-6">
                {user.paymentMethods.length > 0 ? (
                    <ul className="space-y-3">
                        {user.paymentMethods.map(card => (
                            <li key={card.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-800/50 rounded-lg">
                                <div className="flex items-center mb-2 sm:mb-0">
                                    <CreditCardIcon className="w-6 h-6 text-white mr-4" />
                                    <div>
                                        <p className="font-semibold text-white">{card.brand} **** {card.last4}</p>
                                        <p className="text-sm text-gray-400">Expires 12/2028</p>
                                    </div>
                                    {card.isDefault && <span className="ml-4 px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-700 text-gray-200">{t('Default')}</span>}
                                </div>
                                <div className="flex space-x-3 self-end sm:self-center">
                                    {!card.isDefault && (
                                        <button onClick={() => handleSetDefault(card.id)} className="text-sm font-medium text-white hover:underline">{t('Set_as_Default')}</button>
                                    )}
                                    <button onClick={() => handleRemove(card.id)} className="text-sm font-medium text-red-400 hover:underline">{t('Remove')}</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-400 py-8">No payment methods saved.</p>
                )}
            </div>
        </div>
    );
};

export default PaymentMethods;