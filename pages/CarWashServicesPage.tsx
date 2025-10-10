import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';

interface Service {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  duration: string;
  features: string[];
  featuresEn: string[];
  description: string;
  descriptionEn: string;
}

const SERVICES: Service[] = [
  {
    id: 'full-clean',
    name: 'LAVAGGIO COMPLETO',
    nameEn: 'FULL CLEAN',
    price: 25,
    duration: '30-45 min',
    description: 'Rapido e completo, per un\'auto pulita ogni giorno.',
    descriptionEn: 'Quick and complete, for a clean car every day.',
    features: [
      'Esterni + interni completi',
      'Schiuma colorata profumata',
      'Pulizia cerchi, passaruota, vetri',
      'Aspirazione interni'
    ],
    featuresEn: [
      'Complete exterior + interior',
      'Scented colored foam',
      'Wheel, wheel arch, glass cleaning',
      'Interior vacuuming'
    ]
  },
  {
    id: 'top-shine',
    name: 'LAVAGGIO TOP',
    nameEn: 'TOP SHINE',
    price: 49,
    duration: '1-1.5 ore',
    description: 'Più brillantezza e protezione, con cura extra dei dettagli.',
    descriptionEn: 'More shine and protection, with extra detail care.',
    features: [
      'Tutto quello del Full Clean',
      'Trattamento lucidante veloce (crema protettiva carrozzeria)',
      'Dettaglio extra di plastiche interne e bocchette',
      'Acqua DR7 luxury inclusa'
    ],
    featuresEn: [
      'Everything from Full Clean',
      'Fast polish treatment (protective cream)',
      'Extra detail on interior plastics',
      'DR7 luxury water included'
    ]
  },
  {
    id: 'vip',
    name: 'LAVAGGIO VIP',
    nameEn: 'VIP EXPERIENCE',
    price: 75,
    duration: '2-3 ore',
    description: 'Il pacchetto che ti fa ritirare l\'auto "come nuova".',
    descriptionEn: 'The package that makes your car look "like new".',
    features: [
      'Tutto quello del Top Shine',
      'Decontaminazione carrozzeria (sporco ostinato, catrame, ferro)',
      'Pulizia e igienizzazione sedili (pelle)',
      'Sanificazione abitacolo all\'azoto',
      'Sigillante premium su carrozzeria',
      'Profumo premium + omaggio esclusivo',
      'Acqua DR7 luxury inclusa'
    ],
    featuresEn: [
      'Everything from Top Shine',
      'Body decontamination (tar, iron)',
      'Seat cleaning & sanitization',
      'Nitrogen cabin sanitization',
      'Premium sealant on body',
      'Premium perfume + exclusive gift',
      'DR7 luxury water included'
    ]
  },
  {
    id: 'dr7-luxury',
    name: 'LAVAGGIO DR7 LUXURY',
    nameEn: 'DR7 LUXURY',
    price: 99,
    duration: '3-4 ore',
    description: 'L\'auto esce meglio di quando è uscita dalla concessionaria.',
    descriptionEn: 'Your car comes out better than when it left the dealership.',
    features: [
      'Tutto quello del VIP Experience',
      'Igienizzazione totale di ogni singolo dettaglio',
      'Pulizia e igienizzazione sedili (tessuto o pelle)',
      'Lavaggio completo moquette e tappetini',
      'Pulizia e trattamento del cielo (soffitto interno)',
      'Lavaggio accurato del motore con prodotti specifici',
      'Profumo premium in omaggio',
      'Acqua DR7 luxury inclusa'
    ],
    featuresEn: [
      'Everything from VIP Experience',
      'Total sanitization of every detail',
      'Complete seat cleaning (fabric/leather)',
      'Full carpet and mat washing',
      'Ceiling treatment',
      'Engine bay cleaning',
      'Premium perfume gift',
      'DR7 luxury water included'
    ]
  }
];

