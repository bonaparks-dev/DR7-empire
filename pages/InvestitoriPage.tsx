import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Custom SVG Icons
const ChartBarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const GlobeAltIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const BuildingOffice2Icon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
  </svg>
);

const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const ArrowTrendingUpIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

const InvestitoriPage: React.FC = () => {
  const strengthPoints = [
    {
      icon: ArrowTrendingUpIcon,
      title: 'Crescita documentata',
      description: 'Fatturato in costante incremento con proiezione di sviluppo superiore al +100% annuo.'
    },
    {
      icon: ChartBarIcon,
      title: 'Posizionamento strategico',
      description: 'Brand di riferimento nel comparto luxury mobility in Italia e in Europa.'
    },
    {
      icon: GlobeAltIcon,
      title: 'Espansione internazionale',
      description: 'Apertura verso mercati ad alto potenziale, tra cui Emirati Arabi Uniti e Francia.'
    },
    {
      icon: BuildingOffice2Icon,
      title: 'Integrazione verticale',
      description: 'Un unico ecosistema che combina mobilità di lusso, hospitality e servizi esperienziali.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Visione a lungo termine',
      description: 'Programma industriale orientato alla creazione di valore e alla sostenibilità economica del gruppo.'
    }
  ];

  const companyInfo = [
    { label: 'Denominazione', value: 'Dubai Rent 7.0 S.p.A.' },
    { label: 'Sede legale', value: 'Cagliari, Italia' },
    { label: 'Settore', value: 'Luxury Mobility & Lifestyle' },
    { label: 'Forma giuridica', value: 'Società per Azioni' },
    { label: 'Capitale sociale', value: 'In aumento progressivo secondo piano Vision 2030' },
    { label: 'Tipologia quote', value: 'Azioni ordinarie nominative' },
    { label: 'Investimento minimo indicativo', value: 'Da €25.000' },
    { label: 'Distribuzione utili', value: 'Secondo deliberazioni dell\'Assemblea e risultati di bilancio' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-black text-white"
    >
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-black"></div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 notranslate">
              SEZIONE INVESTITORI
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Partecipa alla crescita del gruppo DR7
            </p>
          </motion.div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-16 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 md:p-12">
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                <span className="notranslate font-semibold text-white">Dubai Rent 7.0 S.p.A.</span> rappresenta il cuore del progetto DR7 Luxury Empire, una realtà italiana in espansione internazionale nel settore Luxury Mobility & Lifestyle.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                Fondata da Valerio Saia, la società persegue l'obiettivo di costruire entro il 2030 un gruppo di riferimento nel panorama del lusso globale, integrando noleggio supercar, yacht, elicotteri, ville di pregio e servizi di concierge in un'unica piattaforma.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Opportunity Section */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Opportunità di partecipazione al capitale
            </h2>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 md:p-12 space-y-6">
              <p className="text-lg text-gray-300 leading-relaxed">
                Il Consiglio di Amministrazione di <span className="notranslate font-semibold text-white">Dubai Rent 7.0 S.p.A.</span> ha deliberato l'apertura selettiva del capitale sociale a investitori privati e partner strategici, con l'intento di favorire la crescita e l'espansione del brand a livello internazionale.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                L'ingresso nel capitale è riservato a soggetti qualificati, selezionati direttamente dalla Direzione Generale, nel rispetto delle normative vigenti e delle procedure interne di valutazione.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                L'obiettivo è consolidare la struttura patrimoniale della società e accelerare il piano <span className="notranslate font-semibold text-white">Vision 2030</span>, che prevede il rafforzamento delle attività operative, lo sviluppo di nuove divisioni e, in prospettiva, la quotazione in mercati regolamentati.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Strength Points Section */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-6xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Punti di forza
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strengthPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors"
                >
                  <point.icon className="w-12 h-12 text-white mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{point.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{point.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Modalità di adesione
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed mb-8">
                Gli interessati possono inoltrare richiesta di ammissione al <span className="notranslate font-semibold text-white">Club Azionisti DR7</span>, compilando il modulo dedicato e avviando la fase di verifica da parte dell'Ufficio Investor Relations.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed mb-10">
                Ogni proposta di partecipazione viene valutata singolarmente in base ai requisiti dell'investitore, alla compatibilità strategica e alle disponibilità di quote.
              </p>
              <a
                href="https://wa.me/393457905205?text=Buongiorno%2C%20sono%20interessato%20ad%20entrare%20nel%20Club%20Azionisti%20DR7.%20Vorrei%20ricevere%20maggiori%20informazioni%20sulle%20opportunit%C3%A0%20di%20investimento%20e%20partecipazione%20al%20capitale."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-black px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-200 transition-colors"
              >
                RICHIEDI ACCESSO INVESTITORI
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Company Info Section */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Informazioni sintetiche
            </h2>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 md:p-12">
              <div className="space-y-4">
                {companyInfo.map((info, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row md:items-start border-b border-gray-700 last:border-b-0 pb-4 last:pb-0"
                  >
                    <span className="text-gray-400 md:w-1/3 mb-2 md:mb-0 font-medium">
                      {info.label}:
                    </span>
                    <span className="text-white md:w-2/3">
                      {info.value}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-8 italic leading-relaxed">
                I dettagli economico-finanziari completi, nonché la documentazione ufficiale, sono forniti esclusivamente su richiesta riservata e previa verifica dei requisiti soggettivi dell'investitore.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Legal Notice Section */}
      <section className="py-16 bg-black border-t border-gray-800">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-red-900/10 border border-red-900/30 rounded-2xl p-8 md:p-12">
              <h2 className="text-2xl font-bold mb-6 text-red-400">
                Avvertenza legale
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Le informazioni contenute in questa sezione hanno finalità esclusivamente informative e non costituiscono, in alcun modo, un'offerta pubblica di sottoscrizione o una sollecitazione all'investimento ai sensi dell'art. 94 del D.Lgs. 58/1998 (TUF) e della normativa europea vigente.
              </p>
              <p className="text-gray-300 leading-relaxed mt-4">
                L'adesione a operazioni di partecipazione al capitale è riservata a soggetti selezionati, previa valutazione da parte di <span className="notranslate font-semibold text-white">Dubai Rent 7.0 S.p.A.</span> e nel pieno rispetto delle procedure legali e regolamentari applicabili.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default InvestitoriPage;
