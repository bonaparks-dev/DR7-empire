import React from 'react';
import { motion } from 'framer-motion';

const LegalTermsPage = () => {
  // Language state
  const [language, setLanguage] = React.useState('en'); // or 'it'
  
  // Helper function to get the correct translation
  const t = (textObj) => {
    if (typeof textObj === 'string') return textObj;
    if (textObj && typeof textObj === 'object') {
      return textObj[language] || textObj.en || textObj.it || '';
    }
    return '';
  };

  const rules = {
    title: {
      it: 'Termini Legali',
      en: 'Legal Terms'
    },
    sections: [
      {
        title: { it: 'Art. 1 – Soggetto Promotore', en: 'Art. 1 – Promoter' },
        content: {
          it: 'Dubai Rent 7.0 S.p.A. – DR7 (di seguito, il "Promotore"), con sede legale in via del fangario 25 Cagliari ,04104640927',
          en: 'Dubai Rent 7.0 S.p.A. – DR7 (hereinafter, the "Promoter"), registered office: via del Fangario 25, Cagliari — Tax/VAT no. 04104640927.'
        }
      },
      {
        title: { it: 'Art. 2 – Denominazione e finalità', en: 'Art. 2 – Name and Purpose' },
        content: {
          it: 'Il Promotore indice l\'operazione promozionale denominata "DR7 Luxury Empire – Golden Win", finalizzata a promuovere i propri servizi (noleggio auto e mezzi di lusso, luxury wash, concierge, experience e altri servizi DR7), mediante l\'emissione e la vendita di Gift Card DR7. L\'iniziativa assicura a tutti i partecipanti un vantaggio immediato: acquistando una Gift Card DR7 al prezzo di €20, si riceve subito un credito del valore nominale di €25 (quindi 5 € extra già vinti al momento dell\'acquisto), oltre al diritto di partecipare all\'estrazione dei premi in palio.',
          en: 'The Promoter launches the promotional operation called "7 millions to win", aimed at promoting its services (luxury car and vehicle rentals, luxury wash, concierge, experiences, and other DR7 services) through the issuance and sale of DR7 Gift Cards. The initiative guarantees every participant an immediate benefit: by purchasing a DR7 Gift Card for €20, you immediately receive credit with a face value of €25 (i.e., €5 extra already won at the time of purchase), as well as the right to enter the prize draw.'
        }
      },
      {
        title: { it: 'Art. 3 – Ambito territoriale e destinatari', en: 'Art. 3 – Territorial Scope and Eligible Participants' },
        content: {
          it: 'L\'operazione promozionale è valida a livello internazionale ed è aperta a tutte le persone fisiche maggiorenni. La partecipazione è consentita a chiunque, a condizione che nel proprio Paese di residenza non sussistano norme che vietino o limitino la partecipazione a iniziative promozionali di questo tipo. Nota legale: Il presente regolamento è redatto secondo la normativa italiana. Per i partecipanti residenti all\'estero, l\'operazione è valida ove non contrasti con le leggi locali del Paese di residenza.',
          en: 'The promotion is valid internationally and is open to all adult natural persons. Participation is permitted to anyone, provided that in their country of residence there are no rules that prohibit or restrict participation in promotional initiatives of this kind. Legal note: These rules are drafted under Italian law. For participants residing abroad, the promotion is valid where not in conflict with the local laws of the country of residence.'
        }
      },
      {
        title: { it: 'Art. 4 – Periodo di svolgimento', en: 'Art. 4 – Period' },
        content: {
          it: 'La partecipazione è consentita dal 22 settembre 2025 sino alle ore 9:00 del 22 dicembre 2025, momento in cui si chiude ufficialmente la vendita delle Gift Card. L\'estrazione finale si terrà il 24 dicembre 2025 alle ore 10:00, presso la sede del Promotore. Qualora entro il termine indicato non sia stato raggiunto il numero minimo di Gift Card previsto, il Promotore si riserva la facoltà di prorogare la durata dell\'operazione per un periodo massimo di sei mesi, dandone comunicazione con le stesse modalità di pubblicità del presente regolamento.',
          en: 'Participation is permitted from September 22, 2025 until 9:00 a.m. on December 22, 2025, when the sale of Gift Cards officially closes. The final drawing will take place on December 24, 2025 at 10:00 a.m., at the Promoter\'s headquarters. If, by the deadline, the minimum number of Gift Cards has not been reached, the Promoter reserves the right to extend the duration of the operation by up to six months, giving notice using the same publicity methods as these rules.'
        }
      },
      {
        title: { it: 'Art. 5 – Modalità di partecipazione', en: 'Art. 5 – How to Participate' },
        content: {
          it: '5.1. L\'acquisto di una Gift Card DR7 al prezzo di €20,00 attribuisce automaticamente: un credito immediato di €25,00, utilizzabile per i servizi DR7 (noleggi, luxury wash, experience, ecc.); un diritto di partecipazione all\'estrazione finale dei premi in palio. 5.2. Pertanto, tutti i partecipanti vincono subito €5 di credito extra, che si aggiunge al valore della Gift Card acquistata. 5.3. Le Gift Card non sono cumulabili tra loro; ciascuna va utilizzata singolarmente secondo le condizioni DR7. 5.4. La Gift Card non è convertibile in denaro contante, è cedibile a terzi ed ha validità 24 mesi dalla data di emissione.',
          en: '5.1. Purchasing a DR7 Gift Card for €20.00 automatically grants: immediate €25.00 credit, usable for DR7 services (rentals, luxury wash, experiences, etc.); the right to participate in the final prize drawing. 5.2. Therefore, all participants immediately receive €5 of extra credit, in addition to the Gift Card\'s value. 5.3. Gift Cards cannot be combined with each other; each must be used individually in accordance with DR7 conditions. 5.4. The Gift Card is not redeemable for cash, is transferable to third parties, and is valid for 24 months from the date of issue.'
        }
      },
      {
        title: { it: 'Art. 6 – Estrazione e comunicazioni', en: 'Art. 6 – Drawing and Communications' },
        content: {
          it: '6.1. L\'estrazione si terrà il 24 dicembre 2025 alle ore 10:00, presso la sede legale del Promotore, alla presenza di un Notaio o di un Funzionario della Camera di Commercio, che garantirà la regolarità delle operazioni e redigerà apposito verbale. 6.2. L\'estrazione sarà trasmessa in diretta streaming sui canali social ufficiali DR7, sul sito istituzionale [www.dr7empire.com] e in diretta televisiva tramite emittente che verrà comunicata successivamente. 6.3. I vincitori saranno avvisati personalmente entro 10 giorni lavorativi dall\'estrazione, mediante e-mail, SMS o telefonata ai recapiti indicati. 6.4. Per confermare l\'accettazione del premio, il vincitore dovrà rispondere alla comunicazione entro 7 giorni dalla ricezione. In caso contrario, il premio sarà assegnato al nominativo di riserva.',
          en: '6.1. The drawing will be held on December 24, 2025 at 10:00 a.m., at the Promoter\'s registered office, in the presence of a Notary or a Chamber of Commerce Officer, who will ensure the regularity of operations and draft an official report. 6.2. The drawing will be live-streamed on DR7\'s official social channels, on the official website www.dr7empire.com, and broadcast on a TV station to be announced later. 6.3. Winners will be notified personally within 10 business days of the drawing, by email, SMS, or phone call using the contact details provided. 6.4. To confirm acceptance of the prize, the winner must respond within 7 days of receiving the communication. Otherwise, the prize will be awarded to the alternate.'
        }
      },
      {
        title: { it: 'Art. 7 – Premi', en: 'Art. 7 – Prizes' },
        content: {
          it: '(lista completa premi e condizioni di consegna, come da versione precedente – invariata)',
          en: '(complete prize list and delivery conditions as previously published – unchanged)'
        }
      },
      {
        title: { it: 'Art. 8 – Consegna dei premi', en: 'Art. 8 – Delivery of Prizes' },
        content: {
          it: 'I premi saranno consegnati ai vincitori entro un termine massimo di 30 giorni lavorativi dalla data dell\'estrazione. La consegna avverrà senza alcun onere a carico dei vincitori, salvo quanto previsto per le Fiat Panda, le Fiat 500, gli scooter e i motocicli, per i quali restano a carico del vincitore le spese di bollo, assicurazione, immatricolazione e circolazione.',
          en: 'Prizes will be delivered to winners within 30 business days from the drawing date. Delivery will take place at no cost to the winners, except for Fiat Panda, Fiat 500, scooters and motorbikes, for which road tax, insurance, registration and circulation costs remain payable by the winner.'
        }
      },
      {
        title: { it: 'Art. 9 – Premi non assegnati e beneficenza', en: 'Art. 9 – Unawarded Prizes and Charity' },
        content: {
          it: 'I premi non richiesti o non assegnati saranno devoluti a UNICEF Italia Onlus/ETS.',
          en: 'Prizes not requested or not awarded will be donated to UNICEF Italia Onlus/ETS.'
        }
      },
      {
        title: { it: 'Art. 9-bis – Donazione benefica', en: 'Art. 9-bis – Charitable Donation' },
        content: {
          it: 'Il Promotore si impegna a devolvere in beneficenza una somma pari al 5% dei ricavi complessivi derivanti dalla vendita delle Gift Card DR7 legate alla presente operazione promozionale. La donazione sarà destinata a UNICEF Italia Onlus/ETS o ad altra organizzazione non lucrativa di utilità sociale operante in ambito umanitario. Il versamento sarà effettuato entro 60 giorni dalla chiusura dell\'operazione e sarà rendicontato pubblicamente dal Promotore sui propri canali ufficiali.',
          en: 'The Promoter undertakes to donate 5% of total revenues from the sale of DR7 Gift Cards linked to this promotional operation. The donation will be made to UNICEF Italia Onlus/ETS or another non-profit organization of social utility operating in the humanitarian field. Payment will be made within 60 days of the operation\'s close and will be publicly reported by the Promoter on its official channels.'
        }
      },
      {
        title: { it: 'Art. 10 – Pubblicità', en: 'Art. 10 – Publicity' },
        content: {
          it: 'L\'operazione sarà pubblicizzata attraverso il sito istituzionale DR7, i canali social ufficiali e ulteriori mezzi di comunicazione. Il regolamento integrale sarà sempre disponibile sul sito ufficiale [www.dr7empire.com].',
          en: 'The operation will be publicized through the DR7 official website, official social channels, and additional communication media. The full rules will always be available on the official website www.dr7empire.com.'
        }
      },
      {
        title: { it: 'Art. 11 – Privacy', en: 'Art. 11 – Privacy' },
        content: {
          it: 'Il trattamento dei dati personali dei partecipanti avverrà in conformità al Regolamento UE 2016/679 (GDPR) e, per i partecipanti internazionali, in conformità alle normative locali applicabili. Titolare del trattamento è Dubai Rent 7.0 S.p.A. – DR7. Per ogni informazione o esercizio dei diritti, i partecipanti possono scrivere a: goldenwin@dr7empire.com oppure alla PEC dubai.rent7.0srl-legalmail.it. L\'informativa completa è consultabile sul sito ufficiale.',
          en: 'Participants\' personal data will be processed in accordance with EU Regulation 2016/679 (GDPR) and, for international participants, in accordance with applicable local regulations. The data controller is Dubai Rent 7.0 S.p.A. – DR7. For any information or to exercise rights, participants may write to: goldenwin@dr7empire.com or to the PEC dubai.rent7.0srl-legalmail.it. The complete privacy notice is available on the official website.'
        }
      },
      {
        title: { it: 'Art. 12 – Disposizioni finali', en: 'Art. 12 – Final Provisions' },
        content: {
          it: '• I premi non sono convertibili in denaro né sostituibili con altri beni o servizi. • Il Promotore si riserva, per sopravvenute esigenze non dipendenti dalla propria volontà, di sostituire uno o più premi con altri di valore uguale o superiore, previa comunicazione. • La partecipazione all\'operazione promozionale implica l\'accettazione integrale del presente regolamento. • L\'operazione è valida in tutto il mondo, ove non vietata dalla legge locale del partecipante. • Clausola anti-contestazioni: Il Promotore non è responsabile per disservizi tecnici, interruzioni di rete, blackout, malfunzionamenti di piattaforme social o cause di forza maggiore che possano impedire la partecipazione, la comunicazione o la visione della diretta.',
          en: 'Prizes are not redeemable for cash and not replaceable with other goods or services. For needs not dependent on its will, the Promoter may replace one or more prizes with others of equal or greater value, with prior notice. Participation implies full acceptance of these rules. The operation is valid worldwide, where not prohibited by the participant\'s local law. Anti-dispute clause: The Promoter is not responsible for technical issues, network interruptions, blackouts, social platform malfunctions, or force majeure that may prevent participation, communication, or viewing of the live stream.'
        }
      },
      {
        title: { it: 'Nota di trasparenza finale', en: 'Final Transparency Note' },
        content: {
          it: 'Il presente regolamento è consultabile in versione integrale sul sito ufficiale www.dr7empire.com ed è valido dal 22 settembre 2025 fino alla conclusione dell\'operazione promozionale, come sopra disciplinata.',
          en: 'These official rules can be consulted in full on www.dr7empire.com and are valid from September 22, 2025 until the conclusion of the promotional operation, as governed above.'
        }
      }
    ]
  };

  // Function to format content with line breaks and bullet points
  const formatContent = (content) => {
    return content
      .replace(/•/g, '<br/>•')
      .replace(/\n/g, '<br />')
      .replace(/(\d+\.\d+\.)/g, '<br/><strong>$1</strong>');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-black text-white min-h-screen"
    >
      {/* Language Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setLanguage(language === 'en' ? 'it' : 'en')}
          className="bg-yellow-400 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-300 transition"
        >
          {language === 'en' ? 'IT 🇮🇹' : 'EN 🇬🇧'}
        </button>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-24 sm:py-32">
        <div className="max-w-4xl mx-auto">
          {/* Back to Rules Button */}
          <div className="mb-8">
            <button 
              onClick={() => alert('Navigate to /lottery-rules - Connect this to your router')}
              className="px-6 py-2 text-sm sm:text-base rounded-full border transition-colors bg-black/60 border-white/60 text-white hover:border-white hover:bg-black/80 font-medium inline-flex items-center"
            >
              <span className="mr-2">←</span>
              <span>{t({ it: 'Torna al regolamento', en: 'Back to Rules' })}</span>
            </button>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-center mb-12">
            {t(rules.title)}
          </h1>
          
          <div className="space-y-8">
            {rules.sections.map((section, index) => (
              <section key={index} className="bg-gray-900 bg-opacity-50 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 border-b border-gray-700 pb-2">
                  {t(section.title)}
                </h2>
                <div 
                  className="text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: formatContent(t(section.content))
                  }} 
                />
              </section>
            ))}
          </div>

          {/* Footer with website link */}
          <div className="mt-12 text-center">
            <p className="text-gray-400">
              {t({ it: 'Per maggiori informazioni:', en: 'For more information:' })}
            </p>
            <a 
              href="https://www.dr7empire.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold"
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
