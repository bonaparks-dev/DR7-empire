import React, { useState } from 'react';
import { MEMBERSHIP_TIERS } from '../constants';
import { useTranslation } from '../hooks/useTranslation';
import { useCurrency } from '../contexts/CurrencyContext';
import { motion, Variants } from 'framer-motion';
import type { MembershipTier } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const TierCard: React.FC<{ tier: MembershipTier; billingCycle: 'monthly' | 'annually'; onSelect: () => void; }> = ({ tier, billingCycle, onSelect }) => {
    const { t, lang } = useTranslation();
    const { currency } = useCurrency();
    
    const price = tier.price[billingCycle];
    const formattedPrice = new Intl.NumberFormat(currency === 'eur' ? 'it-IT' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(price[currency]);

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };
    
    return (
        <motion.div 
            variants={cardVariants}
            className={`relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-8 flex flex-col transition-all duration-300 ${tier.isPopular ? 'border-white' : 'hover:border-gray-600'}`}
        >
            {tier.isPopular && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full text-sm font-semibold">{t('Most_Popular')}</div>
            )}
            <h3 className="text-2xl font-bold text-white text-center">{tier.name[lang]}</h3>
            <div className="my-6 text-center">
                <span className="text-5xl font-extrabold text-white">{formattedPrice}</span>
                <span className="text-gray-400">/{t(billingCycle === 'monthly' ? 'Monthly' : 'Annually')}</span>
            </div>
            <ul className="space-y-4 text-gray-300 mb-8 flex-grow">
                {tier.features[lang].map((feature, index) => (
                    <li key={index} className="flex items-start">
                        {typeof feature === 'string' ? (
                            <>
                                <svg className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                <span>{feature}</span>
                            </>
                        ) : (
                            <>
                                <feature.icon className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-1" />
                                <span>{feature.text}</span>
                            </>
                        )}
                    </li>
                ))}
            </ul>
            <button 
                onClick={onSelect}
                className={`w-full mt-auto py-3 px-6 font-bold rounded-full transition-all duration-300 transform hover:scale-105 ${tier.isPopular ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
            >
                {t('Select_Plan')}
            </button>
        </motion.div>
    );
};


const MembershipPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');
    
    const handleSelectTier = (tierId: string) => {
        if (user) {
            navigate(`/membership/enroll/${tierId}?billing=${billingCycle}`);
        } else {
            navigate('/signin', { state: { from: { pathname: `/membership/enroll/${tierId}`, search: `?billing=${billingCycle}` } } });
        }
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
    >
        <div className="pt-32 pb-24 bg-black">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white">
                        {t('Join_The_Club')}
                    </h1>
                    <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">{t('Choose_your_tier_and_unlock_a_world_of_privileges')}</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-10 flex justify-center items-center space-x-4"
                >
                    <span className={`font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>{t('Monthly')}</span>
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            id="billing-toggle" 
                            className="sr-only" 
                            checked={billingCycle === 'annually'}
                            onChange={() => setBillingCycle(prev => prev === 'monthly' ? 'annually' : 'monthly')}
                        />
                        <label htmlFor="billing-toggle" className="block w-14 h-8 bg-gray-800 rounded-full cursor-pointer border border-gray-700">
                            <span className={`block w-6 h-6 mt-1 ml-1 bg-white rounded-full transform transition-transform duration-300 ${billingCycle === 'annually' ? 'translate-x-6 bg-white' : ''}`}></span>
                        </label>
                    </div>
                    <span className={`font-semibold transition-colors ${billingCycle === 'annually' ? 'text-white' : 'text-gray-500'}`}>{t('Annually')}</span>
                    <span className="bg-gray-700 text-gray-200 text-xs font-bold px-2 py-1 rounded-md">{t('Save')} 16%</span>
                </motion.div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 max-w-6xl mx-auto"
                >
                    {MEMBERSHIP_TIERS.map(tier => (
                        <TierCard key={tier.id} tier={tier} billingCycle={billingCycle} onSelect={() => handleSelectTier(tier.id)} />
                    ))}
                </motion.div>
            </div>
        </div>
    </motion.div>
  );
};

export default MembershipPage;