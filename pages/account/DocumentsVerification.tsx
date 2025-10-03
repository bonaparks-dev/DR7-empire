import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { CameraIcon } from '../../components/icons/Icons';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';

const StatusBadge: React.FC<{ status: 'unverified' | 'pending' | 'verified' }> = ({ status }) => {
    const { t } = useTranslation();
    const statusMap = {
        unverified: { text: t('Unverified'), color: 'bg-red-500/20 text-red-400' },
        pending: { text: t('Pending'), color: 'bg-yellow-500/20 text-yellow-400' },
        verified: { text: t('Verified'), color: 'bg-green-500/20 text-green-400' },
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[status].color}`}>{statusMap[status].text}</span>;
}

const ImageUploader: React.FC<{
    label: string;
    description: string;
    image: string | undefined;
    onImageSet: (dataUrl: string) => void;
}> = ({ label, description, image, onImageSet }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => onImageSet(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <div className="bg-gray-800/50 p-4 rounded-lg">
            <p className="font-semibold text-white">{label}</p>
            {image ? (
                <div className="mt-2 relative">
                    <img src={image} alt={`${label} Preview`} className="w-full h-auto max-h-48 object-contain rounded-md" />
                    <button type="button" onClick={() => onImageSet('')} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 text-xs hover:bg-black">
                        ✕
                    </button>
                </div>
            ) : (
                <div className="mt-2 border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-400 mb-4">{description}</p>
                    <div className="flex justify-center space-x-4">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 text-sm">
                            {t('Upload_File')}
                        </button>
                         {/* Camera functionality can be added here if needed */}
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
            )}
        </div>
    );
};

const stripePromise = loadStripe('pk_live_51S3dDjQcprtTyo8tBfBy5mAZj8PQXkxfZ1RCnWskrWFZ2WEnm1u93ZnE2tBi316Gz2CCrvLV98IjSoiXb0vSDpOQ003fNG69Y2');

const DocumentsVerification = () => {
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();

    const [idFront, setIdFront] = useState(user?.verification.idFrontImage || '');
    const [idBack, setIdBack] = useState(user?.verification.idBackImage || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVerifyingWithStripe, setIsVerifyingWithStripe] = useState(false);
    const [verificationMethod, setVerificationMethod] = useState<'manual' | 'stripe'>('stripe');

    const handleManualSubmit = async () => {
        if (!idFront || !idBack || !user) return;
        setIsSubmitting(true);
        const newVerificationState = {
            ...user.verification,
            idStatus: 'pending' as 'pending',
            idFrontImage: idFront,
            idBackImage: idBack,
        };
        await updateUser({
            verification: newVerificationState
        });
        setIsSubmitting(false);
    };

    const handleStripeIdentityVerification = async () => {
        if (!user) return;

        setIsVerifyingWithStripe(true);

        try {
            // Create Stripe Identity verification session
            const response = await fetch('/.netlify/functions/create-identity-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create verification session');
            }

            // Load Stripe Identity
            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error('Failed to load Stripe');
            }

            // Redirect to Stripe Identity verification
            const { error } = await stripe.verifyIdentity(data.clientSecret);

            if (error) {
                console.error('Stripe Identity error:', error);
                alert(error.message || 'Verification failed');
            }
        } catch (error: any) {
            console.error('Error starting verification:', error);
            alert(error.message || 'Failed to start verification');
        } finally {
            setIsVerifyingWithStripe(false);
        }
    };

    if (!user) return null;

    const { idStatus } = user.verification;

    return (
         <div className="bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">{t('Document_Verification')}</h2>
                    <p className="text-sm text-gray-400 mt-1">{t('Securely_upload_your_ID')}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">{t('Verification_Status')}:</span>
                    <StatusBadge status={idStatus} />
                </div>
            </div>
            
            {idStatus === 'pending' && (
                <div className="p-6 text-center bg-yellow-900/20">
                    <h3 className="font-bold text-yellow-300">{t('Documents_Submitted')}</h3>
                    <p className="text-sm text-yellow-400 mt-1">{t('Your_documents_are_under_review')}</p>
                </div>
            )}
            
            {idStatus === 'verified' && (
                <div className="p-6 text-center bg-green-900/20">
                    <h3 className="font-bold text-green-300">Account Verified</h3>
                    <p className="text-sm text-green-400 mt-1">Your identification has been successfully verified.</p>
                </div>
            )}

            {idStatus === 'unverified' && (
                <div className="p-6">
                    {/* Stripe Identity Option (Recommended) */}
                    <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6 mb-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    ✨ {t('Instant_Verification')} <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-2">{t('Recommended')}</span>
                                </h3>
                                <p className="text-sm text-gray-300 mb-3">
                                    {t('Verify_instantly_with_Stripe_Identity')}
                                </p>
                                <ul className="text-sm text-gray-400 space-y-1">
                                    <li>✓ {t('Instant_verification_in_minutes')}</li>
                                    <li>✓ {t('Secure_and_encrypted')}</li>
                                    <li>✓ {t('Take_photo_with_your_phone')}</li>
                                    <li>✓ {t('Powered_by_Stripe')}</li>
                                </ul>
                            </div>
                        </div>
                        <button
                            onClick={handleStripeIdentityVerification}
                            disabled={isVerifyingWithStripe}
                            className="w-full md:w-auto px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60"
                        >
                            {isVerifyingWithStripe ? t('Please_wait') : t('Start_Instant_Verification')}
                        </button>
                    </div>

                    {/* Manual Upload Option */}
                    <div className="border border-gray-700 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-white mb-2">{t('Manual_Upload')}</h3>
                        <p className="text-sm text-gray-400 mb-4">{t('Or_upload_documents_manually')}</p>

                        <form onSubmit={(e) => { e.preventDefault(); handleManualSubmit(); }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <ImageUploader
                                    label={t('ID_Front')}
                                    description={t('Please_upload_the_front_of_your_ID')}
                                    image={idFront}
                                    onImageSet={setIdFront}
                                />
                                <ImageUploader
                                    label={t('ID_Back')}
                                    description={t('Please_upload_the_back_of_your_ID')}
                                    image={idBack}
                                    onImageSet={setIdBack}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !idFront || !idBack}
                                    className="px-5 py-2.5 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors text-sm disabled:opacity-60"
                                >
                                    {isSubmitting ? t('Please_wait') : t('Submit_for_Verification')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsVerification;