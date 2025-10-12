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
                <div className="text-center py-8 border-b border-gray-800">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Non stiamo crescendo. Stiamo conquistando.
                    </h2>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-gray-800 rounded-xl p-6 text-center transform transition-all duration-300 hover:scale-105 hover:border-white/30">
                        <div className="text-4xl font-bold text-white mb-2">1.700+</div>
                        <div className="text-gray-400 text-sm">Contratti Chiusi</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-gray-800 rounded-xl p-6 text-center transform transition-all duration-300 hover:scale-105 hover:border-white/30">
                        <div className="text-4xl font-bold text-white mb-2">€1.4M+</div>
                        <div className="text-gray-400 text-sm">Fatturato</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-gray-800 rounded-xl p-6 text-center transform transition-all duration-300 hover:scale-105 hover:border-white/30">
                        <div className="text-4xl font-bold text-white mb-2">900+</div>
                        <div className="text-gray-400 text-sm">Clienti Certificati</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-gray-800 rounded-xl p-6 text-center transform transition-all duration-300 hover:scale-105 hover:border-white/30">
                        <div className="text-4xl font-bold text-white mb-2">{reviewCount}+</div>
                        <div className="text-gray-400 text-sm">Recensioni 5 Stelle</div>
                    </div>
                </div>

                <div className="text-center text-gray-400 text-sm">
                    TUTTO in poco più di un anno.
                </div>

                {/* Expansion Plan */}
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold text-white mb-6 text-center">Il Nostro Piano di Espansione</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🏢</span>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Cagliari</h4>
                            <p className="text-gray-400 text-sm">Sede Principale</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🚀</span>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Iglesias</h4>
                            <p className="text-gray-400 text-sm">Franchising Operativo</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🎯</span>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">300 Sedi</h4>
                            <p className="text-gray-400 text-sm">Obiettivo Italia</p>
                        </div>
                    </div>
                </div>

                {/* About DR7 */}
                <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold text-white mb-6">L'Impero DR7</h3>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-2xl">
                                ✓
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white mb-2">Zero Fee d'Ingresso</h4>
                                <p className="text-gray-400">Accesso solo su selezione. Non tutti possono far parte di un impero.</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-2xl">
                                🏆
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white mb-2">Più di un Brand</h4>
                                <p className="text-gray-400">Un metodo, una struttura, una reputazione. Un nome sinonimo di dominio.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/30 rounded-2xl p-8 text-center">
                    <h3 className="text-2xl font-bold text-white mb-4">
                        Cerchiamo Dominatori di Mercato
                    </h3>
                    <p className="text-gray-300 mb-6">
                        Non affiliati. Imprenditori pronti a portare il nome DR7 Luxury Empire nel proprio territorio.
                    </p>
                    <div className="inline-block bg-white/10 border border-white/30 rounded-xl p-6 mb-6">
                        <p className="text-white font-semibold mb-2">
                            Se vuoi entrare in un impero destinato a durare, il momento è ora.
                        </p>
                        <p className="text-gray-400 text-sm">
                            I posti sono limitati. Le sedi non si conquistano due volte.
                        </p>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-gradient-to-br from-gray-900/80 to-black/80 border-2 border-gray-800 rounded-2xl p-8 text-center">
                    <h3 className="text-2xl font-bold text-white mb-4">Candidati Ora</h3>
                    <p className="text-gray-300 mb-6">Per candidarti o per maggiori informazioni, contattaci:</p>
                    <a
                        href="mailto:Dubai.rent7.0spa@gmail.com"
                        className="inline-block bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
                    >
                        Dubai.rent7.0spa@gmail.com
                    </a>
                </div>

                {/* Footer Statement */}
                <div className="text-center py-8 border-t border-gray-800">
                    <p className="text-2xl font-bold text-white">
                        DR7 Luxury Empire.
                    </p>
                    <p className="text-xl text-gray-400 mt-2">
                        Non segui il mercato. Lo governi.
                    </p>
                </div>
            </div>
        </LegalPageLayout>
    );
};

export default FranchisingPage;