const ADDITIONAL_SERVICES = [
  {
    id: 'courtesy-car',
    name: 'Utilitaria di Cortesia',
    nameEn: 'Courtesy Car',
    subtitle: 'Perfetto per chi vuole sbrigare commissioni o non aspettare sul posto.',
    subtitleEn: 'Perfect for running errands while we work.',
    prices: [
      { duration: '1 ora', hours: 1, price: 15 },
      { duration: '2 ore', hours: 2, price: 25 },
      { duration: '3 ore', hours: 3, price: 35 }
    ]
  },
  {
    id: 'supercar',
    name: 'Supercar Experience',
    nameEn: 'Supercar Experience',
    subtitle: '',
    subtitleEn: '',
    prices: [
      { duration: '1 ora', hours: 1, price: 59 },
      { duration: '2 ore', hours: 2, price: 99 },
      { duration: '3 ore', hours: 3, price: 139 }
    ]
  },
  {
    id: 'lambo-ferrari',
    name: 'Lamborghini & Ferrari Experience',
    nameEn: 'Lamborghini & Ferrari Experience',
    subtitle: 'Guidi una delle nostre supercar mentre la tua auto viene rigenerata.',
    subtitleEn: 'Drive one of our supercars while your car is being regenerated.',
    prices: [
      { duration: '1 ora', hours: 1, price: 149 },
      { duration: '2 ore', hours: 2, price: 249 },
      { duration: '3 ore', hours: 3, price: 299 }
    ]
  }
];

export { SERVICES, ADDITIONAL_SERVICES };
export type { Service };

const CarWashServicesPage: React.FC = () => {
  const { lang } = useTranslation();
  const navigate = useNavigate();

  const handleBookService = (serviceId: string) => {
    navigate('/car-wash-booking', { state: { serviceId } });
  };

  return (
    <div className="min-h-screen bg-black pt-32 pb-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 hover:border-white transition-colors"
            >
              <h3 className="text-2xl font-bold text-white mb-2">
                {lang === 'it' ? service.name : service.nameEn}
              </h3>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-5xl font-bold text-white">€{service.price}</span>
                <span className="text-gray-400 text-sm">{service.duration}</span>
              </div>
              <p className="text-gray-400 text-sm italic mb-6">
                {lang === 'it' ? service.description : service.descriptionEn}
              </p>

              <div className="space-y-3 mb-8">
                {(lang === 'it' ? service.features : service.featuresEn).map((feature, idx) => (
                  <div key={idx} className="flex items-start">
                    <span className="text-white mr-3">•</span>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleBookService(service.id)}
                className="w-full bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-gray-200 transition-colors"
              >
                {lang === 'it' ? 'PRENOTA ORA' : 'BOOK NOW'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/30 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {lang === 'it' ? 'Servizio Aggiuntivo' : 'Additional Service'}
            </h2>
            <p className="text-xl text-white">
              {lang === 'it' ? 'Auto di Cortesia o Supercar Experience' : 'Courtesy Car or Supercar Experience'}
            </p>
            <p className="text-gray-400 mt-2">
              {lang === 'it' ? 'Metti solo la benzina e parti.' : 'Just fill the tank and go.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ADDITIONAL_SERVICES.map((service) => (
              <div
                key={service.id}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-white transition-colors"
              >
                <h3 className="text-xl font-bold text-white mb-3">
                  {lang === 'it' ? service.name : service.nameEn}
                </h3>
                {service.subtitle && (
                  <p className="text-gray-400 text-sm mb-4">
                    {lang === 'it' ? service.subtitle : service.subtitleEn}
                  </p>
                )}
                <div className="space-y-2">
                  {service.prices.map((price) => (
                    <div key={price.hours} className="flex justify-between items-center text-gray-300 border-b border-gray-800 pb-2">
                      <span className="text-sm">{price.duration}</span>
                      <span className="font-bold text-white">€{price.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            * {lang === 'it'
              ? 'Il prezzo del lavaggio standard è di €25. In caso di sporco particolarmente ostinato potrebbe essere richiesto un supplemento di €10-20. Comunicato sempre prima dell\'inizio del servizio.'
              : 'Standard wash price is €25. For particularly stubborn dirt, a supplement of €10-20 may be required. Always communicated before service begins.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CarWashServicesPage;
