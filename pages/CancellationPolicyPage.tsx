import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import BackButton from '../components/ui/BackButton';
import { useCancellationPolicy } from '../hooks/useCancellationPolicy';

const CancellationPolicyPage = () => {
  const { lang } = useTranslation();
  // Pull the "main" rule (highest threshold) from Centralina Pro to drive
  // the displayed numbers. Operators edit the rules in admin > Centralina
  // Pro > Automazioni > "Regole di cancellazione".
  const { thresholdDays, refundPercent, penaltyPercent } = useCancellationPolicy();
  const daysWord = lang === 'it'
    ? `${thresholdDays} (${thresholdDays === 1 ? 'un' : thresholdDays}) giorn${thresholdDays === 1 ? 'o' : 'i'}`
    : `${thresholdDays} (${thresholdDays === 1 ? 'one' : thresholdDays}) day${thresholdDays === 1 ? '' : 's'}`;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
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
      <div className="container mx-auto px-6 pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <BackButton to="/" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">
            {lang === 'it'
              ? 'Policy di Cancellazione e Modifica Prenotazioni'
              : 'Cancellation and Booking Modification Policy'}
          </h1>
          <p className="text-center text-gray-400 text-sm mb-12">DR7</p>

          <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* 1. Ambito di applicazione */}
            <motion.section className="bg-gray-900/50 border border-gray-800 rounded-lg p-8" variants={itemVariants}>
              <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3">
                {lang === 'it' ? '1. Ambito di applicazione' : '1. Scope of application'}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {lang === 'it'
                  ? 'La presente policy disciplina le condizioni di cancellazione e gestione delle prenotazioni relative a tutti i servizi erogati da Dubai Rent 7.0 S.p.A. (DR7), inclusi \u2013 a titolo esemplificativo e non esaustivo \u2013 noleggio veicoli, servizi accessori, esperienze e qualsiasi altra prestazione disponibile.'
                  : 'This policy governs the cancellation and management conditions for bookings related to all services provided by Dubai Rent 7.0 S.p.A. (DR7), including \u2013 but not limited to \u2013 vehicle rental, ancillary services, experiences, and any other available service.'}
              </p>
              <p className="text-gray-300 leading-relaxed mb-3">
                {lang === 'it' ? 'La policy si applica a tutte le prenotazioni effettuate tramite:' : 'The policy applies to all bookings made via:'}
              </p>
              <ul className="space-y-1.5 text-gray-300 ml-4 mb-4">
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'sito web ufficiale DR7' : 'official DR7 website'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'sedi operative DR7' : 'DR7 operational offices'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'canali digitali (WhatsApp, e-mail, piattaforme online)' : 'digital channels (WhatsApp, email, online platforms)'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'contatto telefonico' : 'telephone contact'}</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                {lang === 'it'
                  ? 'Le presenti condizioni sono valide indipendentemente dalla modalit\u00e0 di prenotazione e dal metodo di pagamento utilizzato, inclusi carta di credito/debito, bonifico bancario, wallet DR7 o altri sistemi accettati.'
                  : 'These conditions are valid regardless of the booking method and payment method used, including credit/debit card, bank transfer, DR7 wallet, or other accepted systems.'}
              </p>
            </motion.section>

            {/* 2. Cancellazione entro 5 giorni */}
            <motion.section className="bg-gray-900/50 border border-gray-800 rounded-lg p-8" variants={itemVariants}>
              <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3">
                {lang === 'it' ? `2. Cancellazione entro ${thresholdDays} giorni dalla data del servizio` : `2. Cancellation up to ${thresholdDays} days before service date`}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {lang === 'it'
                  ? `Il Cliente pu\u00f2 cancellare la prenotazione fino a ${daysWord} prima della data e ora previste per l\u2019erogazione del servizio.`
                  : `The Customer may cancel the booking up to ${daysWord} before the scheduled service date and time.`}
              </p>
              <p className="text-gray-300 mb-3">{lang === 'it' ? 'In tal caso:' : 'In such case:'}</p>
              <ul className="space-y-1.5 text-gray-300 ml-4 mb-4">
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? `DR7 tratterrà una quota pari al ${penaltyPercent}% dell\u2019importo complessivo, a copertura dei costi organizzativi e gestionali` : `DR7 will retain ${penaltyPercent}% of the total amount to cover organizational and management costs`}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? `il restante ${refundPercent}% sarà riconosciuto esclusivamente sotto forma di credit wallet DR7` : `the remaining ${refundPercent}% will be credited exclusively as DR7 credit wallet`}</li>
              </ul>
              <p className="text-gray-400 font-semibold mb-2">{lang === 'it' ? 'Caratteristiche del credit wallet:' : 'Credit wallet features:'}</p>
              <ul className="space-y-1.5 text-gray-300 ml-4">
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'validit\u00e0: 12 (dodici) mesi dalla data di emissione' : 'validity: 12 (twelve) months from date of issue'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'utilizzabile per qualsiasi servizio DR7' : 'usable for any DR7 service'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'non cedibile a terzi' : 'not transferable to third parties'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'non convertibile in denaro' : 'not convertible into cash'}</li>
              </ul>
            </motion.section>

            {/* 3. Cancellazione oltre la soglia */}
            <motion.section className="bg-gray-900/50 border border-gray-800 rounded-lg p-8" variants={itemVariants}>
              <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3">
                {lang === 'it' ? `3. Cancellazione oltre i ${thresholdDays} giorni dalla data del servizio` : `3. Cancellation within ${thresholdDays} days of service date`}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                {lang === 'it'
                  ? `In caso di cancellazione comunicata oltre il termine di ${daysWord} dalla data prevista per il servizio:`
                  : `In case of cancellation communicated within ${daysWord} of the scheduled service date:`}
              </p>
              <ul className="space-y-1.5 text-gray-300 ml-4 mb-4">
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'non \u00e8 previsto alcun rimborso' : 'no refund will be granted'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'non \u00e8 prevista emissione di credit wallet' : 'no credit wallet will be issued'}</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                {lang === 'it'
                  ? 'La prenotazione si intende definitivamente confermata e non rimborsabile, ai sensi degli artt. 1453 e seguenti del Codice Civile, anche in considerazione dell\u2019organizzazione e allocazione delle risorse operative.'
                  : 'The booking is considered definitively confirmed and non-refundable, pursuant to Articles 1453 et seq. of the Italian Civil Code, also considering the organization and allocation of operational resources.'}
              </p>
            </motion.section>

            {/* 4. Mancata presentazione (No Show) */}
            <motion.section className="bg-gray-900/50 border border-gray-800 rounded-lg p-8" variants={itemVariants}>
              <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3">
                {lang === 'it' ? '4. Mancata presentazione (No Show)' : '4. No Show'}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                {lang === 'it'
                  ? 'In caso di mancata presentazione del Cliente nel giorno e all\u2019orario concordati, senza preventiva comunicazione nei termini indicati:'
                  : 'In case of the Customer\u2019s failure to appear on the agreed day and time, without prior notice within the specified deadlines:'}
              </p>
              <ul className="space-y-1.5 text-gray-300 ml-4 mb-4">
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'l\u2019intero importo versato sar\u00e0 trattenuto a titolo di penale, ai sensi dell\u2019art. 1382 c.c.' : 'the entire amount paid will be retained as a penalty, pursuant to Article 1382 of the Italian Civil Code'}</li>
              </ul>
              <p className="text-gray-300 mb-3">{lang === 'it' ? 'Rientrano nella fattispecie di No Show anche:' : 'No Show also includes:'}</p>
              <ul className="space-y-1.5 text-gray-300 ml-4 mb-4">
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'ritardi significativi tali da compromettere l\u2019erogazione del servizio' : 'significant delays that compromise service delivery'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'impossibilit\u00e0 di fruire del servizio per cause non comunicate nei termini previsti' : 'inability to use the service due to reasons not communicated within the specified deadlines'}</li>
              </ul>
              <p className="text-gray-300 mb-3">{lang === 'it' ? 'In tali casi:' : 'In such cases:'}</p>
              <ul className="space-y-1.5 text-gray-300 ml-4">
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'non \u00e8 previsto alcun rimborso' : 'no refund will be granted'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'non \u00e8 prevista emissione di voucher o credito' : 'no voucher or credit will be issued'}</li>
              </ul>
            </motion.section>

            {/* 5. Modalita di comunicazione */}
            <motion.section className="bg-gray-900/50 border border-gray-800 rounded-lg p-8" variants={itemVariants}>
              <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3">
                {lang === 'it' ? '5. Modalit\u00e0 di comunicazione delle cancellazioni' : '5. Cancellation communication methods'}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                {lang === 'it'
                  ? 'Le richieste di cancellazione devono essere effettuate esclusivamente attraverso i canali ufficiali DR7:'
                  : 'Cancellation requests must be made exclusively through official DR7 channels:'}
              </p>
              <ul className="space-y-1.5 text-gray-300 ml-4 mb-4">
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'e-mail all\u2019indirizzo: info@dr7.app' : 'email to: info@dr7.app'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'messaggistica WhatsApp ai numeri ufficiali pubblicati da DR7' : 'WhatsApp messaging to official DR7 numbers'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'area riservata del sito web DR7, ove il Cliente pu\u00f2 procedere in autonomia alla cancellazione' : 'DR7 website reserved area, where the Customer can independently proceed with cancellation'}</li>
              </ul>
              <p className="text-gray-300 mb-3">{lang === 'it' ? 'Ai fini della validit\u00e0 della richiesta:' : 'For the validity of the request:'}</p>
              <ul className="space-y-1.5 text-gray-300 ml-4 mb-4">
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'far\u00e0 fede la data e ora di invio della comunicazione tramite i canali sopra indicati' : 'the date and time of sending the communication through the above channels will be authoritative'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'per le cancellazioni effettuate tramite sito, far\u00e0 fede il timestamp registrato dai sistemi DR7' : 'for cancellations made via the website, the timestamp recorded by DR7 systems will be authoritative'}</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                {lang === 'it'
                  ? 'Non saranno ritenute valide richieste di cancellazione effettuate tramite canali non ufficiali o diversi da quelli sopra indicati.'
                  : 'Cancellation requests made through unofficial or different channels than those indicated above will not be considered valid.'}
              </p>
            </motion.section>

            {/* 6. Trasparenza e accettazione */}
            <motion.section className="bg-gray-900/50 border border-gray-800 rounded-lg p-8" variants={itemVariants}>
              <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3">
                {lang === 'it' ? '6. Trasparenza e accettazione della policy' : '6. Transparency and policy acceptance'}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-3">{lang === 'it' ? 'La presente policy \u00e8:' : 'This policy is:'}</p>
              <ul className="space-y-1.5 text-gray-300 ml-4 mb-4">
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'pubblicata sul sito ufficiale DR7' : 'published on the official DR7 website'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'consultabile durante il processo di prenotazione' : 'accessible during the booking process'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'accessibile tramite link diretto anche nei sistemi di prenotazione via WhatsApp e altri canali digitali' : 'accessible via direct link also in WhatsApp booking systems and other digital channels'}</li>
              </ul>
              <p className="text-gray-300 leading-relaxed font-semibold">
                {lang === 'it'
                  ? 'La conferma della prenotazione comporta la piena accettazione delle presenti condizioni.'
                  : 'Confirmation of the booking implies full acceptance of these conditions.'}
              </p>
            </motion.section>

            {/* 7. PRIME FLEX (rental only) */}
            <motion.section className="bg-gray-900/50 border border-green-800/50 rounded-lg p-8" variants={itemVariants}>
              <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3">
                {lang === 'it' ? '7. Servizio opzionale "DR7 FLEX" (solo noleggio)' : '7. Optional "DR7 FLEX" service (rentals only)'}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {lang === 'it'
                  ? 'DR7 FLEX è un servizio opzionale acquistabile in fase di prenotazione del noleggio. Non è applicabile ad altri servizi.'
                  : 'DR7 FLEX is an optional service purchasable when booking a rental. It does not apply to other services.'}
              </p>
              <p className="text-gray-300 mb-3">{lang === 'it' ? 'Condizioni:' : 'Terms:'}</p>
              <ul className="space-y-1.5 text-green-400 ml-4 mb-4">
                <li className="flex items-start gap-2"><span className="mt-0.5">•</span> {lang === 'it' ? 'Cancellazione consentita fino al giorno stesso del noleggio.' : 'Cancellation allowed up to the same day of the rental.'}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5">•</span> {lang === 'it' ? 'Rimborso del 90% in credito DR7 Wallet per utilizzi futuri.' : '90% refund as DR7 Wallet credit for future use.'}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5">•</span> {lang === 'it' ? '\u00c8 possibile 1 solo spostamento gratuito, salvo eventuale differenza di prezzo.' : 'One free reschedule allowed, subject to any price difference.'}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5">•</span> {lang === 'it' ? 'Nessuna perdita totale dell\u2019importo, salvo promozioni non rimborsabili o mancata presentazione.' : 'No total loss of the amount, except for non-refundable promotions or no-show.'}</li>
              </ul>
              <p className="text-gray-400 leading-relaxed italic">
                {lang === 'it'
                  ? 'In assenza dell\u2019acquisto del servizio DR7 FLEX, si applica integralmente la presente policy standard per il noleggio.'
                  : 'In the absence of purchasing the DR7 FLEX service, this standard policy applies in full for the rental.'}
              </p>
            </motion.section>

            {/* 8. PRIME FLEX (car wash only) */}
            <motion.section className="bg-gray-900/50 border border-green-800/50 rounded-lg p-8" variants={itemVariants}>
              <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3">
                {lang === 'it' ? '8. Servizio opzionale "PRIME FLEX" (solo lavaggio)' : '8. Optional "PRIME FLEX" service (car wash only)'}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {lang === 'it'
                  ? 'PRIME FLEX è un servizio opzionale acquistabile in fase di prenotazione del lavaggio. Non è applicabile ad altri servizi.'
                  : 'PRIME FLEX is an optional service purchasable when booking a car wash. It does not apply to other services.'}
              </p>
              <p className="text-gray-300 mb-3">{lang === 'it' ? 'Condizioni:' : 'Terms:'}</p>
              <ul className="space-y-1.5 text-green-400 ml-4 mb-4">
                <li className="flex items-start gap-2"><span className="mt-0.5">•</span> {lang === 'it' ? 'Cancellazione consentita fino al giorno stesso del lavaggio.' : 'Cancellation allowed up to the same day of the car wash.'}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5">•</span> {lang === 'it' ? 'Rimborso del 90% in credito DR7 Wallet per utilizzi futuri.' : '90% refund as DR7 Wallet credit for future use.'}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5">•</span> {lang === 'it' ? '\u00c8 possibile 1 solo spostamento gratuito, salvo eventuale differenza di prezzo.' : 'One free reschedule allowed, subject to any price difference.'}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5">•</span> {lang === 'it' ? 'Nessuna perdita totale dell\u2019importo, salvo promozioni non rimborsabili o mancata presentazione.' : 'No total loss of the amount, except for non-refundable promotions or no-show.'}</li>
              </ul>
              <p className="text-gray-400 leading-relaxed italic">
                {lang === 'it'
                  ? 'In assenza dell\u2019acquisto del servizio PRIME FLEX, si applica integralmente la presente policy standard per il lavaggio.'
                  : 'In the absence of purchasing the PRIME FLEX service, this standard policy applies in full for the car wash.'}
              </p>
            </motion.section>
          </motion.div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-2">
              {lang === 'it' ? 'Per assistenza o informazioni:' : 'For assistance or information:'}
            </p>
            <a
              href="mailto:info@dr7.app"
              className="text-white hover:underline font-semibold text-lg"
            >
              info@dr7.app
            </a>
            <p className="text-gray-500 text-sm mt-6">
              Dubai Rent 7.0 S.p.A. - Viale Marconi, 229, 09131 Cagliari CA
            </p>
            <p className="text-gray-600 text-xs mt-4">
              {lang === 'it' ? 'Ultimo aggiornamento: 10 aprile 2026' : 'Last updated: April 10, 2026'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CancellationPolicyPage;
