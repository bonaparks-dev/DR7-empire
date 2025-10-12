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
            <div className="space-y-6">
                <p className="text-lg font-semibold">Non stiamo crescendo. Stiamo conquistando.</p>

                <p>
                    Più di 1.700 contratti chiusi.<br/>
                    Più di 1.400.000 € di fatturato<br/>
                    Più di 900 clienti certificati<br/>
                    Più di {reviewCount} recensioni a 5 stelle<br/>
                    TUTTO in poco più di un anno.
                </p>

                <p>
                    Una sede principale a Cagliari.<br/>
                    Un franchising operativo a Iglesias.<br/>
                    E un piano preciso: 300 sedi in tutta Italia.
                </p>

                <p>
                    Nata come Dubai Rent 7.0 S.p.A., oggi DR7 è un impero del lusso e della mobilità.<br/>
                    Non un marchio. Non un esperimento.<br/>
                    Ma una macchina che funziona, cresce e domina.
                </p>

                <p>
                    Abbiamo costruito un modello che integra mobilità, lusso ed esperienza in un solo ecosistema:<br/>
                    auto, supercar, yacht, elicotteri, jet privati e ville di lusso.<br/>
                    Un sistema già operativo, già profittevole, già riconosciuto.
                </p>

                <p className="font-semibold">
                    Zero fee d'ingresso.<br/>
                    Accesso solo su selezione.<br/>
                    Non tutti possono far parte di un impero.
                </p>

                <p>
                    Chi entra in DR7 riceve molto più di un brand:<br/>
                    riceve un metodo, una struttura, una reputazione.<br/>
                    Un nome che in Sardegna è già sinonimo di dominio.<br/>
                    E che presto lo sarà in tutta Italia.
                </p>

                <p>
                    Se vuoi semplicemente aprire un'attività, non siamo noi.<br/>
                    Se vuoi entrare in un impero destinato a durare,<br/>
                    il momento è ora.
                </p>

                <p className="font-semibold">
                    Non cerchiamo affiliati.<br/>
                    Cerchiamo dominatori di mercato.<br/>
                    Imprenditori pronti a portare il nome DR7  Luxury Empire nel proprio territorio.
                </p>

                <p className="text-lg font-bold mt-8">
                    📝 Candidati ora.<br/>
                    I posti sono limitati. Le sedi non si conquistano due volte.
                </p>

                <p className="text-xl font-bold mt-8">
                    DR7 Luxury Empire.<br/>
                    Non segui il mercato. Lo governi.
                </p>

                <div className="mt-12 p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">Contattaci</h2>
                    <p>Per candidarti o per maggiori informazioni, contattaci a:</p>
                    <p className="mt-4">
                        <a href="mailto:support@dr7empire.com" className="text-white font-semibold hover:underline">
                            support@dr7empire.com
                        </a>
                    </p>
                </div>
            </div>
        </LegalPageLayout>
    );
};

export default FranchisingPage;