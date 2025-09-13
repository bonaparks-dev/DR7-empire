import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

const AboutPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Founders & Story Section */}
            <section className="pt-32 pb-20 bg-black">
                <div className="container mx-auto px-6">
                    {/* Founder Portraits */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.7 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 justify-items-center max-w-3xl mx-auto mb-16"
                    >
                        <div className="flex flex-col items-center">
                            <div className="relative w-64 h-80 mx-auto">
                                <img
                                    src="/Valerio.jpeg"
                                    alt="Valerio - Co-fondatore DR7 Empire"
                                    className="w-full h-full object-cover rounded-lg shadow-2xl shadow-white/10"
                                />
                                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded">
                                    <p className="text-white font-semibold">Valerio</p>
                                    <p className="text-white/80 text-sm">Co-fondatore</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center">
                            <div className="relative w-64 h-80 mx-auto">
                                <img
                                    src="/Ilenia.jpeg"
                                    alt="Ilenia - Co-fondatrice DR7 Empire"
                                    className="w-full h-full object-cover rounded-lg shadow-2xl shadow-white/10"
                                />
                                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded">
                                    <p className="text-white font-semibold">Ilenia</p>
                                    <p className="text-white/80 text-sm">Co-fondatrice</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Story Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 md:p-12 shadow-2xl shadow-white/10">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
                                DR7 Empire non è un nome. È una misura.
                            </h2>
                            
                            <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
                                <p>
                                    Nasce da un'idea semplice: il lusso va organizzato, non esibito. Per questo l'abbiamo costruito come un impero del lusso: supercar pronte quando arrivate, ville che respirano ordine, yacht che aspettano la rotta giusta, elicotteri e jet privati che accorciano le distanze, una membership che apre porte con discrezione.
                                </p>
                                
                                <p>
                                    Siamo Valerio e Ilenia, co-leader e creatori del brand. Camminiamo allo stesso passo: uniamo la calma delle cose fatte bene alla precisione dei tempi rispettati. La Sardegna ci ha insegnato l'essenziale: il mare all'alba, il vento che cambia, il valore del silenzio. DR7 Empire prende da qui la sua regola: meno rumore, più certezza.
                                </p>
                                
                                <p>
                                    Non promettiamo scintille; promettiamo cura. Una chiave consegnata a mano, un itinerario che scorre senza attriti, un arrivo dove è già tutto pronto. Ogni esperienza porta la nostra firma: supercar, ville, yacht, elicotteri, jet, membership — diverse forme, lo stesso standard.
                                </p>
                                
                                <p>
                                    La nostra promessa è semplice: tempo guadagnato, bellezza preservata, serenità garantita. Se cercate un effetto speciale, troverete invece una costanza rara: quella delle cose organizzate con intelligenza e rispetto.
                                </p>
                            </div>
                            
                            <div className="mt-12 text-center">
                                <p className="text-2xl font-semibold text-white mb-4">
                                    Benvenuti in DR7 Empire
                                </p>
                                <p className="text-lg text-gray-400 italic">
                                    L'impero del lusso che vi accompagna, con discrezione, ovunque scegliate di andare.
                                </p>
                                <div className="mt-6 flex justify-center">
                                    <p className="text-lg font-medium text-white">
                                        — Valerio & Ilenia
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

             {/* Careers CTA */}
            <section className="py-24 relative bg-gray-900/40">
                <div className="container mx-auto px-6 text-center relative z-10">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl font-bold text-white">{t('Join_Our_Team')}</motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">{t('Join_Our_Team_Statement')}</motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-8"
                    >
                        <Link to="/careers" className="bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-all duration-300 transform hover-scale-105">
                            {t('View_Openings')}
                        </Link>
                    </motion.div>
                </div>
            </section>

        </motion.div>
    );
};

export default AboutPage;