import React from 'react';
import { motion } from 'framer-motion';

// I'll create a simple language selector that works with your data structure
const LotteryRulesPage = () => {
  // You can get this from your translation context/hook
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
      it: 'Concorso a Premi "DR7 Luxury Empire – Golden Win"',
      en: 'Prize Contest "DR7 Luxury Empire – Golden Win"',
    },
    general: {
      title: { it: '📌 Caratteristiche generali', en: '📌 General Features' },
      items: [
        { label: { it: 'Nome concorso:', en: 'Contest name:' }, value: { it: 'DR7 Luxury Empire – Golden Win', en: 'DR7 Luxury Empire – Golden Win' } },
        { label: { it: 'Data estrazione:', en: 'Drawing date:' }, value: { it: '24 dicembre 2025', en: 'December 24, 2025' } },
        { label: { it: 'Modalità estrazione:', en: 'Drawing method:' }, value: { it: 'alla presenza di un avvocato e di un incaricato della Camera di Commercio, per garantire trasparenza e legalità.', en: 'in the presence of a lawyer and a Chamber of Commerce representative to ensure transparency and legality.' } },
        { label: { it: 'Costo partecipazione:', en: 'Participation cost:' }, value: { it: '20 €', en: '€20' } },
        { label: { it: 'Forma del biglietto:', en: 'Ticket format:' }, value: { it: 'ogni biglietto corrisponde a una Gift Card DR7 da 25 €, spendibile nei servizi DR7.', en: 'each ticket corresponds to a DR7 Gift Card worth €25, redeemable on DR7 services.' } },
        { value: { it: '👉 Non si acquista un semplice biglietto, ma un credito utilizzabile.', en: '👉 You\'re not buying a simple ticket, but usable credit.' } },
      ],
    },
    probability: {
      title: { it: '🎯 Probabilità di vincita', en: '🎯 Winning Odds' },
      items: [
        { label: { it: 'Totale biglietti emessi:', en: 'Total tickets issued:' }, value: { it: '350.000', en: '350,000' } },
        { label: { it: 'Totale premi:', en: 'Total prizes:' }, value: { it: '3.300', en: '3,300' } },
        { label: { it: 'Probabilità vincita:', en: 'Chance of winning:' }, value: { it: '1 biglietto su 106 è vincente (1%)', en: '1 winning ticket out of 106 (~1%)' } },
      ],
    },
    prizes: {
      title: { it: '💎 Premi in palio', en: '💎 Prizes Up for Grabs' },
      sections: [
        {
          title: { it: '🚗 Auto & Veicoli di Lusso', en: '🚗 Luxury Cars & Vehicles' },
          note: { it: '(tutti i veicoli vengono consegnati con: bollo e superbollo pagati, passaggio di proprietà incluso, assicurazione full casco, rca e spese di circolazione totalmente comprese – il vincitore non deve sostenere alcun costo aggiuntivo)', en: '(all vehicles are delivered with road tax and luxury tax paid, ownership transfer included, full comprehensive insurance, liability insurance, and all circulation expenses fully covered—the winner pays nothing extra)' },
          items: [
            { it: 'RS3 verde', en: 'RS3 (green)' },
            { it: 'Classe A45s', en: 'Classe A45s' },
            { it: 'BMW M3 competition', en: 'BMW M3 Competition' },
            { it: 'RS3 rossa', en: 'RS3 (red)' },
            { it: 'BMW M4 Competition', en: 'BMW M4 Competition' },
            { it: 'Porsche macan GTS', en: 'Porsche Macan GTS' },
            { it: 'Porsche Carrera 992 4s', en: 'Porsche Carrera 992 4S' },
            { it: 'Mercedes GLE53', en: 'Mercedes GLE53' },
            { it: 'Mercedes GLE63', en: 'Mercedes GLE63' },
            { it: 'Mercedes C63 S E PERFORMANCE', en: 'Mercedes C63 S E PERFORMANCE' },
            { it: 'Audi RSQ3', en: 'Audi RSQ3' },
            { it: 'Porsche Cayenne S', en: 'Porsche Cayenne S' },
            { it: 'Mercedes CLA 45S', en: 'Mercedes CLA 45S' },
            { it: 'Toyota CH-R', en: 'Toyota CH-R' },
            { it: 'Lamborghini Urus S PERFORMANTE', en: 'Lamborghini Urus S PERFORMANTE' },
            { it: 'Toyota RAV GR 360cv', en: 'Toyota RAV GR 360 hp' },
            { it: 'Lexus 450', en: 'Lexus 450' },
            { it: 'Lexus 350', en: 'Lexus 350' },
            { it: 'Gle 350', en: 'GLE 350' },
            { it: 'Hummer', en: 'Hummer' },
            { it: 'Yacht', en: 'Yacht' },
          ],
        },
        {
          title: { it: '📱🛵 Premi di Massa', en: '📱🛵 Mass Prizes' },
          note: { it: '(anche scooter, moto, Panda e 500 vengono consegnati con passaggio di proprietà incluso e tutte le spese di circolazione coperte)', en: '(scooters, motorbikes, Panda and 500 are also delivered with ownership transfer included and all circulation costs covered)' },
          items: [
            { it: '700 iPhone 17', en: '700 iPhone 17' },
            { it: '100 borse donna louis vitton', en: '100 women\'s Louis Vuitton bags' },
            { it: '50 Honda SH 125', en: '50 Honda SH 125' },
            { it: '50 Yamaha TMAX 2025', en: '50 Yamaha TMAX 2025' },
            { it: '10 crociere per 2 persone (7 giorni, Isole Greche)', en: '10 cruises for 2 people (7 days, Greek Islands)' },
            { it: '10 Fiat Panda', en: '10 Fiat Panda' },
            { it: '10 Fiat 500', en: '10 Fiat 500' },
            { it: '20 Rolex', en: '20 Rolex watches' },
          ],
        },
        {
          title: { it: '🎁 Gift & Bonus', en: '🎁 Gift & Bonus' },
          items: [
            { it: '1.500 ticket DR7 da 500 €', en: '1,500 DR7 tickets worth €500 each' },
            { it: '692 buoni benzina da 300 €', en: '692 fuel vouchers worth €300 each' },
            { it: '110 gift card Amazon da 1.800 €', en: '110 Amazon gift cards worth €1,800 each' },
          ],
        },
        {
          title: { it: '🛥️🛩️ Esperienze Esclusive', en: '🛥️🛩️ Exclusive Experiences' },
          items: [
            { it: '10 giri in elicottero per 2 persone', en: '10 helicopter rides for 2 people' },
            { it: '7 giorni in villa di lusso per 10 persone', en: '7 days in a luxury villa for 10 people' },
            { it: '10 pacchetti "DR7 Ultimate Experience"', en: '10 "DR7 Ultimate Experience" packages' },
          ],
          experience: {
            title: { it: 'Descrizione DR7 Ultimate Experience:', en: 'DR7 Ultimate Experience description:' },
            subtitle: { it: 'Un weekend di lusso totale, riservato solo a pochi eletti:', en: 'A weekend of total luxury, reserved for a select few:' },
            features: [
              { it: 'Volo A/R in jet privato dal tuo Paese direttamente in Sardegna.', en: 'Round-trip private jet flight from your country directly to Sardinia.' },
              { it: 'Villa con piscina di lusso a disposizione per 2 giorni.', en: 'Luxury villa with pool at your disposal for 2 days.' },
              { it: 'Supercar di prestigio per vivere la strada da protagonista.', en: 'Prestige supercar to live the road like a star.' },
              { it: 'Giro in elicottero panoramico sopra le coste più belle.', en: 'Panoramic helicopter tour over the most beautiful coasts.' },
              { it: 'Yacht privato per una giornata in mare.', en: 'Private yacht for a full day at sea.' },
              { it: 'Servizi esclusivi H24: NCC privato, chef dedicato, massaggiatori privati, staff di assistenza.', en: 'Exclusive 24/7 services: private chauffeur (NCC), dedicated chef, private masseurs, support staff.' },
            ],
            tagline: { it: 'Due giorni che valgono una vita: il lusso non si racconta, si vive.', en: 'Two days worth a lifetime: luxury isn\'t told, it\'s lived.' },
          },
        },
      ],
    },
    summary: {
      title: { it: '📊 Riepilogo finale', en: '📊 Final Summary' },
      items: [
        { label: { it: 'Totale premi:', en: 'Total prizes:' }, value: { it: '3.300', en: '3,300' } },
        { label: { it: 'Probabilità vincita:', en: 'Winning odds:' }, value: { it: '1 biglietto vincente ogni 106', en: '1 winning ticket out of 106' } },
        { label: { it: 'Costo ticket:', en: 'Ticket price:' }, value: { it: '20 € (e 5€ li vinci subito sotto forma di Gift Card DR7 spendibile da 25€)', en: '€20 (and you immediately receive value as a DR7 Gift Card worth €25)' } },
        { label: { it: 'Estrazione:', en: 'Drawing:' }, value: { it: '24 dicembre 2025', en: 'December 24, 2025' } },
      ],
    },
    distribution: {
      title: { it: '🏆 Distribuzione ufficiale Concorso DR7 (senza prezzi)', en: '🏆 Official Distribution — DR7 Contest (without prices)' },
      sections: [
        {
          title: { it: 'Top veicoli (singoli)', en: 'Top Vehicles (individual)' },
          items: [
            { it: '1. Lamborghini Urus S Performante', en: '1. Lamborghini Urus S Performante' },
            { it: '2. Porsche Carrera 992 4S', en: '2. Porsche Carrera 992 4S' },
            { it: '3. Mercedes GLE63', en: '3. Mercedes GLE63' },
            { it: '4. Yacht (veicolo)', en: '4. Yacht (vehicle)' },
            { it: '5. Mercedes C63 S E PERFORMANCE', en: '5. Mercedes C63 S E PERFORMANCE' },
            { it: '6. Porsche Macan GTS', en: '6. Porsche Macan GTS' },
            { it: '7. BMW M4 Competition', en: '7. BMW M4 Competition' },
            { it: '8. Porsche Cayenne S', en: '8. Porsche Cayenne S' },
            { it: '9. Lexus 450', en: '9. Lexus 450' },
            { it: '10. BMW M3 Competition', en: '10. BMW M3 Competition' },
            { it: '11. Toyota RAV GR 360 cv', en: '11. Toyota RAV GR 360 hp' },
            { it: '12. Mercedes CLA 45S', en: '12. Mercedes CLA 45S' },
            { it: '13. Audi RSQ3', en: '13. Audi RSQ3' },
            { it: '14. RS3 verde', en: '14. RS3 (green)' },
            { it: '15. RS3 rossa', en: '15. RS3 (red)' },
            { it: '16. Mercedes GLE53', en: '16. Mercedes GLE53' },
            { it: '17. Classe A45S', en: '17. Classe A45S' },
            { it: '18. Mercedes GLE 350', en: '18. Mercedes GLE 350' },
            { it: '19. Lexus 350', en: '19. Lexus 350' },
            { it: '20. Toyota CH-R', en: '20. Toyota CH-R' },
          ],
        },
        {
          title: { it: 'Esperienze premium', en: 'Premium Experiences' },
          items: [
            { it: '21–30. DR7 Ultimate Experience (10 premi)', en: '21–30. DR7 Ultimate Experience (10 prizes)' },
          ],
        },
        {
          title: { it: 'Veicolo fascia alta', en: 'High-Tier Vehicle' },
          items: [
            { it: '31. Hummer', en: '31. Hummer' },
          ],
        },
        {
          title: { it: 'Fascia intermedia', en: 'Mid Tier' },
          items: [
            { it: '32–81. Yamaha TMAX 2025 (50 premi)', en: '32–81. Yamaha TMAX 2025 (50 prizes)' },
            { it: '82–101. Rolex (20 premi)', en: '82–101. Rolex (20 prizes)' },
            { it: '102–111. Fiat Panda (10 premi)', en: '102–111. Fiat Panda (10 prizes)' },
            { it: '112–121. Fiat 500 (10 premi)', en: '112–121. Fiat 500 (10 prizes)' },
          ],
        },
        {
          title: { it: 'Esperienze & fascia media', en: 'Experiences & Mid Tier' },
          items: [
            { it: '122. 7 giorni in villa di lusso per 10 persone (1 premio)', en: '122. 7 days in a luxury villa for 10 people (1 prize)' },
            { it: '123–172. Honda SH 125 (50 premi)', en: '123–172. Honda SH 125 (50 prizes)' },
            { it: '173–182. Crociere 7 gg per 2 persone (10 premi)', en: '173–182. 7-day cruises for 2 people (10 prizes)' },
            { it: '183–282. Borse donna Louis Vuitton (100 premi)', en: '183–282. Louis Vuitton women\'s handbags (100 prizes)' },
            { it: '283–292. Giri in elicottero per 2 persone (10 premi)', en: '283–292. Helicopter rides for 2 people (10 prizes)' },
          ],
        },
        {
          title: { it: 'Gift & Massa', en: 'Gift & Mass' },
          items: [
            { it: '293–402. Gift Card Amazon (110 premi)', en: '293–402. Amazon Gift Cards (110 prizes)' },
            { it: '403–1102. iPhone 17 (700 premi)', en: '403–1102. iPhone 17 (700 prizes)' },
            { it: '1103–2602. Ticket DR7 (1.500 premi)', en: '1103–2602. DR7 Tickets (1,500 prizes)' },
            { it: '2603–3300. Buoni benzina (698 premi)', en: '2603–3300. Fuel vouchers (698 prizes)' },
          ],
        },
        {
          title: { it: '✅ Totale', en: '✅ Total' },
          items: [
            { it: 'Posizioni assegnate: 1–3300', en: 'Positions assigned: 1–3300' },
            { it: 'Totale premi: 3.300', en: 'Total prizes: 3,300' },
          ],
        },
      ],
    },
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
        <h1 className="text-4xl sm:text-5xl font-bold text-center mb-12">
          {t(rules.title)}
        </h1>

        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center">
              <Link to="/legal-terms" className="inline-block py-3 sm:py-4 px-8 bg-white text-black rounded-full font-bold uppercase tracking-wider text-sm sm:text-base hover:bg-gray-200 transition-all duration-300 transform hover:scale-105">
                  {t({ it: "Consulta i Termini Legali", en: "View Legal Terms" })}
              </Link>
          </div>
          <section>
            <h2 className="text-3xl font-semibold mb-6 border-b border-gray-700 pb-3">
              {t(rules.general.title)}
            </h2>
            <ul className="space-y-4 text-lg text-gray-300">
              {rules.general.items.map((item, index) => (
                <li key={index} className={item.label ? '' : 'pl-4 border-l-2 border-yellow-400'}>
                  {item.label && <strong>{t(item.label)}</strong>} {item.value && t(item.value)}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-6 border-b border-gray-700 pb-3">
              {t(rules.probability.title)}
            </h2>
            <ul className="space-y-4 text-lg text-gray-300">
              {rules.probability.items.map((item, index) => (
                <li key={index}>
                  <strong>{t(item.label)}</strong> {t(item.value)}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-6 border-b border-gray-700 pb-3">
              {t(rules.prizes.title)}
            </h2>
            <div className="space-y-8">
              {rules.prizes.sections.map((section, index) => (
                <div key={index}>
                  <h3 className="text-2xl font-semibold mb-4">{t(section.title)}</h3>
                  {section.note && <p className="text-gray-400 mb-4">{t(section.note)}</p>}
                  <ul className="list-disc list-inside space-y-2 text-lg text-gray-300">
                    {section.items.map((item, i) => (
                      <li key={i}>{t(item)}</li>
                    ))}
                  </ul>
                  {section.experience && (
                    <div className="mt-6 p-6 bg-gray-900 rounded-lg">
                      <h4 className="text-xl font-bold mb-2">{t(section.experience.title)}</h4>
                      <p className="text-gray-400 mb-4">{t(section.experience.subtitle)}</p>
                      <ul className="list-disc list-inside space-y-2 text-lg text-gray-300">
                        {section.experience.features.map((feature, i) => (
                          <li key={i}>{t(feature)}</li>
                        ))}
                      </ul>
                      <p className="mt-4 text-yellow-400 italic">{t(section.experience.tagline)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-6 border-b border-gray-700 pb-3">
              {t(rules.summary.title)}
            </h2>
            <ul className="space-y-4 text-lg text-gray-300">
              {rules.summary.items.map((item, index) => (
                <li key={index}>
                  <strong>{t(item.label)}</strong> {t(item.value)}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-semibold mb-6 border-b border-gray-700 pb-3">
              {t(rules.distribution.title)}
            </h2>
            <div className="space-y-8 text-lg text-gray-300">
              {rules.distribution.sections.map((section, index) => (
                <div key={index}>
                  <h3 className="text-2xl font-semibold mb-4">{t(section.title)}</h3>
                  <ul className={section.items.length > 1 && section.items[0][language].includes('1.') ? 'list-decimal list-inside space-y-2' : 'list-none space-y-2'}>
                    {section.items.map((item, i) => (
                      <li key={i}>{t(item)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

export default LotteryRulesPage;
