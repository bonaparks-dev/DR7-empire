import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import BackButton from '../components/ui/BackButton';

const CancellationPolicyPage = () => {
  const { lang } = useTranslation();

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
                {lang === 'it' ? '2. Cancellazione entro 5 giorni dalla data del servizio' : '2. Cancellation up to 5 days before service date'}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {lang === 'it'
                  ? 'Il Cliente pu\u00f2 cancellare la prenotazione fino a 5 (cinque) giorni prima della data e ora previste per l\u2019erogazione del servizio.'
                  : 'The Customer may cancel the booking up to 5 (five) days before the scheduled service date and time.'}
              </p>
              <p className="text-gray-300 mb-3">{lang === 'it' ? 'In tal caso:' : 'In such case:'}</p>
              <ul className="space-y-1.5 text-gray-300 ml-4 mb-4">
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'DR7 tratterr\u00e0 una quota pari al 10% dell\u2019importo complessivo, a copertura dei costi organizzativi e gestionali' : 'DR7 will retain 10% of the total amount to cover organizational and management costs'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'il restante 90% sar\u00e0 riconosciuto esclusivamente sotto forma di credit wallet DR7' : 'the remaining 90% will be credited exclusively as DR7 credit wallet'}</li>
              </ul>
              <p className="text-gray-400 font-semibold mb-2">{lang === 'it' ? 'Caratteristiche del credit wallet:' : 'Credit wallet features:'}</p>
              <ul className="space-y-1.5 text-gray-300 ml-4">
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'validit\u00e0: 12 (dodici) mesi dalla data di emissione' : 'validity: 12 (twelve) months from date of issue'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'utilizzabile per qualsiasi servizio DR7' : 'usable for any DR7 service'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'non cedibile a terzi' : 'not transferable to third parties'}</li>
                <li className="flex items-start gap-2"><span className="text-white mt-0.5">•</span> {lang === 'it' ? 'non convertibile in denaro' : 'not convertible into cash'}</li>
              </ul>
            </motion.section>

            {/* 3. Cancellazione oltre i 5 giorni */}
            <motion.section className="bg-gray-900/50 border border-gray-800 rounded-lg p-8" variants={itemVariants}>
              <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3">
                {lang === 'it' ? '3. Cancellazione oltre i 5 giorni dalla data del servizio' : '3. Cancellation within 5 days of service date'}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                {lang === 'it'
                  ? 'In caso di cancellazione comunicata oltre il termine di 5 (cinque) giorni dalla data prevista per il servizio:'
                  : 'In case of cancellation communicated within 5 (five) days of the scheduled service date:'}
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

            {/* 7. DR7 Flex Senza Pensieri */}
            <motion.section className="bg-gray-900/50 border border-green-800/50 rounded-lg p-8" variants={itemVariants}>
              <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3">
                {lang === 'it' ? '7. Servizio opzionale "DR7 Flex Senza Pensieri"' : '7. Optional "DR7 Flex No Worries" service'}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {lang === 'it'
                  ? 'DR7 mette a disposizione un servizio opzionale denominato "DR7 Flex Senza Pensieri", acquistabile in fase di prenotazione.'
                  : 'DR7 offers an optional service called "DR7 Flex No Worries", purchasable during booking.'}
              </p>
              <p className="text-gray-300 mb-3">{lang === 'it' ? 'Tale servizio consente:' : 'This service allows:'}</p>
              <ul className="space-y-1.5 text-green-400 ml-4 mb-4">
                <li className="flex items-start gap-2"><span className="mt-0.5">•</span> {lang === 'it' ? 'cancellazione anche a ridosso dell\u2019orario previsto' : 'cancellation even close to the scheduled time'}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5">•</span> {lang === 'it' ? 'rimborso integrale dell\u2019importo versato' : 'full refund of the amount paid'}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5">•</span> {lang === 'it' ? 'nessuna trattenuta del 10%' : 'no 10% retention'}</li>
                <li className="flex items-start gap-2"><span className="mt-0.5">•</span> {lang === 'it' ? 'nessuna applicazione di penali' : 'no penalties applied'}</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mb-4">
                {lang === 'it'
                  ? 'Il rimborso sar\u00e0 erogato sotto forma di credit wallet DR7, salvo diverse condizioni specificate al momento dell\u2019acquisto del servizio.'
                  : 'The refund will be issued as DR7 credit wallet, unless different conditions are specified at the time of service purchase.'}
              </p>
              <p className="text-gray-400 leading-relaxed italic">
                {lang === 'it'
                  ? 'In assenza dell\u2019acquisto del servizio DR7 Flex Senza Pensieri, si applica integralmente la presente policy standard.'
                  : 'In the absence of purchasing the DR7 Flex No Worries service, this standard policy applies in full.'}
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
