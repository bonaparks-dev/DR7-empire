import React, { useState } from 'react';
import { MEMBERSHIP_TIERS } from '../constants';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const MembershipPage: React.FC = () => {
    const { t, lang } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

    const club = MEMBERSHIP_TIERS[0];
    const price = club.price[billingCycle].eur;
    const annualPrice = club.price.annually.eur;
    const monthlyPrice = club.price.monthly.eur;
    const annualMonthly = +(annualPrice / 12).toFixed(2);

    const handleSubscribe = () => {
        if (user) {
            navigate(`/membership/enroll/${club.id}?billing=${billingCycle}`);
        } else {
            navigate('/signin', { state: { from: { pathname: `/membership/enroll/${club.id}`, search: `?billing=${billingCycle}` } } });
        }
    };

    const rewardRules = [
        { label: lang === 'it' ? 'Pagamento anticipato (100%)' : 'Full prepayment (100%)', reward: '2%', note: lang === 'it' ? 'fino al 4% per livelli più alti' : 'up to 4% at higher levels' },
        { label: lang === 'it' ? 'Pagamento con acconto (30%)' : 'Deposit payment (30%)', reward: '1%', note: null },
        { label: lang === 'it' ? 'Servizi extra' : 'Extra services', reward: '2%', note: null },
        { label: 'Prime Wash', reward: '3%', note: null },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Hero */}
            <div className="pt-32 pb-20 bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <p className="text-sm tracking-[0.3em] text-gray-400 uppercase mb-4">Exclusive</p>
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                            DR7 CLUB
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 font-light mb-3">
                            {lang === 'it'
                                ? 'Ogni prenotazione ti premia. Ogni servizio ti ripaga.'
                                : 'Every booking rewards you. Every service pays you back.'}
                        </p>
                        <p className="text-gray-500 text-lg">
                            {lang === 'it'
                                ? 'Attiva il tuo wallet reward a partire da soli'
                                : 'Activate your reward wallet starting from just'}
                            {' '}
                            <span className="text-white font-bold">€{monthlyPrice.toFixed(2).replace('.', ',')}/mese</span>
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-black pb-20">
                <div className="container mx-auto px-6 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {/* Billing Toggle */}
                        <div className="flex justify-center mb-10">
                            <div className="inline-flex bg-gray-900 border border-gray-800 rounded-full p-1">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                                        billingCycle === 'monthly'
                                            ? 'bg-white text-black'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {lang === 'it' ? 'Mensile' : 'Monthly'}
                                </button>
                                <button
                                    onClick={() => setBillingCycle('annually')}
                                    className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 relative ${
                                        billingCycle === 'annually'
                                            ? 'bg-white text-black'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {lang === 'it' ? 'Annuale' : 'Annual'}
                                    <span className="absolute -top-2 -right-2 bg-green-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        -33%
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Price Card */}
                        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 md:p-12 max-w-2xl mx-auto">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-6">DR7 CLUB</h2>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-6xl md:text-7xl font-extrabold text-white">
                                        €{billingCycle === 'monthly' ? monthlyPrice.toFixed(2).replace('.', ',') : annualPrice}
                                    </span>
                                    <span className="text-gray-400 text-lg">
                                        /{billingCycle === 'monthly' ? (lang === 'it' ? 'mese' : 'month') : (lang === 'it' ? 'anno' : 'year')}
                                    </span>
                                </div>
                                {billingCycle === 'annually' && (
                                    <p className="text-green-400 text-sm mt-2">
                                        {lang === 'it'
                                            ? `Solo €${annualMonthly.toFixed(2).replace('.', ',')} al mese — risparmi €${((monthlyPrice * 12) - annualPrice).toFixed(2).replace('.', ',')} all'anno`
                                            : `Just €${annualMonthly.toFixed(2)}/month — save €${((monthlyPrice * 12) - annualPrice).toFixed(2)}/year`}
                                    </p>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-4 mb-10">
                                {club.features[lang].map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-white mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-gray-300">{typeof feature === 'string' ? feature : feature.text}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={handleSubscribe}
                                className="w-full py-4 bg-white text-black font-bold text-lg rounded-full hover:bg-gray-200 transition-all duration-200 transform hover:scale-[1.02]"
                            >
                                {lang === 'it' ? 'Iscriviti ora' : 'Subscribe now'}
                            </button>
                            <p className="text-center text-gray-500 text-xs mt-3">
                                {lang === 'it'
                                    ? 'Puoi annullare in qualsiasi momento dal tuo account.'
                                    : 'Cancel anytime from your account.'}
                            </p>
                        </div>
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
                </div>
            </div>

            {/* Reward System Section */}
            <div className="bg-black pb-24 border-t border-gray-900">
                <div className="container mx-auto px-6 max-w-4xl pt-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            {lang === 'it' ? 'Come funziona il Reward' : 'How Rewards Work'}
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto">
                            {lang === 'it'
                                ? 'Accumula credito nel tuo wallet ad ogni prenotazione e servizio. Il reward dipende dal tuo comportamento, non dal metodo di pagamento.'
                                : 'Earn wallet credit on every booking and service. Rewards are based on your behavior, not your payment method.'}
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        {rewardRules.map((rule, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                className="bg-gray-900/50 border border-gray-800 rounded-xl p-5"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-white font-semibold text-sm">{rule.label}</span>
                                    <span className="bg-white text-black text-sm font-bold px-2.5 py-0.5 rounded-full">
                                        {rule.reward}
                                    </span>
                                </div>
                                {rule.note && (
                                    <p className="text-gray-500 text-xs">{rule.note}</p>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-10 text-center"
                    >
                        <div className="inline-flex items-center gap-2 bg-gray-900/50 border border-gray-800 rounded-full px-5 py-2.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-400 text-sm">
                                {lang === 'it'
                                    ? 'Senza DR7 Club il sistema reward non è attivo.'
                                    : 'Without DR7 Club the reward system is not active.'}
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default MembershipPage;
