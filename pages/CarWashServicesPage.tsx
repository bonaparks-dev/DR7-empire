import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';

interface Service {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  duration: string | number;
  features?: string[];
  featuresEn?: string[];
  description: string;
  descriptionEn: string;
  category?: string;
  isActive?: boolean;
  displayOrder?: number;
  image?: string;
}

interface MechanicalService {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  category: string;
  categoryEn: string;
  description: string;
  descriptionEn: string;
  duration: string;
  durationEn: string;
}

// Wash services
const FALLBACK_SERVICES: Service[] = [
  {
    id: 'scooter-wash',
    name: 'LAVAGGIO MOTO',
    nameEn: 'MOTORCYCLE WASH',
    price: 9.90,
    duration: '20 min',
    description: 'Lavaggio rapido ed efficace per la tua moto.',
    descriptionEn: 'Quick and effective wash for your motorcycle.',
    features: [
      'Lavaggio esterno completo',
      'Pulizia sella',
      'Pulizia cerchi e pneumatici',
      'Asciugatura'
    ],
    featuresEn: [
      'Complete exterior wash',
      'Seat cleaning',
      'Wheel and tire cleaning',
      'Drying'
    ],
    image: '/moto.jpeg'
  },
  {
    id: 'exterior-only',
    name: 'LAVAGGIO SOLO ESTERNO',
    nameEn: 'EXTERIOR ONLY',
    price: 14.90,
    duration: '15 min',
    description: 'Lavaggio esterno rapido per una carrozzeria brillante.',
    descriptionEn: 'Quick exterior wash for a shiny body.',
    features: [
      'Lavaggio carrozzeria completo',
      'Schiuma colorata profumata',
      'Pulizia cerchi e vetri esterni',
      'Asciugatura'
    ],
    featuresEn: [
      'Complete body wash',
      'Scented colored foam',
      'Wheel and exterior glass cleaning',
      'Drying'
    ],
    image: '/exterior.jpeg'
  },
  {
    id: 'interior-only',
    name: 'LAVAGGIO SOLO INTERNO',
    nameEn: 'INTERIOR ONLY',
    price: 19.90,
    duration: '30 min',
    description: 'Pulizia approfondita degli interni per un abitacolo fresco.',
    descriptionEn: 'Deep interior cleaning for a fresh cabin.',
    features: [
      'Aspirazione completa interni',
      'Pulizia cruscotto e consolle',
      'Pulizia vetri interni',
      'Pulizia sedili e tappetini'
    ],
    featuresEn: [
      'Complete interior vacuuming',
      'Dashboard and console cleaning',
      'Interior glass cleaning',
      'Seat and mat cleaning'
    ],
    image: '/interior.jpeg'
  },
  {
    id: 'full-clean',
    name: 'LAVAGGIO COMPLETO',
    nameEn: 'FULL CLEAN',
    price: 24.90,
    duration: '45 min',
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
    ],
    image: '/completo.jpeg'
  },
  {
    id: 'full-clean-2',
    name: 'LAVAGGIO FULL CLEAN N2',
    nameEn: 'FULL CLEAN N2',
    price: 34.90,
    duration: '1 ora',
    description: 'Lavaggio completo avanzato con trattamenti extra.',
    descriptionEn: 'Advanced full clean with extra treatments.',
    features: [],
    featuresEn: [],
    image: '/completo2.jpeg'
  },
  {
    id: 'top-shine',
    name: 'LAVAGGIO TOP',
    nameEn: 'TOP SHINE',
    price: 49,
    duration: '1-2 ore',
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
    ],
    image: '/top.jpeg'
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
    ],
    image: '/primevip.jpeg'
  },
  {
    id: 'dr7-luxury',
    name: 'LAVAGGIO DR7 LUXURY',
    nameEn: 'DR7 LUXURY',
    price: 119,
    duration: '2-3 ore',
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
    ],
    image: '/luxury.jpeg'
  }
];

