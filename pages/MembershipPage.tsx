
import React, { useState } from 'react';
import { MEMBERSHIP_TIERS } from '../constants';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';

const MembershipTierCard: React.FC<{ tier: (typeof MEMBERSHIP_TIERS)[0]; billingCycle: 'monthly' | 'annually' }> = ({ tier, billingCycle }) => {
    const { t, lang, getTranslated } = useTranslation();
    
    const price = tier.price[billingCycle];
    const currency = lang === 'it' ? 'eur' : 'usd';
    const formattedPrice = new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-US').format(price[currency]);

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };
    
    return (
        <motion.div 
            variants={cardVariants}
            className={`relative bg-stone-900/50 backdrop-blur-sm border border-stone-800 rounded-lg p-8 flex flex-col transition-all duration-300 ${tier.isPopular ? 'border-amber-400' : 'hover:border-stone-600'}`}
        >
            {tier.isPopular && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-amber-400 text-black px-4 py-1 rounded-full text-sm font-semibold">{t('Most_Popular')}</div>
            )}
            <h3 className="text-2xl font-bold text-white text-center">{getTranslated(tier.name)}</h3>
            <div className="my-6 text-center">
                <span className="text-5xl font-extrabold text-white">${formattedPrice}</span>
                <span className="text-stone-400">/{t(billingCycle === 'monthly' ? 'Monthly' : 'Annually')}</span>
            </div>
            <ul className="space-y-4 text-stone-300 mb-8 flex-grow">
                {tier.features[lang].map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-amber-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            <button className={`w-full mt-auto py-3 px-6 rounded-full font-bold text-sm transition-all duration-300 ${tier.isPopular ? 'bg-amber-400 text-black hover:bg-amber-300' : 'bg-stone-700 text-white hover:bg-stone-600'}`}>
                {t('Select_Plan')}
            </button>
        </motion.div>
    );
}

const MembershipPage: React.FC = () => {
    const { t } = useTranslation();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.15
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
                           <span className="text-amber-400">{t('Join_The_Club')}</span>
                        </h1>
                        <p className="mt-4 text-lg text-stone-400 max-w-2xl mx-auto">{t('Choose_your_tier_and_unlock_a_world_of_privileges')}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-12 flex justify-center items-center space-x-4"
                    >
                        <span className={`font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-stone-500'}`}>{t('Monthly')}</span>
                        <div className="relative">
                            <button onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')} className="w-14 h-8 bg-stone-700 rounded-full flex items-center p-1 transition-colors">
                                <motion.div layout transition={{type: 'spring', stiffness: 700, damping: 30}} className={`w-6 h-6 bg-white rounded-full ${billingCycle === 'annually' ? 'ml-6' : 'ml-0'}`}></motion.div>
                            </button>
                        </div>
                        <span className={`font-semibold transition-colors ${billingCycle === 'annually' ? 'text-white' : 'text-stone-500'}`}>{t('Annually')}</span>
                        <span className="bg-amber-900/50 text-amber-300 text-xs font-bold px-2 py-1 rounded-md">{t('Save')} 16%</span>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 max-w-6xl mx-auto"
                    >
                        {MEMBERSHIP_TIERS.map(tier => (
                            <MembershipTierCard key={tier.id} tier={tier} billingCycle={billingCycle} />
                        ))}
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default MembershipPage;
