import React from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import { useTranslation } from '../hooks/useTranslation';

const CareersPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <LegalPageLayout title={t('Careers')}>
            <p>Unisciti a un team appassionato di lusso e dedicato a fornire esperienze senza pari. In DR7 Empire, siamo sempre alla ricerca di talenti eccezionali per aiutarci a superare i confini dell'eccellenza.</p>

            <h2>Posizioni Aperte</h2>

            <div className="mt-8 space-y-6">
                <div>
                    <h3>Curatore di Esperienze di Lusso</h3>
                    <p className="text-sm text-stone-400">Sede: Cagliari, Italia | Tempo pieno</p>
                    <p className="mt-2">Cerchiamo una persona creativa e attenta ai dettagli per progettare e gestire esperienze di lusso su misura per la nostra clientela d'élite.</p>
                </div>
                <div>
                    <h3>Specialista Relazioni Clienti</h3>
                    <p className="text-sm text-stone-400">Sede: Remoto | Tempo pieno</p>
                    <p className="mt-2">Come Specialista Relazioni Clienti, sarai il punto di contatto principale per i nostri membri, assicurando che le loro esigenze siano soddisfatte con il massimo livello di servizio.</p>
                </div>
            </div>

            <h2 className="mt-12">Come Candidarsi</h2>
            <p>Se pensi di avere ciò che serve per far parte di DR7 Empire, invia il tuo curriculum vitae e una lettera di presentazione a <a href="mailto:Dubai.rent7.0srl@gmail.com" className="text-white underline hover:text-gray-300">Dubai.rent7.0srl@gmail.com</a>.</p>
        </LegalPageLayout>
    );
};

export default CareersPage;
