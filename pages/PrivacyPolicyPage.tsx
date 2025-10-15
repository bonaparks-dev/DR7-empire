import React from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';

const PrivacyPolicyPage: React.FC = () => {
    return (
        <LegalPageLayout title="Informativa sulla Privacy">
            <p><strong>Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</strong></p>

            <h2>1. Introduzione e Titolare del Trattamento</h2>
            <p>Dubai Rent 7.0 S.r.l. – DR7 Empire ("noi", "nostro" o "ci") si impegna a proteggere la tua privacy. Questa Informativa sulla Privacy spiega come raccogliamo, utilizziamo, divulghiamo e proteggiamo i tuoi dati personali quando utilizzi i nostri servizi. Questa informativa è fornita in conformità con il Regolamento Generale sulla Protezione dei Dati (GDPR) dell'UE.</p>
            <p>DR7 Empire è il Titolare del Trattamento dei dati personali raccolti attraverso la nostra piattaforma ed è responsabile dei tuoi dati personali.</p>

            <h2>2. Dati Personali che Raccogliamo</h2>
            <p>Possiamo raccogliere, utilizzare, archiviare e trasferire diversi tipi di dati personali su di te, che abbiamo raggruppato come segue:</p>
            <ul>
                <li><strong>Dati di Identità:</strong> Include nome, cognome, nome utente, data di nascita e copie di documenti d'identità rilasciati dal governo (es. patente di guida, passaporto) per la verifica.</li>
                <li><strong>Dati di Contatto:</strong> Include indirizzo di fatturazione, indirizzo email e numeri di telefono.</li>
                <li><strong>Dati Finanziari:</strong> Include dettagli della carta di pagamento o informazioni sul portafoglio di criptovalute.</li>
                <li><strong>Dati Transazionali:</strong> Include dettagli sui pagamenti da e verso di te e altri dettagli dei servizi che hai acquistato tramite noi.</li>
                <li><strong>Dati Tecnici:</strong> Include indirizzo IP (Internet Protocol), i tuoi dati di accesso, tipo e versione del browser e altre tecnologie sui dispositivi che utilizzi per accedere alla nostra piattaforma.</li>
            </ul>

            <h2>3. Come Utilizziamo i Tuoi Dati Personali</h2>
            <p>Utilizzeremo i tuoi dati personali solo quando la legge ce lo consente. Più comunemente, utilizzeremo i tuoi dati personali nelle seguenti circostanze:</p>
            <ul>
                <li>Per eseguire il contratto di intermediazione che stiamo per stipulare o abbiamo stipulato con te.</li>
                <li>Per facilitare la prenotazione e il contratto di noleggio tra te e il proprietario dell'asset di terze parti.</li>
                <li>Per rispettare un obbligo legale o normativo (come la verifica dell'identità).</li>
                <li>Dove è necessario per i nostri legittimi interessi (o quelli di terzi) e i tuoi interessi e diritti fondamentali non prevalgono su tali interessi.</li>
            </ul>

            <h2>4. Divulgazione dei Tuoi Dati Personali</h2>
            <p>Potremmo dover condividere i tuoi dati personali con le parti indicate di seguito per gli scopi indicati nella Sezione 3:</p>
            <ul>
                <li><strong>Proprietari di Asset di Terze Parti:</strong> Condivideremo i dati di Identità, Contatto e Transazione necessari con i proprietari degli asset che desideri prenotare per facilitare il Contratto di Noleggio tra te e loro.</li>
                <li><strong>Fornitori di Servizi:</strong> Impieghiamo società di terze parti per l'elaborazione dei pagamenti e la verifica dell'identità.</li>
                <li><strong>Consulenti Professionali:</strong> Inclusi avvocati, banchieri, revisori e assicuratori che forniscono servizi di consulenza, bancari, legali, assicurativi e contabili.</li>
                <li><strong>Autorità di Regolamentazione:</strong> Potremmo essere tenuti a condividere i tuoi dati personali con le forze dell'ordine o altre autorità in Italia se richiesto dalla legge.</li>
            </ul>
            <p>Richiediamo a tutte le terze parti di rispettare la sicurezza dei tuoi dati personali e di trattarli in conformità con la legge. Non consentiamo ai nostri fornitori di servizi di terze parti di utilizzare i tuoi dati personali per i propri scopi.</p>

            <h2>5. Sicurezza dei Dati</h2>
            <p>Abbiamo messo in atto misure di sicurezza tecniche e organizzative appropriate per prevenire che i tuoi dati personali vengano accidentalmente persi, utilizzati o accessibili in modo non autorizzato. Limitiamo l'accesso ai tuoi dati personali a quei dipendenti e terze parti che hanno una necessità aziendale di conoscerli.</p>

            <h2>6. I Tuoi Diritti Legali ai sensi del GDPR</h2>
            <p>In determinate circostanze, hai diritti ai sensi delle leggi sulla protezione dei dati in relazione ai tuoi dati personali. Questi includono:</p>
            <ul>
                <li><strong>Richiedere l'accesso</strong> ai tuoi dati personali.</li>
                <li><strong>Richiedere la correzione</strong> dei dati personali che deteniamo su di te.</li>
                <li><strong>Richiedere la cancellazione</strong> dei tuoi dati personali.</li>
                <li><strong>Opporsi al trattamento</strong> dei tuoi dati personali.</li>
                <li><strong>Richiedere la limitazione del trattamento</strong> dei tuoi dati personali.</li>
                <li><strong>Richiedere il trasferimento</strong> dei tuoi dati personali a te o a terzi.</li>
                <li><strong>Revocare il consenso in qualsiasi momento</strong> quando ci affidiamo al consenso per trattare i tuoi dati personali.</li>
            </ul>
            <p>Se desideri esercitare uno di questi diritti, ti preghiamo di contattarci. Hai anche il diritto di presentare un reclamo in qualsiasi momento presso l'autorità italiana per la protezione dei dati, il Garante per la protezione dei dati personali.</p>

            <h2>7. Contattaci</h2>
            <p>Se hai domande su questa Informativa sulla Privacy o sulle nostre pratiche di privacy, contatta il nostro Responsabile della Privacy dei Dati all'indirizzo: <a href="mailto:Dubai.rent7.0spa@gmail.com">Dubai.rent7.0spa@gmail.com</a>.</p>

            <p className="mt-8 text-sm text-gray-500">
                Dubai Rent 7.0 S.r.l.<br/>
                Viale Marconi, 229, 09131 Cagliari CA<br/>
                Email: Dubai.rent7.0spa@gmail.com
            </p>
        </LegalPageLayout>
    );
};

export default PrivacyPolicyPage;
