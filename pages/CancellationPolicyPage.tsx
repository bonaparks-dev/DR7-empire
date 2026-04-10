import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import BackButton from '../components/ui/BackButton';

const CancellationPolicyPage = () => {
  const { t, lang } = useTranslation();

  const policy = {
    title: {
      it: 'Politica di Cancellazione e Rimborsi — Tutti i Servizi',
      en: 'Cancellation and Refund Policy — All Services'
    },
    intro: {
      it: 'Le seguenti condizioni di cancellazione si applicano a tutti i servizi offerti da DR7: noleggio veicoli, Prime Wash (lavaggio auto), servizi meccanici, noleggio furgoni, NCC, servizi experience e qualsiasi altro servizio prenotabile sulla piattaforma.',
      en: 'The following cancellation conditions apply to all services offered by DR7: vehicle rental, Prime Wash (car wash), mechanical services, van rental, chauffeur services (NCC), experience services, and any other service bookable on the platform.'
    },
    sections: [
      {
        title: {
          it: '1. Cancellazione entro 5 giorni prima della data di ritiro',
          en: '1. Cancellation up to 5 days before pickup date'
        },
        content: {
          it: 'Il Cliente ha facoltà di cancellare la propria prenotazione fino a 5 (cinque) giorni prima della data e ora previste per il ritiro del veicolo. In tal caso, Dubai Rent 7.0 S.p.A. tratterrà una quota pari al 10% (dieci per cento) dell\'importo complessivamente versato, a titolo di copertura dei costi organizzativi e di gestione della prenotazione. Il restante 90% (novanta per cento) dell\'importo versato sarà riconosciuto esclusivamente mediante credit wallet, indipendentemente dal metodo di pagamento originariamente utilizzato (carta di credito o credit wallet). Il credito è utilizzabile per futuri noleggi o servizi DR7 entro 12 (dodici) mesi dalla data di emissione. Il credit wallet non è cedibile a terzi né convertibile in denaro contante.',
          en: 'The Customer has the right to cancel their booking up to 5 (five) days before the scheduled vehicle pickup date and time. In such cases, Dubai Rent 7.0 S.p.A. will retain 10% (ten percent) of the total amount paid to cover organizational and booking management costs. The remaining 90% (ninety percent) of the amount paid will be credited exclusively as credit wallet, regardless of the original payment method used (credit card or credit wallet). The credit is usable for future rentals or DR7 services within 12 (twelve) months from the date of issue. The credit wallet is not transferable to third parties nor convertible into cash.'
        }
      },
      {
        title: {
          it: '2. Cancellazione oltre i 5 giorni dalla data di ritiro',
          en: '2. Cancellation within 5 days of pickup date'
        },
        content: {
          it: 'In caso di cancellazione comunicata oltre il termine di 5 (cinque) giorni dalla data prevista per il ritiro del veicolo, nessun rimborso né credit wallet potrà essere riconosciuto, qualunque sia la motivazione della cancellazione. La prenotazione sarà considerata definitivamente confermata e non rimborsabile, ai sensi e per gli effetti degli artt. 1453 e seguenti del Codice Civile, in considerazione dell\'impossibilità di riallocare il veicolo e il servizio prenotato.',
          en: 'In case of cancellation communicated within 5 (five) days of the scheduled vehicle pickup date, no refund or credit wallet will be granted, regardless of the reason for cancellation. The booking will be considered definitively confirmed and non-refundable, pursuant to Articles 1453 et seq. of the Italian Civil Code, due to the impossibility of reallocating the vehicle and booked service.'
        }
      },
      {
        title: {
          it: '3. Mancata presentazione (No Show)',
          en: '3. No Show'
        },
        content: {
          it: 'In caso di mancata presentazione del Cliente nel giorno e all\'orario previsti per il ritiro del veicolo, senza preventiva comunicazione scritta entro i termini indicati, l\'intero importo versato sarà trattenuto a titolo di penale per mancata fruizione del servizio, ai sensi dell\'art. 1382 c.c. La mancata presentazione include anche ritardi significativi tali da compromettere l\'erogazione del servizio. In tali casi non è previsto alcun rimborso né emissione di voucher.',
          en: 'In the event of the Customer\'s failure to appear on the day and time scheduled for vehicle pickup, without prior written notice within the specified deadlines, the entire amount paid will be retained as a penalty for non-use of the service, pursuant to Article 1382 of the Italian Civil Code. No-show also includes significant delays that compromise service delivery. In such cases, no refund or voucher will be issued.'
        }
      },
      {
        title: {
          it: '4. Applicabilità a tutti i servizi',
          en: '4. Applicability to all services'
        },
        content: {
          it: 'Le presenti condizioni di cancellazione e rimborso si applicano a tutti i servizi offerti da Dubai Rent 7.0 S.p.A., inclusi ma non limitati a: noleggio veicoli, servizi di lavaggio (Prime Wash), servizi meccanici, noleggio furgoni, noleggio con conducente (NCC), servizi experience e qualsiasi altro servizio prenotabile tramite la piattaforma DR7. I termini, le modalità e le percentuali di trattenuta sono identici a quelli previsti per il servizio di noleggio veicoli, come specificato ai punti 1, 2 e 3 del presente documento.',
          en: 'These cancellation and refund conditions apply to all services offered by Dubai Rent 7.0 S.p.A., including but not limited to: vehicle rental, car wash services (Prime Wash), mechanical services, van rental, chauffeur services (NCC), experience services, and any other service bookable through the DR7 platform. The terms, procedures, and retention percentages are identical to those set out for the vehicle rental service, as specified in points 1, 2, and 3 of this document.'
        }
      }
    ]
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
      <div className="container mx-auto px-6 pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <BackButton to="/" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white text-center mb-6">
            {lang === 'it' ? policy.title.it : policy.title.en}
          </h1>

          <p className="text-lg text-gray-300 text-center mb-12 max-w-3xl mx-auto">
            {lang === 'it' ? policy.intro.it : policy.intro.en}
          </p>

          <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {policy.sections.map((section, index) => (
              <motion.section
                key={index}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-8"
                variants={itemVariants}
              >
                <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3">
                  {lang === 'it' ? section.title.it : section.title.en}
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  {lang === 'it' ? section.content.it : section.content.en}
                </p>
              </motion.section>
            ))}
          </motion.div>

          <div className="mt-12 p-6 bg-gray-900/70 border border-gray-800 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-3">
              {lang === 'it' ? 'Note Importanti' : 'Important Notes'}
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                • {lang === 'it'
                  ? 'Tutte le richieste di cancellazione devono essere inviate esclusivamente per iscritto all\'indirizzo: info@dr7.app'
                  : 'All cancellation requests must be submitted exclusively in writing to: info@dr7.app'}
              </li>
              <li>
                • {lang === 'it'
                  ? 'I termini di cancellazione sono calcolati con riferimento alla data e ora del ritiro del veicolo'
                  : 'Cancellation deadlines are calculated with reference to the vehicle pickup date and time'}
              </li>
              <li>
                • {lang === 'it'
                  ? 'I voucher emessi hanno validità di 12 mesi dalla data di emissione'
                  : 'Issued credit wallet vouchers are valid for 12 months from the date of issue'}
              </li>
            </ul>
          </div>

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
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CancellationPolicyPage;
