import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const TokenPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black opacity-50"></div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-6xl mx-auto text-center"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
            DR7 TOKEN
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-4">
            L'Ecosistema Digitale del Lusso Reale
          </p>
          <p className="text-sm text-gray-500 uppercase tracking-widest">
            In Lavorazione
          </p>
        </motion.div>
      </section>

      {/* DR7 Coin Section */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                DR7 Coin – La Moneta del Lusso Reale
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Dubai Rent 7.0 S.p.A. annuncia la nascita di <strong className="text-white">DR7 Coin</strong>,
                la prima moneta digitale al mondo sostenuta da un'economia reale e alimentata dal valore collettivo.
              </p>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              <p className="text-lg text-gray-300 leading-relaxed">
                Un progetto visionario, nato per riscrivere le regole della finanza moderna e per dare al lusso una valuta propria:
                <strong className="text-white"> stabile, concreta e in continua espansione</strong>.
              </p>

              <p className="text-lg text-gray-300 leading-relaxed">
                In un'epoca in cui le criptovalute tradizionali oscillano tra speculazione e volatilità, DR7 Coin introduce un
                modello completamente nuovo — fondato non sulla promessa, ma sulla <strong className="text-white">realtà economica</strong>
                di una società per azioni in piena crescita, Dubai Rent 7.0 S.p.A., e sull'energia di una community che ne sostiene la visione.
              </p>

              {/* Un nuovo paradigma economico */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mt-12">
                <h3 className="text-3xl font-bold mb-6">
                  <span></span>
                  Un nuovo paradigma economico
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  DR7 Coin rappresenta la nascita della <strong className="text-white">prima moneta patrimoniale digitale</strong>,
                  in cui il valore non deriva da algoritmi o mercati volatili, ma da fattori tangibili e verificabili:
                </p>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>i bilanci ufficiali e certificati di DR7 S.p.A.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>gli asset reali (supercar, yacht, elicotteri, immobili, flotta aziendale)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>la partecipazione attiva di clienti, partner e investitori che acquistano e utilizzano la moneta</span>
                  </li>
                </ul>

                <div className="mt-8 pt-8 border-t border-gray-800">
                  <p className="text-gray-300 mb-4">Il suo valore cresce su due assi paralleli:</p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-black/50 rounded-xl p-6 border border-gray-700">
                      <div className="text-4xl font-bold text-white mb-2">1</div>
                      <p className="text-gray-300">
                        <strong className="text-white">Crescita reale dell'impero DR7</strong>, con nuovi ricavi,
                        espansione patrimoniale e consolidamento del brand a livello globale
                      </p>
                    </div>
                    <div className="bg-black/50 rounded-xl p-6 border border-gray-700">
                      <div className="text-4xl font-bold text-white mb-2">2</div>
                      <p className="text-gray-300">
                        <strong className="text-white">Aumento della domanda</strong> e della detenzione della moneta,
                        da parte di una community che crede nel progetto e ne alimenta la forza economica interna
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Un modello duale */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mt-12">
                <h3 className="text-3xl font-bold mb-6">
                  Un modello duale: reale e partecipativo
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  DR7 Coin nasce come <strong className="text-white">moneta di sistema</strong>, progettata per sostenere
                  l'intero ecosistema DR7 Empire: la mobilità di lusso (Supercar, Yacht, Elicotteri, Ville), i servizi esclusivi
                  (Concierge, Membership, Wash), e le esperienze premium che definiscono lo stile di vita DR7.
                </p>
                <div className="bg-black/50 rounded-xl p-6 border border-gray-700">
                  <p className="text-xl font-bold text-white mb-4">Ogni DR7 Coin rappresenta valore reale.</p>
                  <p className="text-gray-300 mb-4">Ogni transazione diventa parte di un ciclo virtuoso, in cui:</p>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-white mt-1">•</span>
                      <span>chi la utilizza accede a vantaggi, priorità e servizi esclusivi</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-white mt-1">•</span>
                      <span>chi la possiede contribuisce alla stabilità e alla crescita del sistema</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-white mt-1">•</span>
                      <span>l'azienda rafforza la moneta attraverso i risultati concreti</span>
                    </li>
                  </ul>
                </div>
                <p className="text-lg text-white font-semibold mt-6 text-center">
                  È una moneta che cresce con il suo impero e si rafforza con la fiducia delle persone.
                </p>
              </div>

              {/* Una rivoluzione nel mondo del lusso */}
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 mt-12">
                <h3 className="text-3xl font-bold mb-6">
                  Una rivoluzione nel mondo del lusso
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Mai prima d'ora un gruppo del lusso ha creato una valuta autonoma, garantita da asset e performance aziendali.
                  DR7 Coin diventa così:
                </p>
                <ul className="space-y-4 text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>la <strong className="text-white">valuta ufficiale dell'ecosistema DR7</strong>, utilizzabile per ogni servizio e prodotto</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>una <strong className="text-white">riserva di valore stabile</strong>, indipendente dalle oscillazioni dei mercati crypto</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>un <strong className="text-white">simbolo di appartenenza</strong> per chi vive il lusso non come apparenza, ma come forma d'identità</span>
                  </li>
                </ul>
                <div className="mt-8 bg-black/70 rounded-xl p-6 border border-gray-700">
                  <blockquote className="text-2xl font-bold text-white text-center italic">
                    "Non è una cripto. È la moneta del lusso reale."
                  </blockquote>
                  <p className="text-gray-400 text-center mt-4">
                    Ogni Coin è un frammento dell'impero, un pezzo tangibile di una realtà che cresce, investe e si espande.
                  </p>
                </div>
              </div>

              {/* Stabilità, sicurezza e trasparenza */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mt-12">
                <h3 className="text-3xl font-bold mb-6">
                  Stabilità, sicurezza e trasparenza
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  DR7 Coin è costruita su <strong className="text-white">tecnologia blockchain certificata</strong>, con:
                </p>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Audit periodici su bilanci, supply e riserve</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>KYC/AML integrati, per la piena conformità alle normative europee (MiCA)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Wallet DR7 con gestione sicura, transazioni trasparenti e storico consultabile</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white mt-1">•</span>
                    <span>Emissione regolata da un meccanismo di equilibrio tra asset reali e domanda del mercato interno</span>
                  </li>
                </ul>
                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  <div className="bg-black/50 rounded-xl p-4 border border-gray-700 text-center">
                    <p className="text-sm text-gray-400 mb-1">Ogni unità è</p>
                    <p className="text-white font-bold">Tracciabile & Verificabile</p>
                  </div>
                  <div className="bg-black/50 rounded-xl p-4 border border-gray-700 text-center">
                    <p className="text-sm text-gray-400 mb-1">Supportata da</p>
                    <p className="text-white font-bold">Valore Reale</p>
                  </div>
                </div>
                <p className="text-lg text-white font-semibold mt-6 text-center">
                  Non c'è speculazione, ma costruzione. Non c'è volatilità, ma evoluzione.
                </p>
              </div>

              {/* La missione */}
              <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border border-gray-800 rounded-2xl p-8 mt-12">
                <h3 className="text-3xl font-bold mb-6">
                  La missione
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  DR7 Coin è più di una moneta: è una <strong className="text-white">dichiarazione di indipendenza economica del lusso</strong>.
                  Un modo per svincolare il valore dal mercato e legarlo al merito, alla concretezza e alla crescita.
                  Un sistema in cui il lusso non si compra: si sostiene, si vive, si costruisce.
                </p>
                <div className="bg-black/70 rounded-xl p-8 border border-gray-700">
                  <p className="text-xl text-white font-bold text-center mb-4">La missione è ambiziosa ma chiara:</p>
                  <p className="text-2xl font-bold text-white text-center leading-relaxed">
                    Creare la prima infrastruttura finanziaria del lusso,<br/>
                    dove il valore cresce con l'economia reale,<br/>
                    e il denaro rappresenta fiducia, solidità e appartenenza.
                  </p>
                </div>
              </div>

              {/* La visione */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mt-12">
                <h3 className="text-3xl font-bold mb-6">
                  La visione
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  DR7 Coin segna il passaggio dalla <span className="line-through">finanza speculativa</span> alla <strong className="text-white">finanza tangibile</strong>.
                  Dal rischio al risultato. Dalla volatilità alla stabilità.
                </p>
                <p className="text-gray-300 leading-relaxed mb-6">
                  È la moneta che trasforma il lusso in una forza economica autonoma, capace di espandersi globalmente — dall'Italia al mondo.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Ogni nuova sede, ogni bilancio, ogni partner, ogni cliente che entra nel sistema DR7 alimenta la crescita complessiva della moneta.
                  E chi la possiede oggi, diventa parte del futuro: un investitore non in una promessa, ma in una realtà che esiste, produce e cresce.
                </p>
              </div>

              {/* Conclusione DR7 Coin */}
              <div className="bg-black border-2 border-white rounded-2xl p-10 mt-12 text-center">
                <h3 className="text-3xl font-bold mb-4">In una frase</h3>
                <p className="text-2xl font-bold text-white leading-relaxed">
                  DR7 Coin è la moneta del lusso reale.<br/>
                  Cresce con DR7, cresce con te,<br/>
                  e rappresenta il valore concreto di un impero<br/>
                  destinato a dominare la nuova economia del lusso.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DR7 UP Section */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                DR7 Up – Il primo "Uber delle Supercar" al mondo
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Dubai Rent 7.0 S.p.A. presenta <strong className="text-white">DR7 Up</strong>, un progetto esclusivo e rivoluzionario
                che ridefinisce il concetto stesso di mobilità di lusso.
              </p>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              <p className="text-lg text-gray-300 leading-relaxed">
                Un sistema digitale ispirato alla logica di Uber, ma con una differenza sostanziale e unica al mondo:<br/>
                <strong className="text-white text-xl">
                  nessun taxi bianco, nessun NCC tradizionale, nessuna vettura comune.<br/>
                  Con DR7 Up si opera solo ed esclusivamente con Supercar.
                </strong>
              </p>

              <p className="text-lg text-gray-300 leading-relaxed">
                L'utente accede all'app o al portale dedicato, seleziona la Supercar desiderata – Ferrari, Lamborghini, Porsche,
                BMW M, Audi RS, AMG, McLaren e molte altre – e in pochi minuti la vettura arriva direttamente nel punto richiesto,
                con o senza autista. Un'esperienza immediata, fluida e tecnologicamente avanzata, che trasforma ogni spostamento
                in un momento di puro prestigio, performance e status firmato DR7.
              </p>

              {/* Un concetto totalmente nuovo */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mt-12">
                <h3 className="text-3xl font-bold mb-6">
                  Un concetto totalmente nuovo
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  DR7 Up è il <strong className="text-white">primo servizio al mondo</strong> ad applicare il modello di
                  mobilità on-demand al settore delle Supercar e dei Luxury Vehicles.
                </p>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Nessuna piattaforma oggi consente di prenotare e ricevere una Supercar in tempo reale, come fosse un taxi,
                  con gestione digitale integrata, pagamenti diretti, tracciamento immediato e standard qualitativi certificati
                  da una società per azioni italiana.
                </p>
                <div className="bg-black/70 rounded-xl p-6 border border-gray-700">
                  <p className="text-xl font-bold text-white text-center">
                    È una rivoluzione nella luxury mobility globale:<br/>
                    un punto d'incontro tra tecnologia, esclusività e visione imprenditoriale,<br/>
                    capace di creare una nuova categoria di servizio —<br/>
                    <span className="text-2xl">la Luxury Mobility On-Demand</span>.
                  </p>
                </div>
              </div>

              {/* Come funziona */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mt-12">
                <h3 className="text-3xl font-bold mb-6">
                  Come funziona
                </h3>
                <div className="space-y-4">
                  {[
                    "L'utente accede all'app o al portale DR7 Up",
                    "Visualizza in tempo reale tutte le Supercar disponibili nella zona",
                    "Seleziona la modalità di utilizzo (con autista, guida autonoma, transfer, tour panoramico o esperienza personalizzata)",
                    "Prenota con un clic e paga online in modo immediato e sicuro",
                    "La Supercar arriva nel punto scelto, garantendo un servizio esclusivo, rapido e certificato DR7"
                  ].map((step, index) => (
                    <div key={index} className="flex items-start gap-4 bg-black/50 rounded-xl p-4 border border-gray-700">
                      <div className="flex-shrink-0 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-300 pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Perché è diverso */}
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 mt-12">
                <h3 className="text-3xl font-bold mb-6">
                  Perché è diverso
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  DR7 Up non è un semplice servizio di noleggio, ma una <strong className="text-white">piattaforma esperienziale
                  di mobilità di lusso</strong>.
                </p>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Unisce tecnologia, rapidità, comfort e rappresentanza, rendendo accessibile in pochi minuti ciò che prima
                  richiedeva giorni di pianificazione, verifiche e disponibilità limitate.
                </p>
                <div className="bg-black/70 rounded-xl p-6 border border-gray-700">
                  <p className="text-xl font-bold text-white text-center">
                    È l'Uber del lusso, ma con standard di qualità e prestigio<br/>
                    che non esistono in nessun altro servizio al mondo.
                  </p>
                </div>
              </div>

              {/* Missione DR7 UP */}
              <div className="bg-black border-2 border-white rounded-2xl p-10 mt-12 text-center">
                <h3 className="text-3xl font-bold mb-4">La missione</h3>
                <p className="text-2xl font-bold text-white leading-relaxed">
                  Rendere il lusso immediato, digitale e accessibile in qualsiasi momento,<br/>
                  a chi vive la strada come espressione di sé.<br/><br/>
                  DR7 Up nasce per ridefinire i confini della mobilità premium,<br/>
                  portando l'esperienza Supercar nel quotidiano,<br/>
                  attraverso un sistema tecnologico, trasparente<br/>
                  e firmato Dubai Rent 7.0 S.p.A.
                </p>
                <div className="mt-8 inline-block bg-white text-black px-8 py-3 rounded-full font-bold text-lg">
                  Pagamento in cripto disponibile
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DR7 APP Section */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                DR7 APP – La Prima Piattaforma Globale del Lusso Reale
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Dubai Rent 7.0 S.p.A. presenta <strong className="text-white">DR7 APP</strong>, la prima piattaforma digitale
                al mondo in grado di unire in un unico ecosistema tutto il mondo del lusso
              </p>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              <p className="text-lg text-gray-300 leading-relaxed">
                dalle supercar ai jet privati, dalle ville e hotel di pregio agli yacht, servizi concierge, moto e scooter
                di fascia alta. Un sistema innovativo, fluido e meritocratico che ridefinisce il modo di vivere, gestire e
                monetizzare il lusso nel XXI secolo.
              </p>

              {/* Un progetto rivoluzionario */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mt-12">
                <h3 className="text-3xl font-bold mb-6">
                  <span></span>
                  Un progetto rivoluzionario
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Mentre i grandi portali internazionali si concentrano su singoli settori –<br/>
                  <span className="text-gray-500">Booking sugli hotel, Airbnb sugli affitti brevi, Uber sui trasporti</span> –<br/>
                  <strong className="text-white text-xl">DR7 APP unisce tutto.</strong>
                </p>
                <div className="bg-black/70 rounded-xl p-6 border border-gray-700">
                  <p className="text-lg text-white leading-relaxed">
                    È la <strong>prima infrastruttura tecnologica integrata</strong> che connette aziende, strutture e
                    professionisti del lusso in un'unica piattaforma globale, con processi chiari, pagamenti rapidi e una
                    filosofia completamente diversa: <strong>trasparenza, meritocrazia e valore reale</strong>.
                  </p>
                </div>
              </div>

              {/* Il modello operativo */}
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 mt-12">
                <h3 className="text-3xl font-bold mb-6">
                  Il modello operativo DR7
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  La piattaforma nasce per risolvere le inefficienze storiche del mercato del lusso:<br/>
                  <span className="text-gray-500">commissioni eccessive, pagamenti lenti, gestione dispersiva, mancanza di controllo diretto</span>.
                </p>
                <p className="text-white font-bold text-lg mb-6">Con DR7 APP, ogni azienda o operatore può:</p>
                <ul className="space-y-3 text-gray-300 mb-8">
                  {[
                    "Registrarsi e ottenere un profilo verificato DR7",
                    "Inserire la propria offerta (villa, yacht, supercar, hotel, jet o servizio di lusso)",
                    "Gestire in autonomia disponibilità, prenotazioni, pagamenti e reportistica",
                    "Ricevere gli accrediti entro 48 ore dall'incasso",
                    "Operare con commissione fissa al 9%, senza costi nascosti o trattenute extra",
                    "Accettare pagamenti sia in euro tradizionali che in DR7 Coin, la moneta ufficiale del lusso reale"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-white mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-black border-2 border-white rounded-xl p-6 text-center">
                    <p className="text-sm text-gray-400 mb-2">Commissione fissa</p>
                    <p className="text-5xl font-bold text-white">9%</p>
                  </div>
                  <div className="bg-black border-2 border-white rounded-xl p-6 text-center">
                    <p className="text-sm text-gray-400 mb-2">Accredito massimo</p>
                    <p className="text-5xl font-bold text-white">48h</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-white text-center mt-8">
                  Una nuova era per chi lavora nel lusso in modo serio e professionale.
                </p>
              </div>

              {/* Perché è diversa */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mt-12">
                <h3 className="text-3xl font-bold mb-6">
                  Perché è diversa da tutto ciò che esiste oggi
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Le piattaforme tradizionali impongono <span className="text-red-400 line-through">commissioni tra il 15% e il 25%</span>,
                  accreditano i fondi <span className="text-red-400 line-through">dopo settimane</span> e offrono una gestione parziale dei servizi.
                </p>
                <div className="bg-black/70 rounded-xl p-6 border border-gray-700 mb-6">
                  <p className="text-white font-bold text-lg mb-4">
                    DR7 APP abbatte questo sistema e propone un modello fondato su tre pilastri chiave:
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg">
                        1
                      </div>
                      <div>
                        <p className="text-white font-bold">Efficienza economica</p>
                        <p className="text-gray-300">commissione unica e fissa al 9%, che restituisce margini agli operatori e riduce i costi per i clienti</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg">
                        2
                      </div>
                      <div>
                        <p className="text-white font-bold">Velocità finanziaria</p>
                        <p className="text-gray-300">accrediti garantiti in 48 ore, con tracciabilità completa</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg">
                        3
                      </div>
                      <div>
                        <p className="text-white font-bold">Unicità strutturale</p>
                        <p className="text-gray-300">un solo strumento per gestire tutto: mobilità, ospitalità, esperienze e servizi di lusso</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  In un'unica app si concentrano le funzioni di <strong className="text-white">Booking, Airbnb, Uber, Expedia e
                  The Luxury Network</strong>, ma con una filosofia diametralmente opposta: dare potere, libertà e redditività agli
                  operatori, non alle piattaforme.
                </p>
              </div>

              {/* Un ecosistema meritocratico */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mt-12">
                <h3 className="text-3xl font-bold mb-6">
                  Un ecosistema meritocratico
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  DR7 APP è riservata a <strong className="text-white">operatori selezionati, strutture di alta categoria e marchi
                  verificati</strong>, che condividono lo stesso standard di qualità e di immagine.
                </p>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Ogni partner viene verificato direttamente da Dubai Rent 7.0 S.p.A., e solo le aziende conformi ai requisiti
                  qualitativi DR7 possono entrare nel circuito.
                </p>
                <div className="bg-black/70 rounded-xl p-6 border border-gray-700">
                  <p className="text-lg text-white leading-relaxed">
                    Questo crea una <strong>rete di alto profilo</strong> dove la fiducia è garantita, la qualità è costante e
                    la clientela è realmente selezionata. Il risultato è un ambiente controllato, professionale e di prestigio,
                    dove ogni transazione diventa <strong>esperienza di lusso certificata</strong>.
                  </p>
                </div>
              </div>

              {/* Espansione globale */}
              <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border border-gray-800 rounded-2xl p-8 mt-12">
                <h3 className="text-3xl font-bold mb-6">
                  Espansione e Visione Globale
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Il progetto nasce in <strong className="text-white">Sardegna, cuore del lusso mediterraneo</strong>, ma è già
                  proiettato verso le principali capitali internazionali:
                </p>
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {['Milano', 'Roma', 'Monte Carlo', 'Parigi', 'Dubai', 'Miami'].map((city) => (
                    <div key={city} className="bg-black border border-white rounded-full px-6 py-2">
                      <span className="text-white font-bold">{city}</span>
                    </div>
                  ))}
                </div>
                <p className="text-gray-300 leading-relaxed">
                  L'obiettivo è creare una <strong className="text-white">rete mondiale di operatori del lusso interconnessi</strong>,
                  che lavorano con regole chiare, margini equi e pagamenti sicuri. Una piattaforma che permetta al mercato di
                  ritrovare equilibrio, fiducia e sostenibilità economica, dando finalmente spazio ai veri protagonisti: le aziende,
                  le persone, la professionalità.
                </p>
              </div>

              {/* Missione DR7 APP */}
              <div className="bg-black border-2 border-white rounded-2xl p-10 mt-12 text-center">
                <h3 className="text-3xl font-bold mb-6">La missione</h3>
                <p className="text-3xl font-bold text-white mb-8 leading-relaxed">
                  Restituire centralità e valore<br/>
                  a chi costruisce il lusso,<br/>
                  non a chi lo intermedia.
                </p>
                <p className="text-xl text-gray-300 leading-relaxed mb-8">
                  DR7 APP non è solo un marketplace, è un <strong className="text-white">movimento economico e culturale</strong>:<br/>
                  unisce tecnologia, etica e concretezza, per trasformare il lusso in un ecosistema trasparente,
                  meritocratico e sostenibile.
                </p>
                <p className="text-xl text-white leading-relaxed">
                  Ogni azienda che entra in DR7 APP entra in un mondo nuovo:<br/>
                  un mondo in cui il successo non è deciso dagli algoritmi,<br/>
                  ma dalla qualità e dall'impegno reale.
                </p>
              </div>

              {/* Conclusione DR7 APP */}
              <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-white rounded-2xl p-10 mt-12 text-center">
                <h3 className="text-3xl font-bold mb-6">In una frase</h3>
                <p className="text-3xl font-bold text-white leading-relaxed mb-6">
                  DR7 APP è la nuova infrastruttura digitale<br/>
                  del lusso mondiale.
                </p>
                <div className="inline-block bg-white text-black rounded-2xl p-8 mb-6">
                  <p className="text-2xl font-bold mb-2">Un'unica app.</p>
                  <p className="text-4xl font-bold mb-2">Commissione fissa 9%.</p>
                  <p className="text-2xl font-bold">Accredito in 48 ore.</p>
                </div>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Tecnologia, trasparenza e concretezza<br/>
                  al servizio del lusso reale.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Il futuro del lusso inizia qui
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              DR7 Token, DR7 Up e DR7 APP rappresentano la prossima evoluzione dell'ecosistema DR7 Empire
            </p>
            <Link
              to="/"
              className="inline-block bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-all"
            >
              Torna alla Home
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default TokenPage;