// Mechanical services
const MECHANICAL_SERVICES: MechanicalService[] = [
  // Freni
  {
    id: 'brake-pads-front',
    name: 'Cambio Pastiglie Freni - Anteriori',
    nameEn: 'Brake Pads Replacement - Front',
    price: 29,
    category: 'Freni',
    categoryEn: 'Brakes',
    description: 'Sostituzione pastiglie freni anteriori',
    descriptionEn: 'Front brake pads replacement',
    duration: '30 minuti',
    durationEn: '30 minutes'
  },
  {
    id: 'brake-pads-rear',
    name: 'Cambio Pastiglie Freni - Posteriori',
    nameEn: 'Brake Pads Replacement - Rear',
    price: 29,
    category: 'Freni',
    categoryEn: 'Brakes',
    description: 'Sostituzione pastiglie freni posteriori',
    descriptionEn: 'Rear brake pads replacement',
    duration: '30 minuti',
    durationEn: '30 minutes'
  },
  {
    id: 'brake-pads-all',
    name: 'Cambio Pastiglie Freni - Anteriori + Posteriori',
    nameEn: 'Brake Pads Replacement - Front + Rear',
    price: 49,
    category: 'Freni',
    categoryEn: 'Brakes',
    description: 'Sostituzione completa pastiglie freni',
    descriptionEn: 'Complete brake pads replacement',
    duration: '1 ora',
    durationEn: '1 hour'
  },
  // Tagliando
  {
    id: 'service-city',
    name: 'Tagliando Rapido (Olio + Filtri) - City Car/Utilitarie',
    nameEn: 'Quick Service (Oil + Filters) - City Car/Small Cars',
    price: 39,
    category: 'Tagliando',
    categoryEn: 'Service',
    description: 'Cambio olio e filtri per city car',
    descriptionEn: 'Oil and filter change for city cars',
    duration: '30 minuti',
    durationEn: '30 minutes'
  },
  {
    id: 'service-sedan',
    name: 'Tagliando Rapido (Olio + Filtri) - Berlina/SUV',
    nameEn: 'Quick Service (Oil + Filters) - Sedan/SUV',
    price: 49,
    category: 'Tagliando',
    categoryEn: 'Service',
    description: 'Cambio olio e filtri per berlina/SUV',
    descriptionEn: 'Oil and filter change for sedan/SUV',
    duration: '45 minuti',
    durationEn: '45 minutes'
  },
  {
    id: 'service-luxury',
    name: 'Tagliando Rapido (Olio + Filtri) - Luxury/Sportive',
    nameEn: 'Quick Service (Oil + Filters) - Luxury/Sports',
    price: 59,
    category: 'Tagliando',
    categoryEn: 'Service',
    description: 'Cambio olio e filtri per auto luxury/sportive',
    descriptionEn: 'Oil and filter change for luxury/sports cars',
    duration: '1 ora',
    durationEn: '1 hour'
  },
  // Tergicristalli
  {
    id: 'wipers',
    name: 'Cambio Spazzole Tergicristalli (coppia)',
    nameEn: 'Wiper Blades Replacement (pair)',
    price: 19,
    category: 'Tergicristalli',
    categoryEn: 'Wipers',
    description: 'Sostituzione coppia spazzole tergicristalli',
    descriptionEn: 'Pair of wiper blades replacement',
    duration: '15 minuti',
    durationEn: '15 minutes'
  },
  // Batteria
  {
    id: 'battery-check',
    name: 'Controllo Batteria',
    nameEn: 'Battery Check',
    price: 9,
    category: 'Batteria',
    categoryEn: 'Battery',
    description: 'Test completo batteria',
    descriptionEn: 'Complete battery test',
    duration: '10 minuti',
    durationEn: '10 minutes'
  },
  {
    id: 'battery-small',
    name: 'Cambio Batteria - Auto Piccole/City Car',
    nameEn: 'Battery Replacement - Small/City Cars',
    price: 49,
    category: 'Batteria',
    categoryEn: 'Battery',
    description: 'Sostituzione batteria per city car',
    descriptionEn: 'Battery replacement for city cars',
    duration: '20 minuti',
    durationEn: '20 minutes'
  },
  {
    id: 'battery-medium',
    name: 'Cambio Batteria - Berline/SUV Medi',
    nameEn: 'Battery Replacement - Sedan/Medium SUV',
    price: 79,
    category: 'Batteria',
    categoryEn: 'Battery',
    description: 'Sostituzione batteria per berlina/SUV',
    descriptionEn: 'Battery replacement for sedan/SUV',
    duration: '30 minuti',
    durationEn: '30 minutes'
  },
  {
    id: 'battery-large',
    name: 'Cambio Batteria - SUV Grandi/Luxury',
    nameEn: 'Battery Replacement - Large SUV/Luxury',
    price: 99,
    category: 'Batteria',
    categoryEn: 'Battery',
    description: 'Sostituzione batteria per SUV grandi/luxury',
    descriptionEn: 'Battery replacement for large SUV/luxury',
    duration: '40 minuti',
    durationEn: '40 minutes'
  },
  // Lampadine
  {
    id: 'bulb-single',
    name: 'Cambio Lampadina (singola)',
    nameEn: 'Bulb Replacement (single)',
    price: 15,
    category: 'Lampadine',
    categoryEn: 'Bulbs',
    description: 'Sostituzione singola lampadina',
    descriptionEn: 'Single bulb replacement',
    duration: '15 minuti',
    durationEn: '15 minutes'
  },
  {
    id: 'bulb-kit',
    name: 'Kit Luci Completo (tutte le lampadine)',
    nameEn: 'Complete Light Kit (all bulbs)',
    price: 59,
    category: 'Lampadine',
    categoryEn: 'Bulbs',
    description: 'Sostituzione completa tutte lampadine',
    descriptionEn: 'Complete bulb replacement',
    duration: '1 ora',
    durationEn: '1 hour'
  },
  // Fari
  {
    id: 'headlight-polish-single',
    name: 'Lucidatura Fari Opachi - Singolo',
    nameEn: 'Headlight Polish - Single',
    price: 29,
    category: 'Fari',
    categoryEn: 'Headlights',
    description: 'Lucidatura singolo faro opacizzato',
    descriptionEn: 'Single headlight polishing',
    duration: '30 minuti',
    durationEn: '30 minutes'
  },
  {
    id: 'headlight-polish-pair',
    name: 'Lucidatura Fari Opachi - Coppia',
    nameEn: 'Headlight Polish - Pair',
    price: 49,
    category: 'Fari',
    categoryEn: 'Headlights',
    description: 'Lucidatura coppia fari opacizzati',
    descriptionEn: 'Pair of headlights polishing',
    duration: '1 ora',
    durationEn: '1 hour'
  },
  // Carrozzeria
  {
    id: 'body-polish-small',
    name: 'Lucidatura Carrozzeria - Piccola (Graffi Leggeri)',
    nameEn: 'Body Polish - Small (Light Scratches)',
    price: 39,
    category: 'Carrozzeria',
    categoryEn: 'Bodywork',
    description: 'Lucidatura graffi leggeri area piccola',
    descriptionEn: 'Light scratch polishing small area',
    duration: '1 ora',
    durationEn: '1 hour'
  },
  {
    id: 'body-polish-medium',
    name: 'Lucidatura Carrozzeria - Media (1 Pannello)',
    nameEn: 'Body Polish - Medium (1 Panel)',
    price: 79,
    category: 'Carrozzeria',
    categoryEn: 'Bodywork',
    description: 'Lucidatura completa 1 pannello',
    descriptionEn: 'Complete 1 panel polishing',
    duration: '2 ore',
    durationEn: '2 hours'
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

type TabType = 'lavaggio' | 'meccanica';

const CarWashServicesPage: React.FC = () => {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('lavaggio');
  const [services] = useState<Service[]>(FALLBACK_SERVICES);

  const handleBookWashService = (serviceId: string) => {
    navigate('/car-wash-booking', { state: { serviceId } });
  };

  const handleBookMechanicalService = (serviceId: string) => {
    navigate('/mechanical-booking', { state: { serviceId } });
  };

  // Group mechanical services by category
  const mechanicalByCategory = MECHANICAL_SERVICES.reduce((acc, service) => {
    const category = lang === 'it' ? service.category : service.categoryEn;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, MechanicalService[]>);

  return (
    <div className="min-h-screen bg-black pt-32 pb-16">
      {/* Tab Navigation */}
      <div className="container mx-auto px-6 mb-8">
        <div className="flex justify-center">
          <div className="inline-flex bg-gray-900/50 border border-gray-800 rounded-full p-1">
            <button
              onClick={() => setActiveTab('lavaggio')}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                activeTab === 'lavaggio'
                  ? 'bg-white text-black'
                  : 'text-white hover:text-gray-300'
              }`}
            >
              {lang === 'it' ? 'LAVAGGIO' : 'WASH'}
            </button>
            <button
              onClick={() => setActiveTab('meccanica')}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                activeTab === 'meccanica'
                  ? 'bg-white text-black'
                  : 'text-white hover:text-gray-300'
              }`}
            >
              {lang === 'it' ? 'MECCANICA' : 'MECHANICAL'}
            </button>
          </div>
        </div>
      </div>

      {/* LAVAGGIO TAB CONTENT */}
      {activeTab === 'lavaggio' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden group transition-all duration-300 hover:border-white/50 hover:shadow-2xl hover:shadow-white/10 flex flex-col"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={service.image || '/carwash-default.jpg'}
                      alt={lang === 'it' ? service.name : service.nameEn}
                      className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${service.image ? 'aspect-[3/4] object-top' : 'aspect-[4/3]'}`}
                    />
                    {!service.image && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 left-4">
                          <span className="text-3xl font-bold text-white">{service.price}</span>
                          <span className="text-gray-300 text-sm ml-2">{service.duration}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {service.image ? (
                    <div className="p-4">
                      <button
                        onClick={() => handleBookWashService(service.id)}
                        className="w-full bg-transparent border-2 border-white text-white py-3 px-6 rounded-full font-semibold text-sm transform transition-all duration-300 group-hover:bg-white group-hover:text-black"
                      >
                        {lang === 'it' ? 'AGGIUNGI AL CARRELLO' : 'ADD TO CART'}
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {lang === 'it' ? service.name : service.nameEn}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        {lang === 'it' ? service.description : service.descriptionEn}
                      </p>
                      <div className="space-y-2 mb-6 flex-grow">
                        {(lang === 'it' ? service.features : service.featuresEn)?.slice(0, 4).map((feature, idx) => (
                          <div key={idx} className="flex items-start">
                            <span className="text-white mr-2 text-xs">•</span>
                            <span className="text-gray-300 text-xs">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleBookWashService(service.id)}
                        className="w-full bg-transparent border-2 border-white text-white py-3 px-6 rounded-full font-semibold text-sm transform transition-all duration-300 group-hover:bg-white group-hover:text-black"
                      >
                        {lang === 'it' ? 'AGGIUNGI AL CARRELLO' : 'ADD TO CART'}
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Auto di Cortesia Section - Lavaggio */}
          <div className="bg-gray-900/30 py-16 mt-16">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {lang === 'it' ? 'Auto di Cortesia' : 'Courtesy Car'}
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
                          <span className="font-bold text-white">{price.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* MECCANICA TAB CONTENT */}
      {activeTab === 'meccanica' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto px-6">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                DR7 RAPID SERVICE
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-3">
                {lang === 'it'
                  ? 'Meccanica rapida senza appuntamenti lunghi'
                  : 'Fast mechanical service without long appointments'}
              </p>
              <p className="text-sm sm:text-base text-gray-500">
                {lang === 'it'
                  ? 'Solo lavori rapidi — Prenota online e vieni quando vuoi'
                  : 'Quick jobs only — Book online and come when you want'}
              </p>
            </div>

            {/* Services by Category */}
            {Object.entries(mechanicalByCategory).map(([category, categoryServices], index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="mb-12"
              >
                <h2 className="text-3xl font-bold text-white mb-6 border-b border-gray-800 pb-3">
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {categoryServices.map((service) => (
                    <motion.div
                      key={service.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 md:p-6 hover:border-white transition-all cursor-pointer flex flex-col h-full"
                      onClick={() => handleBookMechanicalService(service.id)}
                    >
                      <div className="flex justify-between items-start mb-2 md:mb-3">
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white flex-1">
                          {lang === 'it' ? service.name : service.nameEn}
                        </h3>
                      </div>
                      <p className="text-gray-400 text-xs sm:text-sm mb-3 md:mb-4 flex-grow">
                        {lang === 'it' ? service.description : service.descriptionEn}
                      </p>
                      <div className="flex justify-between items-center mb-3 md:mb-4">
                        <div className="text-gray-500 text-xs sm:text-sm">
                          {lang === 'it' ? service.duration : service.durationEn}
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-white">
                          {service.price}
                        </div>
                      </div>
                      <button className="w-full bg-white text-black font-bold py-2 md:py-3 px-4 md:px-6 rounded-full hover:bg-gray-200 transition-colors text-sm md:text-base mt-auto">
                        {lang === 'it' ? 'AGGIUNGI AL CARRELLO' : 'ADD TO CART'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Auto di Cortesia Section - Meccanica */}
          <div className="bg-gray-900/30 py-16 mt-8">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {lang === 'it' ? 'Auto di Cortesia' : 'Courtesy Car'}
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
                          <span className="font-bold text-white">{price.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="container mx-auto px-6 mt-16">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-white mb-6">
                {lang === 'it' ? 'Come Funziona' : 'How It Works'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <h4 className="text-lg font-bold text-white mb-2">
                    {lang === 'it' ? '1. Prenota Online' : '1. Book Online'}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {lang === 'it'
                      ? 'Scegli il servizio e prenota in pochi click'
                      : 'Choose your service and book in a few clicks'}
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-bold text-white mb-2">
                    {lang === 'it' ? '2. Vieni da Noi' : '2. Come to Us'}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {lang === 'it'
                      ? 'Arrivi all\'orario prenotato, niente attese'
                      : 'Arrive at your booked time, no waiting'}
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-bold text-white mb-2">
                    {lang === 'it' ? '3. Lavoro Rapido' : '3. Quick Service'}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {lang === 'it'
                      ? 'Completiamo il lavoro velocemente e torni in strada'
                      : 'We complete the job quickly and you\'re back on the road'}
                  </p>
                </div>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4">
                {lang === 'it' ? 'Orari di Apertura' : 'Opening Hours'}
              </h3>
              <p className="text-gray-400">
                {lang === 'it' ? 'Lunedi - Sabato: 9:00 - 19:00' : 'Monday - Saturday: 9:00 AM - 7:00 PM'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {lang === 'it' ? 'Chiusi la domenica' : 'Closed on Sundays'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CarWashServicesPage;
