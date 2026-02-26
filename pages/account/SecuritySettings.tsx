import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';

const SecuritySettings = () => {
    const { t } = useTranslation();
    const { user, updateUserPassword, login } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword !== confirmPassword) {
            setError(t('Passwords_do_not_match'));
            return;
        }
        if (newPassword.length < 8) {
            setError(t('Password_is_too_weak'));
            return;
        }

        setIsSubmitting(true);
        try {
            const { error: loginError } = await login(user!.email, currentPassword);
            if (loginError) {
                if (loginError.message.includes('Invalid login credentials')) {
                    throw new Error("The current password you entered is incorrect.");
                }
                throw loginError;
            }

            const { error: updateError } = await updateUserPassword(newPassword);
            if (updateError) throw updateError;

            setSuccessMessage(t('Password_updated_successfully'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err: any) {
            setError(err.message || t('Something_went_wrong'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setError('');

        try {
            // Get userId from multiple sources
            let userId = user?.id;

            // Fallback: get from localStorage
            if (!userId) {
                try {
                    const stored = localStorage.getItem(`sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'app'}-auth-token`);
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        userId = parsed?.user?.id;
                    }
                } catch(e) {}
            }

            if (!userId) {
                throw new Error('Cannot find user ID. Please log out and log in again.');
            }

            const response = await fetch('/.netlify/functions/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Delete failed');
            }

            setDeleteSuccess(true);
            setTimeout(() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.replace('/');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Failed to delete account');
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
                <div className="p-4 md:p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">{t('Change_Password')}</h2>
                    <p className="text-sm text-gray-400 mt-1">{t('Update_your_password')}</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 md:p-6 space-y-4">
                        {error && !showDeleteModal && <p className="text-sm text-red-400 bg-red-900/20 p-3 rounded-md">{error}</p>}
                        <div>
                            <label className="block text-sm font-medium text-gray-300">{t('Current_Password')}</label>
                            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1 block w-full min-h-[44px] bg-gray-800 border-gray-700 rounded-md shadow-sm text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">{t('New_Password')}</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full min-h-[44px] bg-gray-800 border-gray-700 rounded-md shadow-sm text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">{t('Confirm_Password')}</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full min-h-[44px] bg-gray-800 border-gray-700 rounded-md shadow-sm text-white" />
                        </div>
                    </div>
                    <div className="p-4 md:p-6 bg-gray-900 flex items-center justify-end space-x-4 rounded-b-lg">
                        {successMessage && <span className="text-sm text-green-400">{successMessage}</span>}
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors text-sm disabled:opacity-60">
                            {isSubmitting ? t('Please_wait') : t('Save_Changes')}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-lg mt-6">
                <div className="p-4 md:p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Delete Account</h2>
                    <p className="text-sm text-gray-400 mt-1">Permanently remove your account and all data</p>
                </div>
                <div className="p-4 md:p-6">
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors text-sm"
                    >
                        Delete My Account
                    </button>
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-4 md:p-6">
                        {deleteSuccess ? (
                            <>
                                <h3 className="text-2xl font-bold text-green-400 mb-4">Account Deleted</h3>
                                <p className="text-gray-300">Redirecting...</p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-2xl font-bold text-white mb-4">Delete Account?</h3>
                                <p className="text-gray-300 mb-6">This will permanently delete your account and all data.</p>
                                {error && <p className="text-sm text-red-400 bg-red-900/20 p-3 rounded-md mb-4">{error}</p>}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setShowDeleteModal(false); setError(''); }}
                                        disabled={isDeleting}
                                        className="flex-1 px-5 py-2.5 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors text-sm disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting}
                                        className="flex-1 px-5 py-2.5 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default SecuritySettings;
