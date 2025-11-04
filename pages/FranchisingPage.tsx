import React, { useState, useEffect } from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import { useTranslation } from '../hooks/useTranslation';
import { fetchGoogleReviews } from '../services/googleReviews';

const FranchisingPage: React.FC = () => {
    const { t } = useTranslation();
    const [reviewCount, setReviewCount] = useState(246); // Fallback value

    useEffect(() => {
        const loadReviewCount = async () => {
            try {
                const data = await fetchGoogleReviews();
                setReviewCount(data.ratingSummary.reviewCount);
            } catch (error) {
                console.error('Failed to load review count:', error);
                // Keep fallback value
            }
        };
        loadReviewCount();
    }, []);

    return (
        <LegalPageLayout title={t('Franchising')}>
            <div className="space-y-8">
                {/* Hero Statement */}
                <div className="text-center py-6 md:py-8 border-b border-gray-800">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 px-4">
                        Vuoi aprire la tua sede DR7 nella tua città?
                    </h2>
                    <p className="text-lg md:text-xl text-gray-300 px-4 mb-2">
                        Diventa partner del gruppo che sta rivoluzionando il concetto di lusso in Italia.
                    </p>
                    <p className="text-base md:text-lg text-gray-400 px-4">
                        Nessun investimento impossibile, supporto totale della casa madre<br />
                        e un brand che cresce ogni singolo giorno.
                    </p>
                </div>

                {/* Main Stats - First Row */}
                <div className="text-center mb-4">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">🚀 In soli 18 mesi di attività</h3>
                </div>

                <div className="space-y-3 text-gray-300 px-4">
                    <p>* oltre 1.800 contratti firmati</p>
                    <p>* più di €1.500.000 di fatturato netto</p>
                    <p>* oltre €1.500.000 in parco auto</p>
                    <p>* più di 900 clienti attivi</p>
                    <p>* {reviewCount > 250 ? reviewCount : '250'} recensioni a 5 stelle reali</p>
                    <p>* Valutazione aziendale: €15.000.000</p>
                    <p>* Valutazione brand: oltre €4.000.000</p>
                    <p>* Da S.R.L. a S.P.A. in un solo anno.</p>
                </div>

                <div className="text-center py-4">
                    <p className="text-lg md:text-xl font-bold text-white mb-2">🔱</p>
                    <p className="text-base md:text-lg text-gray-300">Il brand di lusso più riconosciuto d'Italia.</p>
                    <p className="text-sm text-gray-400 mt-2">Italia • Dubai Rent 7.0 S.p.A.</p>
                </div>

                {/* Expansion Plan */}
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">Il Nostro Piano di Espansione</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-white/20 to-white/10 border border-white/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <div className="w-8 h-8 bg-white rounded-sm"></div>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Cagliari</h4>
                            <p className="text-gray-400 text-sm">Sede Principale</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-white/20 to-white/10 border border-white/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <div className="w-8 h-8 border-2 border-white transform rotate-45"></div>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Iglesias</h4>
                            <p className="text-gray-400 text-sm">Franchising Operativo</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-white/20 to-white/10 border border-white/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <div className="space-y-1">
                                    <div className="w-8 h-1 bg-white"></div>
                                    <div className="w-8 h-1 bg-white"></div>
                                    <div className="w-8 h-1 bg-white"></div>
                                </div>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">300 Sedi</h4>
                            <p className="text-gray-400 text-sm">Obiettivo Italia</p>
                        </div>
                    </div>
                </div>

                {/* About DR7 */}
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-6">L'Impero DR7</h3>
                    <div className="space-y-4 text-gray-300">
                        <p>
                            Nata come Dubai Rent 7.0 S.p.A., oggi DR7 è un impero del lusso e della mobilità.
                            Non un marchio. Non un esperimento. Ma una macchina che funziona, cresce e domina.
                        </p>
                        <p>
                            Abbiamo costruito un modello che integra mobilità, lusso ed esperienza in un solo ecosistema:
                            auto, supercar, yacht, elicotteri, jet privati e ville di lusso.
                            Un sistema già operativo, già profittevole, già riconosciuto.
                        </p>
                    </div>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-4 md:p-6">
                        <div className="flex items-start space-x-3 md:space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-white/20 to-white/10 border border-white/30 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-lg md:text-xl font-bold text-white mb-2">Più di un Brand</h4>
                                <p className="text-sm md:text-base text-gray-400">Un metodo, una struttura, una reputazione. Un nome sinonimo di dominio.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/30 rounded-2xl p-6 md:p-8 text-center">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
                        Cerchiamo Dominatori di Mercato
                    </h3>
                    <p className="text-sm md:text-base text-gray-300 mb-6">
                        Non affiliati. Imprenditori pronti a portare il nome DR7 Luxury Empire nel proprio territorio.
                    </p>
                    <div className="inline-block bg-white/10 border border-white/30 rounded-xl p-4 md:p-6 mb-6">
                        <p className="text-sm md:text-base text-white font-semibold mb-2">
                            Se vuoi entrare in un impero destinato a durare, il momento è ora.
                        </p>
                        <p className="text-gray-400 text-xs md:text-sm">
                            I posti sono limitati. Le sedi non si conquistano due volte.
                        </p>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border-2 border-gray-800 rounded-2xl p-6 md:p-8 text-center">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-4">💼 Invia la tua candidatura</h3>
                    <p className="text-sm md:text-base text-gray-300 mb-6">
                        e scopri come aprire la tua sede ufficiale DR7.
                    </p>
                    <div className="flex justify-center">
                        <a
                            href="mailto:info@dr7.app"
                            className="inline-block bg-white text-black px-6 md:px-8 py-4 rounded-full font-bold text-base md:text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 break-all max-w-full"
                        >
                            info@dr7.app
                        </a>
                    </div>
                </div>

                {/* Footer Statement */}
                <div className="text-center py-8 border-t border-gray-800">
                    <p className="text-sm text-gray-300 mb-4">
                        -<br />
                        &gt; "📩 Solo per veri imprenditori. Posti limitati per le nuove aperture 2025."
                    </p>
                </div>
            </div>
        </LegalPageLayout>
    );
};

export default FranchisingPage;