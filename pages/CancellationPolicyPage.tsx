import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import BackButton from '../components/ui/BackButton';

const CancellationPolicyPage = () => {
  const { t, lang } = useTranslation();

  const policy = {
    title: {
      it: 'Cancellazione della Prenotazione e Rimborsi',
      en: 'Booking Cancellation and Refunds'
    },
    sections: [
      {
        title: {
          it: '1. Cancellazione entro 48 ore dalla prenotazione',
          en: '1. Cancellation within 48 hours of booking'
        },
        content: {
          it: 'Il Cliente ha facoltà di annullare la propria prenotazione entro 48 (quarantotto) ore dalla data e ora di conferma della stessa. In tal caso, Dubai Rent 7.0 S.r.l. provvederà all\'emissione di un voucher nominativo pari al 95% (novantacinque per cento) dell\'importo versato, utilizzabile per futuri noleggi o servizi DR7 entro il termine di dodici (12) mesi dalla data di emissione. Il voucher non è cedibile a terzi né convertibile in denaro contante.',
          en: 'The Customer has the right to cancel their booking within 48 (forty-eight) hours of the confirmation date and time. In such cases, Dubai Rent 7.0 S.r.l. will issue a nominal voucher equal to 95% (ninety-five percent) of the amount paid, usable for future rentals or DR7 services within twelve (12) months from the date of issue. The voucher is not transferable to third parties nor convertible into cash.'
        }
      },
      {
        title: {
          it: '2. Cancellazione oltre le 48 ore dalla prenotazione',
          en: '2. Cancellation after 48 hours of booking'
        },
        content: {
          it: 'Decorso il termine di cui al comma precedente, nessun rimborso o buono potrà essere riconosciuto al Cliente, qualunque sia la motivazione della cancellazione o del mancato utilizzo del servizio. La prenotazione sarà considerata definitivamente confermata e non rimborsabile, ai sensi e per gli effetti degli artt. 1453 e seguenti del Codice Civile.',
          en: 'After the aforementioned deadline, no refund or voucher will be granted to the Customer, regardless of the reason for cancellation or non-use of the service. The booking will be considered definitively confirmed and non-refundable, pursuant to Articles 1453 et seq. of the Italian Civil Code.'
        }
      },
      {
        title: {
          it: '3. Mancata presentazione (No Show)',
          en: '3. No Show'
        },
        content: {
          it: 'In caso di mancata presentazione del Cliente nel giorno e ora previsti per il ritiro del veicolo, senza preventiva comunicazione scritta entro i termini indicati, l\'importo versato sarà integralmente trattenuto a titolo di penale per la mancata fruizione del servizio, come previsto dall\'art. 1382 c.c.',
          en: 'In the event of the Customer\'s failure to appear on the day and time scheduled for vehicle pickup, without prior written notice within the specified deadlines, the amount paid will be fully retained as a penalty for non-use of the service, as provided by Article 1382 of the Italian Civil Code.'
        }
      },
      {
        title: {
          it: '4. Forza maggiore',
          en: '4. Force Majeure'
        },
        content: {
          it: 'In caso di comprovata impossibilità di utilizzo del servizio per cause di forza maggiore (es. calamità naturali, restrizioni governative, eventi straordinari documentati), DR7 si riserva la facoltà, a propria discrezione, di concedere un voucher sostitutivo di pari valore, utilizzabile entro 12 mesi.',
          en: 'In case of proven impossibility to use the service due to force majeure events (e.g., natural disasters, government restrictions, documented extraordinary events), DR7 reserves the right, at its sole discretion, to grant a substitute voucher of equal value, usable within 12 months.'
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

          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-12">
            {lang === 'it' ? policy.title.it : policy.title.en}
          </h1>

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
                  ? 'Tutte le richieste di cancellazione devono essere inviate per iscritto a Dubai.rent7.0spa@gmail.com'
                  : 'All cancellation requests must be submitted in writing to Dubai.rent7.0spa@gmail.com'}
              </li>
              <li>
                • {lang === 'it'
                  ? 'Il termine di 48 ore è calcolato dalla data e ora di conferma della prenotazione'
                  : 'The 48-hour deadline is calculated from the date and time of booking confirmation'}
              </li>
              <li>
                • {lang === 'it'
                  ? 'I voucher emessi hanno validità di 12 mesi dalla data di emissione'
                  : 'Issued vouchers are valid for 12 months from the date of issue'}
              </li>
            </ul>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-2">
              {lang === 'it' ? 'Per assistenza o informazioni:' : 'For assistance or information:'}
            </p>
            <a
              href="mailto:Dubai.rent7.0spa@gmail.com"
              className="text-white hover:underline font-semibold text-lg"
            >
              Dubai.rent7.0spa@gmail.com
            </a>
            <p className="text-gray-500 text-sm mt-6">
              Dubai Rent 7.0 S.r.l. - Viale Marconi, 229, 09131 Cagliari CA
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CancellationPolicyPage;
