import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

const sections = [
  { id: 'accettazione', num: '1', title: 'Accettazione dei Termini' },
  { id: 'intermediario', num: '2', title: 'Il Nostro Ruolo di Intermediario' },
  { id: 'account', num: '3', title: 'Account Utente e Verifica' },
  { id: 'pagamenti', num: '4', title: 'Prenotazioni e Pagamenti' },
  { id: 'proprietari', num: '5', title: 'Ruolo dei Proprietari Terzi' },
  { id: 'responsabilita', num: '6', title: 'Limitazione di Responsabilità' },
  { id: 'legge', num: '7', title: 'Legge Applicabile' },
  { id: 'modifiche', num: '8', title: 'Modifiche ai Termini' },
  { id: 'policy-operativa', num: '9', title: 'Policy Operativa' },
  { id: 'contatto', num: '10', title: 'Informazioni di Contatto' },
];

const TermsOfServicePage: React.FC = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('accettazione');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-black min-h-screen"
    >
      {/* Hero header */}
      <div className="pt-32 pb-16 text-center px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-sm tracking-widest uppercase text-gray-500 mb-4"
        >
          Documentazione legale
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl font-bold text-white tracking-tight"
        >
          {t('Terms_of_Service')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-4 text-gray-400 text-sm"
        >
          Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
        </motion.p>
      </div>

      {/* Content with sidebar */}
      <div className="max-w-7xl mx-auto px-6 pb-24 flex gap-12">
        {/* Sidebar — desktop only */}
        <nav className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-28">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-semibold">Indice</p>
            <ul className="space-y-1">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      activeSection === s.id
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-gray-600 mr-2">{s.num}.</span>
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <div className="flex-1 max-w-3xl">
          {/* Section 1 */}
          <section
            id="accettazione"
            ref={el => { sectionRefs.current['accettazione'] = el; }}
            className="scroll-mt-28 mb-16"
          >
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-5xl font-bold text-white/10">01</span>
              <h2 className="text-2xl font-semibold text-white">Accettazione dei Termini</h2>
            </div>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>Benvenuto su DR7 Empire ("DR7", "noi", "nostro"). Le presenti Condizioni Generali del Servizio di Intermediazione ("Termini") disciplinano l'utilizzo della nostra piattaforma e dei nostri servizi (collettivamente, i "Servizi").</p>
              <p>Accedendo o utilizzando i nostri Servizi, l'utente accetta di essere vincolato dai presenti Termini e dalla nostra Informativa sulla Privacy. In caso di disaccordo, è vietato utilizzare i Servizi.</p>
              <p>I presenti Termini costituiscono un accordo legalmente vincolante tra l'utente ("Cliente", "tu") e DR7 Empire, relativo all'accesso e all'utilizzo della piattaforma DR7.</p>
            </div>
          </section>

          <div className="border-t border-gray-800/60 mb-16" />

          {/* Section 2 */}
          <section
            id="intermediario"
            ref={el => { sectionRefs.current['intermediario'] = el; }}
            className="scroll-mt-28 mb-16"
          >
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-5xl font-bold text-white/10">02</span>
              <h2 className="text-2xl font-semibold text-white">Il Nostro Ruolo di Intermediario</h2>
            </div>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>DR7 fornisce un servizio esclusivo di intermediazione, agendo come tramite per mettere in contatto l'utente con una rete selezionata di proprietari e operatori terzi ("Proprietari") di beni di lusso, inclusi ma non limitati a automobili, yacht, ville e jet privati ("Beni").</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 my-6">
                <p className="text-white font-medium mb-2">Importante</p>
                <p className="text-sm text-gray-400">DR7 non è il proprietario, l'operatore o l'assicuratore dei Beni. Il nostro ruolo è strettamente limitato a facilitare il processo di prenotazione tra l'utente e il Proprietario. La fornitura del Bene è di esclusiva responsabilità del Proprietario.</p>
              </div>
              <p>Il noleggio o il charter di un Bene sarà soggetto a un accordo separato e legalmente vincolante tra l'utente e il rispettivo Proprietario ("Contratto di Noleggio").</p>
            </div>
          </section>

          <div className="border-t border-gray-800/60 mb-16" />

          {/* Section 3 */}
          <section
            id="account"
            ref={el => { sectionRefs.current['account'] = el; }}
            className="scroll-mt-28 mb-16"
          >
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-5xl font-bold text-white/10">03</span>
              <h2 className="text-2xl font-semibold text-white">Account Utente e Verifica del Cliente</h2>
            </div>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>Per accedere ai nostri Servizi, è necessario avere almeno 25 anni e la capacità giuridica di stipulare contratti vincolanti.</p>
              <p>È richiesta la registrazione di un account con informazioni accurate e complete. Per conformità alle normative italiane e internazionali, incluse le leggi antiriciclaggio (AML), potremmo richiedere la verifica dell'identità, incluso un documento di identità rilasciato dal governo, prima di confermare prenotazioni di alto valore.</p>
            </div>
          </section>

          <div className="border-t border-gray-800/60 mb-16" />

          {/* Section 4 */}
          <section
            id="pagamenti"
            ref={el => { sectionRefs.current['pagamenti'] = el; }}
            className="scroll-mt-28 mb-16"
          >
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-5xl font-bold text-white/10">04</span>
              <h2 className="text-2xl font-semibold text-white">Prenotazioni, Pagamenti e Condizioni Finanziarie</h2>
            </div>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <p className="text-white font-medium mb-2">Prenotazione</p>
                  <p className="text-sm">Una richiesta di prenotazione inoltrata tramite la nostra piattaforma costituisce un'offerta di noleggio di un Bene. La prenotazione è confermata solo al ricevimento di una conferma formale da parte nostra e all'accettazione del Contratto di Noleggio del Proprietario.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <p className="text-white font-medium mb-2">Pagamenti</p>
                  <p className="text-sm">In qualità di intermediario, DR7 facilita i pagamenti dall'utente al Proprietario. L'utente ci autorizza ad addebitare il metodo di pagamento prescelto per l'importo totale della prenotazione, inclusi canone di noleggio, tasse e deposito cauzionale.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-gray-800/60 mb-16" />

          {/* Section 5 */}
          <section
            id="proprietari"
            ref={el => { sectionRefs.current['proprietari'] = el; }}
            className="scroll-mt-28 mb-16"
          >
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-5xl font-bold text-white/10">05</span>
              <h2 className="text-2xl font-semibold text-white">Ruolo dei Proprietari Terzi</h2>
            </div>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>I Proprietari sono entità indipendenti e non sono dipendenti o agenti di DR7. I Proprietari sono gli unici responsabili di:</p>
              <ul className="space-y-3 ml-1">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 shrink-0" />
                  <span>Garantire che il Bene sia in condizioni sicure, legali e operative.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 shrink-0" />
                  <span>Fornire un'assicurazione completa per il Bene.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 shrink-0" />
                  <span>Eseguire il Contratto di Noleggio finale con l'utente.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 shrink-0" />
                  <span>La consegna, la gestione e il ritiro del Bene.</span>
                </li>
              </ul>
              <p>Sebbene DR7 selezioni attentamente tutti i Proprietari della propria rete, non garantiamo le prestazioni o la qualità di alcun Bene o Proprietario.</p>
            </div>
          </section>

          <div className="border-t border-gray-800/60 mb-16" />

          {/* Section 6 */}
          <section
            id="responsabilita"
            ref={el => { sectionRefs.current['responsabilita'] = el; }}
            className="scroll-mt-28 mb-16"
          >
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-5xl font-bold text-white/10">06</span>
              <h2 className="text-2xl font-semibold text-white">Limitazione di Responsabilità</h2>
            </div>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>Nella misura massima consentita dalla legge italiana, la responsabilità di DR7 Empire è limitata al suo ruolo di servizio di intermediazione. Non saremo responsabili per danni diretti, indiretti, incidentali, speciali o consequenziali, derivanti da:</p>
              <ul className="space-y-3 ml-1">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 shrink-0" />
                  <span>Le condizioni, le prestazioni o la legalità di qualsiasi Bene.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 shrink-0" />
                  <span>Qualsiasi atto o omissione da parte di un Proprietario o del suo personale.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 shrink-0" />
                  <span>I termini del, o la violazione da parte dell'utente del, Contratto di Noleggio.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 shrink-0" />
                  <span>Qualsiasi controversia tra l'utente e un Proprietario.</span>
                </li>
              </ul>
              <p>La nostra responsabilità totale per qualsiasi questione derivante dai presenti Termini non supererà la commissione di intermediazione da noi ricevuta per la specifica prenotazione in questione.</p>
            </div>
          </section>

          <div className="border-t border-gray-800/60 mb-16" />

          {/* Section 7 */}
          <section
            id="legge"
            ref={el => { sectionRefs.current['legge'] = el; }}
            className="scroll-mt-28 mb-16"
          >
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-5xl font-bold text-white/10">07</span>
              <h2 className="text-2xl font-semibold text-white">Legge Applicabile e Foro Competente</h2>
            </div>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>I presenti Termini e l'utilizzo dei Servizi sono regolati e interpretati in conformità con le leggi italiane. L'utente accetta irrevocabilmente che il Tribunale di Cagliari, Italia, avrà giurisdizione esclusiva per risolvere qualsiasi controversia o reclamo derivante da o in connessione con il presente accordo o il suo oggetto.</p>
            </div>
          </section>

          <div className="border-t border-gray-800/60 mb-16" />

          {/* Section 8 */}
          <section
            id="modifiche"
            ref={el => { sectionRefs.current['modifiche'] = el; }}
            className="scroll-mt-28 mb-16"
          >
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-5xl font-bold text-white/10">08</span>
              <h2 className="text-2xl font-semibold text-white">Modifiche ai Termini e ai Servizi</h2>
            </div>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>Ci riserviamo il diritto di modificare i presenti Termini in qualsiasi momento. Forniremo avviso di eventuali modifiche sostanziali pubblicando i nuovi Termini sulla nostra piattaforma. L'uso continuato dei Servizi dopo tali modifiche costituisce accettazione dei nuovi Termini.</p>
            </div>
          </section>

          <div className="border-t border-gray-800/60 mb-16" />

          {/* Section 9 */}
          <section
            id="policy-operativa"
            ref={el => { sectionRefs.current['policy-operativa'] = el; }}
            className="scroll-mt-28 mb-16"
          >
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-5xl font-bold text-white/10">09</span>
              <h2 className="text-2xl font-semibold text-white">Policy Operativa – Tempi di Servizio e Consegna</h2>
            </div>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>I tempi indicati per i servizi (lavaggio, trattamenti, check-in, check-out e consegne veicoli) sono da intendersi come tempi stimati e indicativi, calcolati su condizioni operative standard.</p>
              <p>La durata effettiva del servizio può variare in base a:</p>
              <ul className="space-y-3 ml-1">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 shrink-0" />
                  <span>Stato del veicolo</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 shrink-0" />
                  <span>Livello di sporco o complessità dell'intervento</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 shrink-0" />
                  <span>Verifiche tecniche e controlli qualitativi</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 shrink-0" />
                  <span>Flussi operativi interni</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 shrink-0" />
                  <span>Eventuali ritardi logistici non prevedibili</span>
                </li>
              </ul>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 my-6">
                <p className="text-sm text-gray-400">L'orario di prenotazione o consegna rappresenta una fascia operativa programmata e non un orario tassativo di inizio o rilascio immediato del veicolo. Eventuali variazioni contenute entro una normale tolleranza tecnica e organizzativa non costituiscono inadempimento contrattuale né danno diritto a riduzioni o rimborsi.</p>
              </div>
              <p>L'azienda si impegna comunque a garantire la massima puntualità compatibilmente con gli standard qualitativi e di sicurezza previsti.</p>
            </div>
          </section>

          <div className="border-t border-gray-800/60 mb-16" />

          {/* Section 10 */}
          <section
            id="contatto"
            ref={el => { sectionRefs.current['contatto'] = el; }}
            className="scroll-mt-28 mb-16"
          >
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-5xl font-bold text-white/10">10</span>
              <h2 className="text-2xl font-semibold text-white">Informazioni di Contatto</h2>
            </div>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>Per qualsiasi domanda o comunicazione legale riguardante i presenti Termini, si prega di contattare il nostro ufficio legale all'indirizzo:</p>
              <a
                href="mailto:info@dr7.app"
                className="inline-block text-white font-medium hover:underline underline-offset-4"
              >
                info@dr7.app
              </a>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

export default TermsOfServicePage;
