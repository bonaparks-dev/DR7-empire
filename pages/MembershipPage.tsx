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
                <span className="text-gray-400" translate="no">/{billingCycle === 'monthly' ? 'mese' : 'anno'}</span>
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
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
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

                {/* DR7 Elite Rewards Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-16 max-w-4xl mx-auto"
                >
                    <div className="bg-gradient-to-r from-gray-900/80 to-black border border-gray-800 rounded-lg p-10">
                        <h2 className="text-3xl font-bold text-white text-center mb-2">DR7 Elite Rewards</h2>
                        <p className="text-gray-400 text-center mb-8">
                            Accumula credito e utilizzalo sui servizi DR7
                        </p>
                        <p className="text-gray-300 text-center max-w-2xl mx-auto mb-10">
                            Con DR7 puoi ottenere vantaggi concreti fin da subito e aumentare il tuo credito semplicemente utilizzando la piattaforma e invitando i tuoi contatti.
                        </p>

                        {/* Vantaggi immediati */}
                        <div className="border-t border-gray-700 pt-8 mb-8">
                            <h3 className="text-xl font-bold text-white mb-4">Vantaggi immediati</h3>
                            <p className="text-gray-300 mb-3">Alla registrazione ricevi:</p>
                            <ul className="space-y-2 text-gray-300 ml-4 mb-4">
                                <li className="flex items-start">
                                    <span className="text-white mr-2">•</span>
                                    <span><span className="font-semibold text-white">10&euro;</span> nel tuo Wallet DR7</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-2">•</span>
                                    <span><span className="font-semibold text-white">50&euro;</span> di vantaggio utilizzabile su prenotazioni da almeno 250&euro;</span>
                                </li>
                            </ul>
                            <p className="text-gray-400 text-sm">
                                Il credito è utilizzabile direttamente sui servizi DR7 disponibili in piattaforma.
                            </p>
                        </div>

                        {/* Invita e guadagna */}
                        <div className="border-t border-gray-700 pt-8 mb-8">
                            <h3 className="text-xl font-bold text-white mb-4">Invita e guadagna</h3>
                            <p className="text-gray-300 mb-4">
                                Condividi DR7 con i tuoi contatti e accumula credito in modo illimitato.
                            </p>
                            <p className="text-gray-300 mb-2">Per ogni amico che:</p>
                            <ul className="space-y-1 text-gray-300 ml-4 mb-4">
                                <li className="flex items-start">
                                    <span className="text-white mr-2">•</span>
                                    <span>si registra tramite il tuo invito</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-2">•</span>
                                    <span>effettua una ricarica minima di 100&euro;</span>
                                </li>
                            </ul>
                            <p className="text-gray-300 mb-2">riceverai:</p>
                            <ul className="space-y-1 text-gray-300 ml-4 mb-4">
                                <li className="flex items-start">
                                    <span className="text-white mr-2">•</span>
                                    <span><span className="font-semibold text-white">50&euro;</span> di credito nel tuo Wallet DR7</span>
                                </li>
                            </ul>
                            <p className="text-gray-400 text-sm">Non sono previsti limiti al numero di inviti.</p>
                        </div>

                        {/* Come funziona */}
                        <div className="border-t border-gray-700 pt-8 mb-8">
                            <h3 className="text-xl font-bold text-white mb-4">Come funziona</h3>
                            <ol className="space-y-2 text-gray-300 ml-4">
                                <li className="flex items-start">
                                    <span className="text-white font-semibold mr-3 min-w-[20px]">1.</span>
                                    <span>Registrati su DR7</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white font-semibold mr-3 min-w-[20px]">2.</span>
                                    <span>Accedi al tuo Wallet personale</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white font-semibold mr-3 min-w-[20px]">3.</span>
                                    <span>Condividi il tuo invito</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white font-semibold mr-3 min-w-[20px]">4.</span>
                                    <span>Ricevi credito per ogni ricarica valida effettuata dai tuoi amici</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white font-semibold mr-3 min-w-[20px]">5.</span>
                                    <span>Utilizza il credito sui servizi disponibili</span>
                                </li>
                            </ol>
                        </div>

                        {/* Condizioni di utilizzo */}
                        <div className="border-t border-gray-700 pt-8 mb-8">
                            <h3 className="text-xl font-bold text-white mb-4">Condizioni di utilizzo</h3>
                            <ul className="space-y-2 text-gray-400 ml-4">
                                <li className="flex items-start">
                                    <span className="text-gray-500 mr-2">•</span>
                                    <span>Il credito è utilizzabile esclusivamente all'interno della piattaforma DR7</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-gray-500 mr-2">•</span>
                                    <span>I bonus vengono accreditati solo a seguito di ricariche effettivamente completate</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-gray-500 mr-2">•</span>
                                    <span>DR7 si riserva il diritto di verificare e validare ogni operazione</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-gray-500 mr-2">•</span>
                                    <span>Eventuali abusi o utilizzi non conformi comportano la sospensione dei benefici</span>
                                </li>
                            </ul>
                        </div>

                        {/* Inizia ora */}
                        <div className="border-t border-gray-700 pt-8 text-center">
                            <h3 className="text-xl font-bold text-white mb-3">Inizia ora</h3>
                            <p className="text-gray-300 mb-6">
                                Registrati, attiva il tuo Wallet e inizia ad accumulare credito con DR7.
                            </p>
                            <button
                                onClick={() => user ? navigate('/account') : navigate('/signin')}
                                className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
                            >
                                {user ? 'Vai al tuo Wallet' : 'Registrati ora'}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Optional Add-on Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mt-12 max-w-4xl mx-auto"
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