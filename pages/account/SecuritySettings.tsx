import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';

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
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteEmail, setDeleteEmail] = useState('');

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
        if (!deleteEmail || !deletePassword) {
            setError('Please enter your email and password');
            return;
        }

        setIsDeleting(true);
        setError('');

        try {
            // Send email + password to backend - it handles auth there
            const response = await fetch('/.netlify/functions/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: deleteEmail, password: deletePassword })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Delete failed');
            }

            setDeleteSuccess(true);

            // Clear everything and redirect
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
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">{t('Change_Password')}</h2>
                    <p className="text-sm text-gray-400 mt-1">{t('Update_your_password')}</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {error && !showDeleteModal && <p className="text-sm text-red-400 bg-red-900/20 p-3 rounded-md">{error}</p>}
                        <div>
                            <label className="block text-sm font-medium text-gray-300">{t('Current_Password')}</label>
                            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">{t('New_Password')}</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">{t('Confirm_Password')}</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm text-white" />
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

            {/* Delete Account Section */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg mt-6">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Delete Account</h2>
                    <p className="text-sm text-gray-400 mt-1">Permanently remove your account and all data</p>
                </div>
                <div className="p-6">
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors text-sm"
                    >
                        Delete My Account
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6">
                        {deleteSuccess ? (
                            <>
                                <h3 className="text-2xl font-bold text-green-400 mb-4">Account Deleted</h3>
                                <p className="text-gray-300 mb-4">
                                    Your account has been successfully deleted.
                                </p>
                                <p className="text-gray-400 text-sm">
                                    Redirecting you to the home page...
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-2xl font-bold text-white mb-4">Delete Account?</h3>
                                <p className="text-gray-300 mb-4">
                                    This will permanently delete your account and all your data.
                                </p>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Your email</label>
                                    <input
                                        type="email"
                                        value={deleteEmail}
                                        onChange={e => setDeleteEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white mb-3"
                                    />
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Your password</label>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={e => setDeletePassword(e.target.value)}
                                        placeholder="Your password"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white"
                                    />
                                </div>
                                {error && <p className="text-sm text-red-400 bg-red-900/20 p-3 rounded-md mb-4">{error}</p>}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setError('');
                                            setDeleteEmail('');
                                            setDeletePassword('');
                                        }}
                                        disabled={isDeleting}
                                        className="flex-1 px-5 py-2.5 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors text-sm disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting || !deleteEmail || !deletePassword}
                                        className="flex-1 px-5 py-2.5 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
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
