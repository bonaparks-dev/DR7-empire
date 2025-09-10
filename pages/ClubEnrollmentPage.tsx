import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../contexts/CurrencyContext';
import { MEMBERSHIP_TIERS } from '../constants';
import { CreditCardIcon, CryptoIcon } from '../components/icons/Icons';

const ClubEnrollmentPage: React.FC = () => {
    const { tierId } = useParams<{ tierId: string }>();
    const navigate = useNavigate();
    const { t, getTranslated } = useTranslation();
    const { user, updateMembership } = useAuth();
    const { currency } = useCurrency();
  
    const tier = useMemo(() => 
        MEMBERSHIP_TIERS.find(t => t.id === tierId),
        [tierId]
    );

    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [formData, setFormData] = useState({
        billingCycle: 'annually' as 'monthly' | 'annually',
        paymentMethod: 'stripe' as 'stripe' | 'crypto',
        cardNumber: '',
        cardExpiry: '',
        cardCVC: '',
    });

    const { price, formattedPrice } = useMemo(() => {
        if (!tier) return { price: 0, formattedPrice: '' };
        const priceData = tier.price[formData.billingCycle];
        const p = priceData[currency];
        const fp = new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(p);
        return { price: p, formattedPrice: fp };
    }, [formData.billingCycle, tier, currency]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);
  
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tier) return;
        
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate payment processing
        
        updateMembership(tier.id, formData.billingCycle);

        setIsProcessing(false);
        setStep(4); // Confirmation step
    };

    if (!tier || !user) {
      return <div className="pt-32 text-center text-white">Tier or user not found.</div>;
    }

    const steps = [
        { id: 1, name: t('Billing_Cycle') },
        { id: 2, name: t('Personal_Information') },
        { id: 3, name: t('Payment') },
    ];

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4">{t('Choose_your_tier_and_unlock_a_world_of_privileges')}</h3>
                        <div className="space-y-3">
                             <label className="flex items-center p-4 bg-gray-800/50 rounded-md border border-gray-700 cursor-pointer has-[:checked]:border-white">
                                <input type="radio" name="billingCycle" value="monthly" checked={formData.billingCycle === 'monthly'} onChange={handleChange} className="h-4 w-4 text-white bg-gray-700 border-gray-600 focus:ring-white"/>
                                <span className="ml-3 text-white font-semibold">{t('Monthly')}</span>
                            </label>
                             <label className="flex items-center p-4 bg-gray-800/50 rounded-md border border-gray-700 cursor-pointer has-[:checked]:border-white">
                                <input type="radio" name="billingCycle" value="annually" checked={formData.billingCycle === 'annually'} onChange={handleChange} className="h-4 w-4 text-white bg-gray-700 border-gray-600 focus:ring-white"/>
                                <span className="ml-3 text-white font-semibold">{t('Annually')}</span>
                                <span className="ml-auto bg-gray-700 text-gray-200 text-xs font-bold px-2 py-1 rounded-md">{t('Save')} 16%</span>
                            </label>
                        </div>
                    </div>
                );
            case 2:
                return (
                     <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white mb-4">{t('Personal_Information')}</h3>
                        <div>
                            <label className="text-sm text-gray-400">{t('Full_Name')}</label>
                            <input type="text" value={user.fullName} disabled className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white disabled:text-gray-400"/>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">{t('Email_Address')}</label>
                            <input type="email" value={user.email} disabled className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white disabled:text-gray-400"/>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div>
                        <div className="flex border-b border-gray-700">
                            <button type="button" onClick={() => setFormData(p => ({...p, paymentMethod: 'stripe'}))} className={`flex-1 py-2 text-sm font-semibold transition-colors ${formData.paymentMethod === 'stripe' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}><CreditCardIcon className="w-5 h-5 inline mr-2"/>{t('Credit_Card')}</button>
                            <button type="button" onClick={() => setFormData(p => ({...p, paymentMethod: 'crypto'}))} className={`flex-1 py-2 text-sm font-semibold transition-colors ${formData.paymentMethod === 'crypto' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}><CryptoIcon className="w-5 h-5 inline mr-2"/>{t('Cryptocurrency')}</button>
                        </div>
                        <div className="mt-6">
                        {formData.paymentMethod === 'stripe' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-400">{t('Card_Number')}</label>
                                    <input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleChange} placeholder="•••• •••• •••• ••••" className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                    <label className="text-sm text-gray-400">{t('Expiry')}</label>
                                    <input type="text" name="cardExpiry" value={formData.cardExpiry} onChange={handleChange} placeholder="MM / YY" className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>
                                    </div>
                                    <div>
                                    <label className="text-sm text-gray-400">{t('CVC')}</label>
                                    <input type="text" name="cardCVC" value={formData.cardCVC} onChange={handleChange} placeholder="•••" className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-1 text-white"/>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                            <p className="text-gray-300 mb-4">{t('Scan_or_copy_address_below')}</p>
                            <div className="w-40 h-40 bg-white p-2 rounded-md mx-auto flex items-center justify-center text-black">QR Code</div>
                            <input type="text" readOnly value="0x1234...abcd" className="w-full bg-gray-800 border-gray-700 rounded-md p-2 mt-4 text-white text-center text-sm"/>
                            </div>
                        )}
                        </div>
                    </div>
                );
            case 4:
                 return (
                    <div className="text-center">
                        <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type: 'spring', stiffness: 260, damping: 20}} className="w-16 h-16 bg-gray-500/20 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </motion.div>
                        <h2 className="text-3xl font-bold text-white mb-2">{t('Welcome_to_the_Club')}</h2>
                        <p className="text-gray-300 max-w-md mx-auto">{t('Your_membership_is_now_active')}</p>
                        <button type="button" onClick={() => navigate('/club-dashboard')} className="mt-8 bg-white text-black px-6 py-2 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors">
                            {t('Go_to_Dashboard')}
                        </button>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-32 pb-24 bg-black min-h-screen"
        >
        <div className="container mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
                {t('Enroll_in_DR7_Club')}
            </h1>

            {step < 4 && (
                <div className="w-full max-w-md mx-auto mb-12">
                    <div className="flex items-center justify-between">
                        {steps.map((s, index) => (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.id ? 'bg-white border-white text-black' : 'border-gray-600 text-gray-400'}`}>
                                        {s.id}
                                    </div>
                                    <p className={`mt-2 text-xs font-semibold ${step >= s.id ? 'text-white' : 'text-gray-500'}`}>{s.name}</p>
                                </div>
                                {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${step > s.id ? 'bg-white' : 'bg-gray-700'}`}></div>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                <aside className="lg:col-span-1 lg:sticky lg:top-32 self-start mb-8 lg:mb-0">
                    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                        <h2 className="text-2xl font-bold text-white mb-4">{t('Membership_Summary')}</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-400">{t('Selected_Tier')}</span><span className="text-white font-medium">{getTranslated(tier.name)}</span></div>
                             <div className="flex justify-between"><span className="text-gray-400">{t('Billed')}</span><span className="text-white font-medium">{t(formData.billingCycle === 'monthly' ? 'Monthly' : 'Annually')}</span></div>
                            <div className="flex justify-between text-lg border-t border-white/20 pt-2 mt-2"><span className="text-white font-bold">{t('Total')}</span><span className="text-white font-bold">{formattedPrice}</span></div>
                        </div>
                    </div>
                </aside>

                <main className="lg:col-span-2">
                    <form onSubmit={handleSubmit}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                                className="bg-gray-900/50 p-8 rounded-lg border border-gray-800"
                            >
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>
                        {step < 4 && (
                            <div className="flex justify-between mt-8">
                                <button type="button" onClick={handleBack} disabled={step === 1} className="px-8 py-3 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('Back')}</button>
                                {step < 3 ?
                                    <button type="button" onClick={handleNext} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">{t('Next')}</button> :
                                    <button type="submit" disabled={isProcessing} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed">
                                        {isProcessing ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    className="w-5 h-5 border-2 border-t-black border-gray-700/50 rounded-full inline-block mr-2"
                                                />
                                                {t('Processing')}
                                            </>
                                        ) : t('Confirm_and_Pay')}
                                    </button>
                                }
                            </div>
                        )}
                    </form>
                </main>
            </div>
        </div>
        </motion.div>
    );
};
  
export default ClubEnrollmentPage;