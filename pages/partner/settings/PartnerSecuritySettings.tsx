import React, { useState } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAuth } from '../../../hooks/useAuth';

const PartnerSecuritySettings = () => {
    const { t } = useTranslation();
    const { updateUserPassword } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

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
            const { error: updateError } = await updateUserPassword(newPassword);
            if (updateError) throw updateError;
            setSuccessMessage(t('Password_updated_successfully'));
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch(err: any) {
            setError(err.message || t('Something_went_wrong'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">{t('Change_Password')}</h2>
                <p className="text-sm text-gray-400 mt-1">{t('Update_your_password')}</p>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-sm text-red-400 bg-red-900/20 p-3 rounded-md">{error}</p>}
                    <div>
                        <label className="block text-sm font-medium text-gray-300">{t('New_Password')}</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm text-white"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">{t('Confirm_Password')}</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm text-white"/>
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

export default PartnerSecuritySettings;
