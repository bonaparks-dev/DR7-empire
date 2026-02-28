import React from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import { useTranslation } from '../hooks/useTranslation';

const TermsOfServicePage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <LegalPageLayout title={t('Terms_of_Service')}>
            <p><strong>Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</strong></p>

            <h2>1. Accettazione dei Termini</h2>
            <p>Benvenuto su DR7 Empire ("DR7", "noi", "nostro"). Le presenti Condizioni Generali del Servizio di Intermediazione ("Termini") disciplinano l'utilizzo della nostra piattaforma e dei nostri servizi (collettivamente, i "Servizi"). Accedendo o utilizzando i nostri Servizi, l'utente accetta di essere vincolato dai presenti Termini e dalla nostra Informativa sulla Privacy. In caso di disaccordo, è vietato utilizzare i Servizi.</p>
            <p>I presenti Termini costituiscono un accordo legalmente vincolante tra l'utente ("Cliente", "tu") e DR7 Empire, relativo all'accesso e all'utilizzo della piattaforma DR7.</p>

            <h2>2. Il Nostro Ruolo di Intermediario</h2>
            <p>DR7 fornisce un servizio esclusivo di intermediazione, agendo come tramite per mettere in contatto l'utente con una rete selezionata di proprietari e operatori terzi ("Proprietari") di beni di lusso, inclusi ma non limitati a automobili, yacht, ville e jet privati ("Beni").</p>
            <p><strong>IMPORTANTE:</strong> DR7 non è il proprietario, l'operatore o l'assicuratore dei Beni. Il nostro ruolo è strettamente limitato a facilitare il processo di prenotazione tra l'utente e il Proprietario. La fornitura del Bene è di esclusiva responsabilità del Proprietario. Il noleggio o il charter di un Bene sarà soggetto a un accordo separato e legalmente vincolante tra l'utente e il rispettivo Proprietario ("Contratto di Noleggio").</p>

            <h2>3. Account Utente e Verifica del Cliente</h2>
            <p>Per accedere ai nostri Servizi, è necessario avere almeno 25 anni e la capacità giuridica di stipulare contratti vincolanti. È richiesta la registrazione di un account con informazioni accurate e complete. Per conformità alle normative italiane e internazionali, incluse le leggi antiriciclaggio (AML), potremmo richiedere la verifica dell'identità, incluso un documento di identità rilasciato dal governo, prima di confermare prenotazioni di alto valore.</p>

            <h2>4. Prenotazioni, Pagamenti e Condizioni Finanziarie</h2>
            <p><strong>Processo di prenotazione:</strong> Una richiesta di prenotazione inoltrata tramite la nostra piattaforma costituisce un'offerta di noleggio di un Bene. La prenotazione è confermata solo al ricevimento di una conferma formale da parte nostra e all'accettazione del Contratto di Noleggio del Proprietario.</p>
            <p><strong>Pagamenti:</strong> In qualità di intermediario, DR7 facilita i pagamenti dall'utente al Proprietario. L'utente ci autorizza ad addebitare il metodo di pagamento prescelto per l'importo totale della prenotazione, che include il canone di noleggio, le eventuali tasse applicabili e un deposito cauzionale. Il deposito cauzionale è trattenuto e gestito secondo i termini del Contratto di Noleggio del Proprietario.</p>

            <h2>5. Ruolo dei Proprietari Terzi</h2>
            <p>I Proprietari sono entità indipendenti e non sono dipendenti o agenti di DR7. I Proprietari sono gli unici responsabili di:</p>
            <ul>
                <li>Garantire che il Bene sia in condizioni sicure, legali e operative.</li>
                <li>Fornire un'assicurazione completa per il Bene.</li>
                <li>Eseguire il Contratto di Noleggio finale con l'utente.</li>
                <li>La consegna, la gestione e il ritiro del Bene.</li>
            </ul>
            <p>Sebbene DR7 selezioni attentamente tutti i Proprietari della propria rete, non garantiamo le prestazioni o la qualità di alcun Bene o Proprietario.</p>

            <h2>6. Limitazione di Responsabilità</h2>
            <p>Nella misura massima consentita dalla legge italiana, la responsabilità di DR7 Empire è limitata al suo ruolo di servizio di intermediazione. Non saremo responsabili per danni diretti, indiretti, incidentali, speciali o consequenziali, inclusi ma non limitati a lesioni personali, danni alla proprietà, perdita di profitti o altre perdite immateriali, derivanti da:</p>
            <ul>
                <li>Le condizioni, le prestazioni o la legalità di qualsiasi Bene.</li>
                <li>Qualsiasi atto o omissione da parte di un Proprietario o del suo personale.</li>
                <li>I termini del, o la violazione da parte dell'utente del, Contratto di Noleggio tra l'utente e il Proprietario.</li>
                <li>Qualsiasi controversia tra l'utente e un Proprietario.</li>
            </ul>
            <p>La nostra responsabilità totale per qualsiasi questione derivante dai presenti Termini non supererà la commissione di intermediazione da noi ricevuta per la specifica prenotazione in questione.</p>

            <h2>7. Legge Applicabile e Foro Competente</h2>
            <p>I presenti Termini e l'utilizzo dei Servizi sono regolati e interpretati in conformità con le leggi italiane. L'utente accetta irrevocabilmente che il Tribunale di Cagliari, Italia, avrà giurisdizione esclusiva per risolvere qualsiasi controversia o reclamo derivante da o in connessione con il presente accordo o il suo oggetto.</p>

            <h2>8. Modifiche ai Termini e ai Servizi</h2>
            <p>Ci riserviamo il diritto di modificare i presenti Termini in qualsiasi momento. Forniremo avviso di eventuali modifiche sostanziali pubblicando i nuovi Termini sulla nostra piattaforma. L'uso continuato dei Servizi dopo tali modifiche costituisce accettazione dei nuovi Termini.</p>

            <h2>9. Policy Operativa – Tempi di Servizio e Consegna</h2>
            <p>I tempi indicati per i servizi (lavaggio, trattamenti, check-in, check-out e consegne veicoli) sono da intendersi come tempi stimati e indicativi, calcolati su condizioni operative standard.</p>
            <p>La durata effettiva del servizio può variare in base a:</p>
            <ul>
                <li>Stato del veicolo</li>
                <li>Livello di sporco o complessità dell'intervento</li>
                <li>Verifiche tecniche e controlli qualitativi</li>
                <li>Flussi operativi interni</li>
                <li>Eventuali ritardi logistici non prevedibili</li>
            </ul>
            <p>L'orario di prenotazione o consegna rappresenta una fascia operativa programmata e non un orario tassativo di inizio o rilascio immediato del veicolo.</p>
            <p>Eventuali variazioni contenute entro una normale tolleranza tecnica e organizzativa non costituiscono inadempimento contrattuale né danno diritto a riduzioni o rimborsi.</p>
            <p>L'azienda si impegna comunque a garantire la massima puntualità compatibilmente con gli standard qualitativi e di sicurezza previsti.</p>

            <h2>10. Informazioni di Contatto</h2>
            <p>Per qualsiasi domanda o comunicazione legale riguardante i presenti Termini, si prega di contattare il nostro ufficio legale all'indirizzo <a href="mailto:info@dr7.app">info@dr7.app</a>.</p>
        </LegalPageLayout>
    );
};

export default TermsOfServicePage;
