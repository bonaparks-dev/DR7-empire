import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/ui/BackButton';

const LegalTermsPage = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-black text-white min-h-screen"
    >
      <div className="container mx-auto px-4 sm:px-6 pt-32 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <BackButton to="/commercial-operation" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white text-center mb-4">
            REGOLAMENTO UFFICIALE LOTTERIA DR7 S.p.A.
          </h1>

          <p className="text-center text-gray-400 mb-12 text-sm sm:text-base">
            (Conforme alle normative italiane)
          </p>

          <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Art. 1 */}
            <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Art. 1 – Soggetto Promotore
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-gray-300">
                <p>
                  La presente iniziativa è promossa da Dubai Rent 7.0 S.p.A. (DR7 S.p.A.), con sede legale in via del Fangario 25, Cagliari (CA), P.IVA 0410464927.
                </p>
                <p>La società organizza la presente lotteria ai sensi degli:</p>
                <p>Artt. 13 e 14 del DPR 430/2001 (normativa italiana sui concorsi a premio),</p>
                <p>Art. 19 T.U.L.P.S. (R.D. 18/06/1931 n. 773) per la parte relativa al pubblico spettacolo e operazioni a premio,</p>
                <p>Codice Civile artt. 1987–1991 (promesse al pubblico).</p>
              </div>
            </motion.section>

            {/* Art. 2 */}
            <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Art. 2 – Tipologia dell'iniziativa
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-gray-300">
                <p>
                  La presente è una lotteria a fini commerciali, senza scopo benefico, organizzata per la promozione dell'attività aziendale DR7 S.p.A.
                </p>
                <p>
                  Viene applicato il regime previsto dal DPR 430/2001, con obbligo di trasparenza, verbalizzazione e supervisione da parte di un professionista (avvocato).
                </p>
              </div>
            </motion.section>

            {/* Art. 3 */}
            <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Art. 3 – Durata
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-gray-300">
                <p>Inizio vendita biglietti: data di avvio stabilita da DR7 S.p.A.</p>
                <p>Termine vendita biglietti: 20 dicembre, ore 18:00</p>
                <p>Estrazione: 24 dicembre, ore 10:00</p>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="font-bold text-white mb-2">Clausola ufficiale di proroga (come da DPR 430/2001)</p>
                  <p>In caso di mancato raggiungimento del numero minimo tecnico di 2.000 biglietti, l'estrazione potrà essere prorogata fino a 30 giorni, con comunicazione pubblica ai partecipanti.</p>
                </div>
              </div>
            </motion.section>

            {/* Art. 4 */}
            <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Art. 4 – Partecipanti
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-gray-300">
                <p>La partecipazione è aperta a:</p>
                <p>persone fisiche maggiorenni,</p>
                <p>cittadini italiani o stranieri residenti in Italia,</p>
                <p>senza limiti di acquisto (ogni partecipante può acquistare più biglietti).</p>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p>Sono esclusi:</p>
                  <p>dipendenti DR7 S.p.A.,</p>
                  <p>collaboratori incaricati della gestione della lotteria,</p>
                  <p>l'avvocato verificatore.</p>
                </div>
              </div>
            </motion.section>

            {/* Art. 5 */}
            <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Art. 5 – Biglietti
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-gray-300">
                <p>Sono stampati 2.000 biglietti numerati progressivamente, composti da:</p>
                <p>tagliando consegnato al cliente,</p>
                <p>matrice trattenuta da DR7 S.p.A. per controlli e inserimento nell'urna.</p>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p>Ogni biglietto è venduto al prezzo di €25,00.</p>
                  <p>La numerazione è unica e inimitabile: i biglietti non sono duplicabili e non possono essere fotocopiati o riprodotti.</p>
                </div>
              </div>
            </motion.section>

            {/* Art. 6 */}
            <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Art. 6 – Premio
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-gray-300">
                <p>Il premio consiste in:</p>
                <p className="font-semibold text-white">un'autovettura del valore minimo garantito di 50.000€, scelta e fornita da DR7 S.p.A.</p>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p>Valore di mercato certificato ai sensi dell'Art. 9, comma 1, DPR 430/2001.</p>
                  <p>Il premio verrà consegnato il giorno stesso dell'estrazione, con:</p>
                  <p>passaggio di proprietà,</p>
                  <p>consegna chiavi,</p>
                  <p>verbale di assegnazione.</p>
                </div>
              </div>
            </motion.section>

            {/* Art. 7 */}
            <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Art. 7 – Modalità dell'Estrazione
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-gray-300">
                <p>L'estrazione avverrà in modalità totalmente pubblica e trasparente.</p>

                <p className="font-semibold text-white">Procedura:</p>
                <p>1. Verifica tagliandi/matrici</p>
                <p>2. Pubblicazione lista numeri partecipanti</p>
                <p>3. Inserimento di tutte le matrici in un'urna trasparente</p>
                <p>4. Mescolamento e sigillo urna</p>
                <p>5. Estrazione alla presenza di un avvocato incaricato</p>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p>L'avvocato certifica la regolarità dell'intera procedura ai sensi dell'Art. 9 DPR 430/2001.</p>
                </div>
              </div>
            </motion.section>

            {/* Art. 8 */}
            <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Art. 8 – Verifica del Vincitore
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-gray-300">
                <p>Il numero estratto viene controllato immediatamente tramite:</p>
                <p>confronto tra matrice e tagliando corrispondente,</p>
                <p>verifica sulla lista ufficiale dei partecipanti,</p>
                <p>identificazione del vincitore con documento.</p>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="font-semibold text-white">Solo in caso di perfetta corrispondenza il premio è assegnato.</p>
                </div>
              </div>
            </motion.section>

            {/* Art. 9 */}
            <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Art. 9 – Consegna del Premio
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-gray-300">
                <p>Il premio viene consegnato immediatamente, con:</p>
                <p>passaggio di proprietà,</p>
                <p>verbale firmato,</p>
                <p>consegna del veicolo.</p>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p>Non è previsto:</p>
                  <p>pagamento in denaro,</p>
                  <p>sostituzione del premio,</p>
                  <p>conversione del valore.</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p>Il premio non ritirato non verrà riassegnato, come previsto dall'Art. 10 DPR 430/2001.</p>
                </div>
              </div>
            </motion.section>

            {/* Art. 10 */}
            <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Art. 10 – Trasparenza e controllo
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-gray-300">
                <p>L'intera procedura è controllata da un avvocato indipendente, in conformità con:</p>
                <p>Art. 9 DPR 430/2001,</p>
                <p>Codice Civile artt. 1375 (buona fede) e 1175 (correttezza).</p>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p>L'estrazione può essere registrata per garantire la massima trasparenza.</p>
                </div>
              </div>
            </motion.section>

            {/* Art. 11 */}
            <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Art. 11 – Comunicazioni
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-gray-300">
                <p>Qualsiasi proroga, variazione o informazione ufficiale verrà comunicata tramite:</p>
                <p>sito DR7,</p>
                <p>profili social ufficiali,</p>
                <p>recapiti forniti dai partecipanti,</p>
                <p>avviso presso la sede.</p>
              </div>
            </motion.section>

            {/* Art. 12 */}
            <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Art. 12 – Trattamento Dati Personali (GDPR)
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-gray-300">
                <p>I dati dei partecipanti sono trattati ai sensi del:</p>
                <p>Regolamento UE 679/2016 (GDPR),</p>
                <p>D.Lgs. 196/2003 aggiornato.</p>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p>I dati sono utilizzati solo per:</p>
                  <p>gestione della lotteria,</p>
                  <p>comunicazioni ufficiali,</p>
                  <p>eventuale assegnazione del premio.</p>
                </div>
              </div>
            </motion.section>

            {/* Art. 13 */}
            <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Art. 13 – Accettazione del regolamento
              </h2>
              <div className="text-sm sm:text-base text-gray-300">
                <p>L'acquisto del biglietto implica la piena accettazione del presente regolamento, senza riserve.</p>
              </div>
            </motion.section>

            {/* Art. 14 */}
            <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                Art. 14 – Controversie
              </h2>
              <div className="text-sm sm:text-base text-gray-300">
                <p>Per ogni controversia è competente il Foro di Cagliari.</p>
              </div>
            </motion.section>
          </motion.div>

          {/* Footer Notice */}
          <div className="mt-12 text-center">
            <div className="inline-block p-6 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <p className="text-blue-300 text-sm sm:text-base">
                Regolamento conforme alle normative italiane vigenti
              </p>
              <p className="text-blue-400/70 text-xs sm:text-sm mt-2">
                DPR 430/2001 • T.U.L.P.S. • Codice Civile artt. 1987-1991 • GDPR UE 679/2016
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Per maggiori informazioni:
            </p>
            <a
              href="https://www.dr7empire.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline font-semibold"
            >
              www.dr7empire.com
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LegalTermsPage;
