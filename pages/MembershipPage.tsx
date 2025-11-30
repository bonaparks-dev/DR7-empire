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
                <span className="text-gray-400" translate="no">/{t(billingCycle === 'monthly' ? 'Monthly' : 'Annually')}</span>
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
    const { t, lang } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

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
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        DR7 MEMBERSHIP CLUB
                    </h1>
                    <p className="text-xl text-gray-300 mb-2 max-w-2xl mx-auto font-semibold">
                        Non è un abbonamento. È uno status.
                    </p>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
                        Diventa parte del DR7 Luxury Empire — accesso, vantaggi, precedenza.
                    </p>

                    {/* Billing Cycle Toggle */}
                    <div className="inline-flex items-center bg-gray-900/50 border border-gray-800 rounded-full p-1 mt-4">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                                billingCycle === 'monthly'
                                    ? 'bg-white text-black'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <span translate="no">Mensile</span>
                        </button>
                        <button
                            onClick={() => setBillingCycle('annually')}
                            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                                billingCycle === 'annually'
                                    ? 'bg-white text-black'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <span translate="no">Annuale</span>
                        </button>
                    </div>
                    {billingCycle === 'annually' && (
                        <p className="text-sm text-green-400 mt-2">
                            Risparmia 2 mesi pagando annualmente
                        </p>
                    )}
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

                {/* Optional Add-on Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-16 max-w-4xl mx-auto"
                >
                    <div className="bg-gradient-to-r from-gray-900/80 to-black border border-gray-800 rounded-lg p-8 text-center">
                        <h3 className="text-2xl font-bold text-white mb-4">
                            Add-on opzionale per tutti i piani
                        </h3>
                        <div className="bg-black/40 border border-gray-700 rounded-lg p-6 inline-block">
                            <p className="text-gray-300 mb-2">
                                <span className="text-3xl font-bold text-white">€250</span>
                                <span className="text-gray-400 ml-2">una tantum</span>
                            </p>
                            <p className="text-lg text-gray-300">
                                Tessera fisica DR7 in acciaio personalizzata
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    </motion.div>
  );
};

export default MembershipPage;