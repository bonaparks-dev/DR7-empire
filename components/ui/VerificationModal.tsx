
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useVerification } from '../../hooks/useVerification';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from './Button';

const VerificationModal: React.FC = () => {
    const { isModalOpen, modalType, closeModal } = useVerification();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleNavigate = (path: string) => {
        closeModal();
        navigate(path);
    };

    const modalContent = {
        login: {
            icon: UsersIcon,
            title: t('Account_Required'),
            description: t('Account_Required_Desc'),
            actions: (
                <>
                    <Button variant="outline" size="md" onClick={() => handleNavigate('/signin')}>{t('Sign_In')}</Button>
                    <Button variant="primary" size="md" onClick={() => handleNavigate('/signup')}>{t('Sign_Up')}</Button>
                </>
            )
        },
        verify: {
            icon: ShieldIcon,
            title: t('Verification_Required'),
            description: t('Verification_Required_Desc'),
            actions: (
                <>
                    <Button variant="outline" onClick={closeModal}>{t('Close')}</Button>
                    <Button variant="primary" onClick={() => handleNavigate('/account/documents')}>{t('Go_to_Verification')}</Button>
                </>
            )
        }
    };
    
    const content = modalType ? modalContent[modalType] : null;
    const IconComponent = content?.icon;

    return (
        <AnimatePresence>
            {isModalOpen && content && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={closeModal}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="relative bg-gray-900/80 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-md text-center p-8"
                    >
                        <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10" aria-label={t('Close')}>
                            
                        </button>
                        
                        {IconComponent && (
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-700">
                                
                            </div>
                        )}
                        
                        <h2 className="text-2xl font-bold text-white mb-4">{content.title}</h2>
                        <p className="text-gray-300 mb-8">{content.description}</p>
                        
                        <div className="flex justify-center space-x-4">
                            {content.actions}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default VerificationModal;
