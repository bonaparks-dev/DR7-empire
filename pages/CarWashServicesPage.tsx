import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

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

// Fallback hardcoded services in case database is unavailable
const FALLBACK_SERVICES: Service[] = [
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
    duration: '3 ore',
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
    duration: '4 ore',
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

// Export for backward compatibility
export const SERVICES = FALLBACK_SERVICES;

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

export { ADDITIONAL_SERVICES };
export type { Service };

const CarWashServicesPage: React.FC = () => {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>(FALLBACK_SERVICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const { data, error } = await supabase
        .from('car_wash_services')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Failed to load car wash services from database:', error);
        // Use fallback services
        setServices(FALLBACK_SERVICES);
      } else if (data && data.length > 0) {
        // Map database format to component format
        const mappedServices: Service[] = data.map((service: any) => ({
          id: service.id,
          name: service.name,
          nameEn: service.name_en,
          price: service.price,
          duration: service.duration,
          features: service.features,
          featuresEn: service.features_en,
          description: service.description,
          descriptionEn: service.description_en
        }));
        setServices(mappedServices);
      } else {
        // No services in database, use fallback
        setServices(FALLBACK_SERVICES);
      }
    } catch (err) {
      console.error('Error loading services:', err);
      setServices(FALLBACK_SERVICES);
    } finally {
      setLoading(false);
    }
  }

  const handleBookService = (serviceId: string) => {
    navigate('/car-wash-booking', { state: { serviceId } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-32 pb-16 flex items-center justify-center">
        <div className="text-white text-xl">Caricamento servizi...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-32 pb-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {services.map((service, index) => (
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

      {/* Booking Rules and Hours Section */}
      <div className="bg-gray-900/50 py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            🧼 DR7 LUXURY WASH – ORARI E TIPOLOGIE DI LAVAGGIO
          </h2>

          <div className="space-y-6 text-gray-300">
            <div className="bg-black/30 p-6 rounded-lg border border-gray-800">
              <p className="mb-4">Gli orari di lavaggio sono suddivisi in due fasce giornaliere:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Mattina:</strong> dalle 9:00 alle 12:00</li>
                <li><strong className="text-white">Pomeriggio:</strong> dalle 15:00 alle 18:00</li>
              </ul>
              <p className="mt-4 text-sm">
                Ogni tipologia di lavaggio ha una durata proporzionata al livello di trattamento scelto. Il riferimento è di circa <strong className="text-white">25 euro per ogni ora di lavorazione</strong>, in base alla complessità e ai dettagli richiesti.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-4">Tipologie di lavaggio</h3>
              <div className="space-y-4">
                <div className="bg-black/30 p-5 rounded-lg border border-gray-700">
                  <h4 className="text-white font-bold mb-2">• Lavaggio da 25 euro</h4>
                  <p className="text-sm mb-2"><strong className="text-white">Durata:</strong> 1 ora.</p>
                  <p className="text-sm">Si può prenotare in vari orari della fascia mattutina o pomeridiana. Al mattino: dalle 9:00 fino alle 12:00. Al pomeriggio: dalle 15:00 fino alle 18:00.</p>
                </div>

                <div className="bg-black/30 p-5 rounded-lg border border-gray-700">
                  <h4 className="text-white font-bold mb-2">• Lavaggio da 49 euro</h4>
                  <p className="text-sm mb-2"><strong className="text-white">Durata:</strong> 2 ore.</p>
                  <p className="text-sm">Si può prenotare al mattino alle 9:00, 9:30, 10:00, 10:30 o 11:00, e al pomeriggio alle 15:00, 15:30, 16:00, 16:30 o 17:00.</p>
                </div>

                <div className="bg-black/30 p-5 rounded-lg border border-gray-700">
                  <h4 className="text-white font-bold mb-2">• Lavaggio da 75 euro</h4>
                  <p className="text-sm mb-2"><strong className="text-white">Durata:</strong> 3 ore.</p>
                  <p className="text-sm">Essendo un lavaggio approfondito, va prenotato in modo che ci sia il tempo necessario per completarlo. Al mattino è possibile prenotarlo alle 9:00, 9:30 o 10:00. Al pomeriggio alle 15:00, 15:30 o 16:00.</p>
                </div>

                <div className="bg-black/30 p-5 rounded-lg border border-gray-700">
                  <h4 className="text-white font-bold mb-2">• Lavaggio da 99 euro</h4>
                  <p className="text-sm mb-2"><strong className="text-white">Durata:</strong> 4 ore.</p>
                  <p className="text-sm">È il lavaggio più completo e richiede un'intera fascia di lavoro continuativa. Può essere prenotato solo alle 9:00 del mattino (durata 9–13) oppure alle 15:00 del pomeriggio (durata 15–19).</p>
                </div>
              </div>
            </div>

            <div className="bg-black/30 p-6 rounded-lg border border-gray-800">
              <h3 className="text-xl font-bold text-white mb-4">📋 Regole e consigli utili</h3>
              <ul className="space-y-3 text-sm">
                <li>• Ogni prenotazione è calcolata in base alla durata effettiva del trattamento scelto.</li>
                <li>• I lavaggi da 75€ e 100€ devono iniziare tassativamente all'inizio della fascia, per permettere il completamento del servizio.</li>
                <li>• I lavaggi da 25€ e 50€ sono più flessibili e possono essere prenotati anche a orari intermedi.</li>
                <li>• È richiesto di arrivare almeno <strong className="text-white">10 minuti prima</strong> dell'orario prenotato, per consentire una corretta gestione dei tempi.</li>
                <li>• Il servizio <strong className="text-white">non è disponibile la domenica</strong>.</li>
                <li>• Gli orari vengono bloccati automaticamente: se un cliente prenota un lavaggio, gli orari occupati non saranno disponibili per altri.</li>
              </ul>
            </div>
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
