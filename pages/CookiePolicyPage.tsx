import React from 'react';
import LegalPageLayout from '../components/layout/LegalPageLayout';
import { useTranslation } from '../hooks/useTranslation';

const CookiePolicyPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <LegalPageLayout title={t('Cookie_Policy')}>
            <p>Ultimo Aggiornamento: {new Date().toLocaleDateString('it-IT')}</p>

            <h2>1. Cosa Sono i Cookie?</h2>
            <p>I cookie sono piccoli file di testo che vengono memorizzati sul tuo computer, smartphone o altro dispositivo quando visiti un sito web. Sono ampiamente utilizzati per far funzionare i siti web, o farli funzionare in modo più efficiente, nonché per fornire informazioni ai proprietari del sito. I cookie ci aiutano a ricordare le tue preferenze e a capire come utilizzi il nostro sito, il che ci permette di migliorare la tua esperienza.</p>

            <h2>2. Come Utilizziamo i Cookie</h2>
            <p>Utilizziamo i cookie per diversi scopi importanti. Possono essere classificati come segue:</p>
            <ul>
                <li>
                    <strong>Cookie Strettamente Necessari:</strong> Questi cookie sono essenziali per navigare nel sito web e utilizzare le sue funzionalità, come l'accesso ad aree protette del sito. Senza questi cookie, servizi come il login utente e il processo di prenotazione non possono essere forniti.
                </li>
                <li>
                    <strong>Cookie di Prestazioni e Analisi:</strong> Questi cookie raccolgono informazioni su come utilizzi il nostro sito web, ad esempio quali pagine visiti più spesso. Questi dati ci aiutano a ottimizzare il nostro sito web e renderlo più facile da navigare. Tutte le informazioni raccolte da questi cookie sono aggregate e quindi anonime.
                </li>
                <li>
                    <strong>Cookie Funzionali:</strong> Questi cookie permettono al nostro sito web di ricordare le scelte che fai durante la navigazione. Ad esempio, possiamo memorizzare la tua posizione geografica in un cookie per assicurarci di mostrarti il sito web localizzato per la tua area, oppure possiamo ricordare preferenze come lingua e valuta. Questo ci consente di fornirti un'esperienza più personalizzata e conveniente.
                </li>
                <li>
                    <strong>Cookie di Targeting o Pubblicitari:</strong> Questi cookie vengono utilizzati per fornire pubblicità più pertinenti a te e ai tuoi interessi. Vengono utilizzati anche per limitare il numero di volte in cui vedi una pubblicità e per misurare l'efficacia delle campagne pubblicitarie. Di solito vengono inseriti da reti pubblicitarie con il permesso del gestore del sito web.
                </li>
            </ul>

            <h2>3. Cookie di Terze Parti</h2>
            <p>Oltre ai nostri cookie, possiamo anche utilizzare vari cookie di terze parti per segnalare statistiche di utilizzo del Servizio, fornire pubblicità sul e attraverso il Servizio, e così via. Ad esempio, utilizziamo Google Analytics per aiutarci a comprendere il traffico del nostro sito web.</p>

            <h2>4. Le Tue Scelte e Gestione dei Cookie</h2>
            <p>Hai il diritto di decidere se accettare o rifiutare i cookie. Puoi esercitare le tue preferenze sui cookie utilizzando le impostazioni del tuo browser web. La maggior parte dei browser ti consente di controllare i cookie attraverso le loro impostazioni di preferenza. Tuttavia, se limiti la capacità dei siti web di impostare cookie, potresti peggiorare la tua esperienza utente complessiva, poiché non sarà più personalizzata per te. Potrebbe anche impedirti di salvare impostazioni personalizzate come le informazioni di login.</p>
            <p>Per saperne di più sui cookie, incluso come vedere quali cookie sono stati impostati e come gestirli ed eliminarli, visita <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</a>.</p>

            <h2>5. Modifiche a Questa Politica sui Cookie</h2>
            <p>Possiamo aggiornare questa Politica sui Cookie di tanto in tanto per riflettere, ad esempio, modifiche ai cookie che utilizziamo o per altri motivi operativi, legali o normativi. Ti invitiamo quindi a rivisitare regolarmente questa Politica sui Cookie per rimanere informato sul nostro utilizzo dei cookie e delle tecnologie correlate.</p>
        </LegalPageLayout>
    );
};

export default CookiePolicyPage;