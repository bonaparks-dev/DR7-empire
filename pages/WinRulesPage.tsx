import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import BackButton from '../components/ui/BackButton';
import { Button } from '../components/ui/Button';

const WinRulesPage = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const rules = {
    title: {
      it: 'Regolamento DR7 Official Lottery',
      en: 'DR7 Official Lottery Rules',
    },
    general: {
      title: { it: 'Informazioni Generali', en: 'General Information' },
      items: [
        { label: { it: 'Organizzatore:', en: 'Organizer:' }, value: { it: 'Dubai Rent 7.0 S.p.A. (DR7 S.p.A.)', en: 'Dubai Rent 7.0 S.p.A. (DR7 S.p.A.)' } },
        { label: { it: 'Sede legale:', en: 'Legal address:' }, value: { it: 'Via del Fangario 25, Cagliari (CA)', en: 'Via del Fangario 25, Cagliari (CA)' } },
        { label: { it: 'P.IVA:', en: 'VAT:' }, value: { it: '04104649927', en: '04104649927' } },
        { label: { it: 'Tipologia:', en: 'Type:' }, value: { it: 'Lotteria a fini commerciali (DPR 430/2001)', en: 'Commercial lottery (DPR 430/2001)' } },
      ],
    },
    dates: {
      title: { it: 'Date Importanti', en: 'Important Dates' },
      items: [
        { label: { it: 'Termine vendita biglietti:', en: 'Ticket sales end:' }, value: { it: '20 dicembre, ore 18:00', en: 'December 20, 6:00 PM' } },
        { label: { it: 'Data estrazione:', en: 'Drawing date:' }, value: { it: '24 dicembre, ore 10:00', en: 'December 24, 10:00 AM' } },
        { label: { it: 'Modalità estrazione:', en: 'Drawing method:' }, value: { it: 'Pubblica e trasparente, alla presenza di un avvocato', en: 'Public and transparent, in the presence of a lawyer' } },
      ],
    },
    tickets: {
      title: { it: 'Biglietti', en: 'Tickets' },
      items: [
        { label: { it: 'Totale biglietti emessi:', en: 'Total tickets issued:' }, value: { it: '2.000', en: '2,000' } },
        { label: { it: 'Prezzo per biglietto:', en: 'Price per ticket:' }, value: { it: '25 €', en: '€25' } },
        { label: { it: 'Numerazione:', en: 'Numbering:' }, value: { it: 'Progressiva e unica (non duplicabile)', en: 'Progressive and unique (not duplicable)' } },
        { label: { it: 'Formato:', en: 'Format:' }, value: { it: 'Tagliando per il cliente + matrice per DR7', en: 'Stub for customer + matrix for DR7' } },
      ],
    },
    prize: {
      title: { it: 'Premio', en: 'Prize' },
      items: [
        { label: { it: 'Premio:', en: 'Prize:' }, value: { it: 'Alfa Romeo Stelvio Quadrifoglio', en: 'Alfa Romeo Stelvio Quadrifoglio' } },
        { label: { it: 'Valore minimo garantito:', en: 'Minimum guaranteed value:' }, value: { it: '50.000 €', en: '€50,000' } },
        { label: { it: 'Potenza:', en: 'Power:' }, value: { it: '510 CV', en: '510 HP' } },
        { label: { it: 'Motore:', en: 'Engine:' }, value: { it: 'Derivato Ferrari', en: 'Ferrari-derived' } },
        { label: { it: 'Consegna:', en: 'Delivery:' }, value: { it: 'Il giorno stesso dell\'estrazione con passaggio di proprietà', en: 'Same day of drawing with ownership transfer' } },
        { label: { it: 'Luogo visibilità:', en: 'Viewing location:' }, value: { it: 'Viale Marconi 229', en: 'Viale Marconi 229' } },
      ],
    },
    participants: {
      title: { it: 'Partecipanti', en: 'Participants' },
      items: [
        { label: { it: 'Chi può partecipare:', en: 'Who can participate:' }, value: { it: 'Persone fisiche maggiorenni, cittadini italiani o stranieri residenti in Italia', en: 'Adult individuals, Italian citizens or foreigners residing in Italy' } },
        { label: { it: 'Limite acquisto:', en: 'Purchase limit:' }, value: { it: 'Nessuno (ogni partecipante può acquistare più biglietti)', en: 'None (each participant can purchase multiple tickets)' } },
        { label: { it: 'Esclusi:', en: 'Excluded:' }, value: { it: 'Dipendenti DR7, collaboratori della lotteria, avvocato verificatore', en: 'DR7 employees, lottery collaborators, verifying lawyer' } },
      ],
    },
    drawing: {
      title: { it: 'Modalità di Estrazione', en: 'Drawing Procedure' },
      items: [
        { value: { it: '1. Verifica tagliandi e matrici', en: '1. Verification of stubs and matrices' } },
        { value: { it: '2. Pubblicazione lista numeri partecipanti', en: '2. Publication of participant numbers list' } },
        { value: { it: '3. Inserimento matrici in urna trasparente', en: '3. Insertion of matrices in transparent urn' } },
        { value: { it: '4. Mescolamento e sigillo urna', en: '4. Mixing and sealing of urn' } },
        { value: { it: '5. Estrazione alla presenza di avvocato', en: '5. Drawing in the presence of lawyer' } },
        { value: { it: '6. Certificazione regolarità (Art. 9 DPR 430/2001)', en: '6. Certification of regularity (Art. 9 DPR 430/2001)' } },
      ],
    },
    transparency: {
      title: { it: 'Trasparenza e Legalità', en: 'Transparency and Legality' },
      items: [
        { label: { it: 'Supervisione:', en: 'Supervision:' }, value: { it: 'Avvocato indipendente (Art. 9 DPR 430/2001)', en: 'Independent lawyer (Art. 9 DPR 430/2001)' } },
        { label: { it: 'Verbalizzazione:', en: 'Documentation:' }, value: { it: 'Verbale ufficiale di assegnazione', en: 'Official assignment minutes' } },
        { label: { it: 'Registrazione:', en: 'Recording:' }, value: { it: 'L\'estrazione può essere registrata per garantire trasparenza', en: 'Drawing may be recorded to ensure transparency' } },
        { label: { it: 'Normative:', en: 'Regulations:' }, value: { it: 'DPR 430/2001, T.U.L.P.S., Codice Civile artt. 1987-1991', en: 'DPR 430/2001, T.U.L.P.S., Civil Code arts. 1987-1991' } },
      ],
    },
    gdpr: {
      title: { it: 'Trattamento Dati (GDPR)', en: 'Data Processing (GDPR)' },
      items: [
        { label: { it: 'Normativa:', en: 'Regulation:' }, value: { it: 'Regolamento UE 679/2016 (GDPR), D.Lgs. 196/2003', en: 'EU Regulation 679/2016 (GDPR), D.Lgs. 196/2003' } },
        { label: { it: 'Finalità:', en: 'Purpose:' }, value: { it: 'Gestione lotteria, comunicazioni ufficiali, assegnazione premio', en: 'Lottery management, official communications, prize assignment' } },
      ],
    },
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
                <BackButton />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
                {language === 'it' ? rules.title.it : rules.title.en}
            </h1>

            <p className="text-center text-gray-400 mb-12">
                {language === 'it' ? 'Informazioni sulla Lotteria' : 'Lottery Information'}
            </p>

            <div className="text-center mb-12">
                <Button
                    onClick={() => navigate('/legal-terms')}
                    variant="outline"
                >
                    {language === 'it' ? 'Regolamento Completo (14 Articoli)' : 'Full Regulations (14 Articles)'}
                </Button>
            </div>

            <motion.div
                className="space-y-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* General Information */}
                <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
                    <h2 className="text-3xl font-semibold mb-6 border-b border-gray-700 pb-3">
                        {language === 'it' ? rules.general.title.it : rules.general.title.en}
                    </h2>
                    <ul className="space-y-4 text-lg text-gray-300">
                        {rules.general.items.map((item, index) => (
                            <li key={index}>
                                <strong className="text-white">{language === 'it' ? item.label.it : item.label.en}</strong> {language === 'it' ? item.value.it : item.value.en}
                            </li>
                        ))}
                    </ul>
                </motion.section>

                {/* Important Dates */}
                <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
                    <h2 className="text-3xl font-semibold mb-6 border-b border-gray-700 pb-3">
                        {language === 'it' ? rules.dates.title.it : rules.dates.title.en}
                    </h2>
                    <ul className="space-y-4 text-lg text-gray-300">
                        {rules.dates.items.map((item, index) => (
                            <li key={index}>
                                <strong className="text-white">{language === 'it' ? item.label.it : item.label.en}</strong> {language === 'it' ? item.value.it : item.value.en}
                            </li>
                        ))}
                    </ul>
                </motion.section>

                {/* Tickets */}
                <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
                    <h2 className="text-3xl font-semibold mb-6 border-b border-gray-700 pb-3">
                        {language === 'it' ? rules.tickets.title.it : rules.tickets.title.en}
                    </h2>
                    <ul className="space-y-4 text-lg text-gray-300">
                        {rules.tickets.items.map((item, index) => (
                            <li key={index}>
                                <strong className="text-white">{language === 'it' ? item.label.it : item.label.en}</strong> {language === 'it' ? item.value.it : item.value.en}
                            </li>
                        ))}
                    </ul>
                </motion.section>

                {/* Prize */}
                <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
                    <h2 className="text-3xl font-semibold mb-6 border-b border-gray-700 pb-3">
                        {language === 'it' ? rules.prize.title.it : rules.prize.title.en}
                    </h2>
                    <ul className="space-y-4 text-lg text-gray-300">
                        {rules.prize.items.map((item, index) => (
                            <li key={index}>
                                <strong className="text-white">{language === 'it' ? item.label.it : item.label.en}</strong> {language === 'it' ? item.value.it : item.value.en}
                            </li>
                        ))}
                    </ul>
                </motion.section>

                {/* Participants */}
                <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
                    <h2 className="text-3xl font-semibold mb-6 border-b border-gray-700 pb-3">
                        {language === 'it' ? rules.participants.title.it : rules.participants.title.en}
                    </h2>
                    <ul className="space-y-4 text-lg text-gray-300">
                        {rules.participants.items.map((item, index) => (
                            <li key={index}>
                                <strong className="text-white">{language === 'it' ? item.label.it : item.label.en}</strong> {language === 'it' ? item.value.it : item.value.en}
                            </li>
                        ))}
                    </ul>
                </motion.section>

                {/* Drawing Procedure */}
                <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
                    <h2 className="text-3xl font-semibold mb-6 border-b border-gray-700 pb-3">
                        {language === 'it' ? rules.drawing.title.it : rules.drawing.title.en}
                    </h2>
                    <ul className="space-y-3 text-lg text-gray-300">
                        {rules.drawing.items.map((item, index) => (
                            <li key={index} className="pl-4 border-l-2 border-white/30">
                                {language === 'it' ? item.value.it : item.value.en}
                            </li>
                        ))}
                    </ul>
                </motion.section>

                {/* Transparency */}
                <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
                    <h2 className="text-3xl font-semibold mb-6 border-b border-gray-700 pb-3">
                        {language === 'it' ? rules.transparency.title.it : rules.transparency.title.en}
                    </h2>
                    <ul className="space-y-4 text-lg text-gray-300">
                        {rules.transparency.items.map((item, index) => (
                            <li key={index}>
                                <strong className="text-white">{language === 'it' ? item.label.it : item.label.en}</strong> {language === 'it' ? item.value.it : item.value.en}
                            </li>
                        ))}
                    </ul>
                </motion.section>

                {/* GDPR */}
                <motion.section variants={itemVariants} className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
                    <h2 className="text-3xl font-semibold mb-6 border-b border-gray-700 pb-3">
                        {language === 'it' ? rules.gdpr.title.it : rules.gdpr.title.en}
                    </h2>
                    <ul className="space-y-4 text-lg text-gray-300">
                        {rules.gdpr.items.map((item, index) => (
                            <li key={index}>
                                <strong className="text-white">{language === 'it' ? item.label.it : item.label.en}</strong> {language === 'it' ? item.value.it : item.value.en}
                            </li>
                        ))}
                    </ul>
                </motion.section>

                {/* Footer Notice */}
                <div className="mt-12 text-center">
                    <div className="inline-block p-6 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                        <p className="text-blue-300 text-base mb-2">
                            {language === 'it' ? 'Per il regolamento completo in 14 articoli, consulta la pagina Termini Legali' : 'For the complete 14-article regulations, see the Legal Terms page'}
                        </p>
                        <Button
                            onClick={() => navigate('/legal-terms')}
                            variant="outline"
                            className="mt-4"
                        >
                            {language === 'it' ? 'Vai ai Termini Legali' : 'Go to Legal Terms'}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default WinRulesPage;
