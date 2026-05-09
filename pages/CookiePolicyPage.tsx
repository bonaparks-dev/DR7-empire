import React, { useEffect, useState } from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import LegalDocumentRenderer from '../components/layout/LegalDocumentRenderer';
import { useTranslation } from '../hooks/useTranslation';
import { getLegalPage, type LegalPageCopy } from '../utils/siteCopy';

const CookiePolicyPage: React.FC = () => {
    const { t } = useTranslation();
    const [copy, setCopy] = useState<LegalPageCopy | null | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;
        getLegalPage('cookie').then((c) => { if (!cancelled) setCopy(c); });
        return () => { cancelled = true; };
    }, []);

    if (copy === undefined) {
        return <LegalPageLayout title={t('Cookie_Policy')}><p>Caricamento…</p></LegalPageLayout>;
    }
    if (copy) return <LegalDocumentRenderer copy={copy} />;

    return (
        <LegalPageLayout title={t('Cookie_Policy')}>
            <p>Ultimo Aggiornamento: {new Date().toLocaleDateString('it-IT')}</p>
            <h2>1. Cosa Sono i Cookie?</h2>
            <p>I cookie sono piccoli file di testo memorizzati sul tuo dispositivo quando visiti un sito web. Aiutano a far funzionare i siti più efficientemente e a fornire informazioni ai gestori.</p>
        </LegalPageLayout>
    );
};

export default CookiePolicyPage;
