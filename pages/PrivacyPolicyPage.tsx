import React, { useEffect, useState } from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import LegalDocumentRenderer from '../components/layout/LegalDocumentRenderer';
import { getLegalPage, type LegalPageCopy } from '../utils/siteCopy';

/**
 * Falls back to the legacy hardcoded body if the admin has not enabled
 * the page in centralina_pro_config.config.site_copy.legal.
 */
const PrivacyPolicyPage: React.FC = () => {
    const [copy, setCopy] = useState<LegalPageCopy | null | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;
        getLegalPage('privacy').then((c) => { if (!cancelled) setCopy(c); });
        return () => { cancelled = true; };
    }, []);

    if (copy === undefined) {
        return <LegalPageLayout title="Informativa sulla Privacy"><p>Caricamento…</p></LegalPageLayout>;
    }
    if (copy) return <LegalDocumentRenderer copy={copy} />;

    // Legacy fallback (kept verbatim).
    return (
        <LegalPageLayout title="Informativa sulla Privacy">
            <p><strong>Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</strong></p>
            <h2>1. Introduzione e Titolare del Trattamento</h2>
            <p>Dubai Rent 7.0 S.p.A. – DR7 ("noi", "nostro" o "ci") si impegna a proteggere la tua privacy. Questa Informativa sulla Privacy spiega come raccogliamo, utilizziamo, divulghiamo e proteggiamo i tuoi dati personali quando utilizzi i nostri servizi. Questa informativa è fornita in conformità con il Regolamento Generale sulla Protezione dei Dati (GDPR) dell'UE.</p>
            <p>DR7 è il Titolare del Trattamento dei dati personali raccolti attraverso la nostra piattaforma ed è responsabile dei tuoi dati personali.</p>
            <h2>2. Contattaci</h2>
            <p>Se hai domande su questa Informativa sulla Privacy, contatta il nostro Responsabile della Privacy dei Dati all'indirizzo: <a href="mailto:info@dr7.app">info@dr7.app</a>.</p>
        </LegalPageLayout>
    );
};

export default PrivacyPolicyPage;
