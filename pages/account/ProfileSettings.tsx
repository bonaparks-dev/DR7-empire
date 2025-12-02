import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { getUserCreditBalance, getCreditTransactions } from '../../utils/creditWallet';
import { useNavigate } from 'react-router-dom';
import type { CreditTransaction } from '../../utils/creditWallet';

const ProfileSettings = () => {
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [creditBalance, setCreditBalance] = useState<number>(0);
    const [recentTransactions, setRecentTransactions] = useState<CreditTransaction[]>([]);
    const [isLoadingCredits, setIsLoadingCredits] = useState(true);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    // Fetch credit balance and transactions
    useEffect(() => {
        const fetchCreditData = async () => {
            if (user?.id) {
                setIsLoadingCredits(true);
                try {
                    const balance = await getUserCreditBalance(user.id);
                    const transactions = await getCreditTransactions(user.id, 5);
                    setCreditBalance(balance);
                    setRecentTransactions(transactions);
                } catch (error) {
                    console.error('Error fetching credit data:', error);
                } finally {
                    setIsLoadingCredits(false);
                }
            }
        };

        fetchCreditData();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (successMessage) setSuccessMessage('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccessMessage('');
        try {
            await updateUser({
                fullName: formData.fullName,
                phone: formData.phone
            });
            setSuccessMessage(t('Changes_Saved'));
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Credit Wallet Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">DR7 Credit Wallet</h2>
                    <p className="text-sm text-gray-400 mt-1">Your available credits for DR7 services</p>
                </div>
                <div className="p-6">
                    {isLoadingCredits ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-2 border-t-white border-gray-600 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Saldo Disponibile</p>
                                    <p className="text-4xl font-bold text-white">€{creditBalance.toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={() => navigate('/credit-wallet')}
                                    className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                                >
                                    Ricarica
                                </button>
                            </div>

                            {/* Recent Transactions */}
                            {recentTransactions.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Ultime Transazioni</h3>
                                    <div className="space-y-2">
                                        {recentTransactions.map((transaction) => (
                                            <div
                                                key={transaction.id}
                                                className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-md"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-sm text-white">{transaction.description}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(transaction.created_at).toLocaleDateString('it-IT', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-bold ${
                                                        transaction.transaction_type === 'credit'
                                                            ? 'text-green-400'
                                                            : 'text-red-400'
                                                    }`}>
                                                        {transaction.transaction_type === 'credit' ? '+' : '-'}€{transaction.amount.toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Saldo: €{transaction.balance_after.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">{t('Profile_Details')}</h2>
                <p className="text-sm text-gray-400 mt-1">{t('Update_your_information')}</p>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">{t('Full_Name')}</label>
                    <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm text-white focus:ring-white focus:border-white" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">{t('Email_Address')}</label>
                    <input type="email" name="email" id="email" value={formData.email} readOnly className="mt-1 block w-full bg-gray-800/50 border-gray-700 rounded-md shadow-sm text-gray-400 cursor-not-allowed" />
                </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300">{t('Phone_Number')}</label>
                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm text-white focus:ring-white focus:border-white" />
                </div>
            </div>
            <div className="p-6 bg-gray-900 flex items-center justify-end space-x-4 rounded-b-lg">
                {successMessage && <span className="text-sm text-green-400">{successMessage}</span>}
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors text-sm disabled:opacity-60">
                    {isSubmitting ? t('Please_wait') : t('Save_Changes')}
                </button>
            </div>
        </form>
        </div>
    );
};

export default ProfileSettings;