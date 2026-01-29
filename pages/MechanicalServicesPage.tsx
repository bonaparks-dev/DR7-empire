import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';

export interface MechanicalService {
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

export const MECHANICAL_SERVICES: MechanicalService[] = [
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

const MechanicalServicesPage: React.FC = () => {
  const { lang } = useTranslation();
  const navigate = useNavigate();

  const handleBookService = (serviceId: string) => {
    navigate('/mechanical-booking', { state: { serviceId } });
  };

  // Group services by category
  const servicesByCategory = MECHANICAL_SERVICES.reduce((acc, service) => {
    const category = lang === 'it' ? service.category : service.categoryEn;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, MechanicalService[]>);

  return (
    <div className="min-h-screen bg-black pt-32 pb-16 px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
            DR7 RAPID SERVICE
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-400 mb-3 md:mb-4">
            {lang === 'it'
              ? 'Meccanica rapida senza appuntamenti lunghi'
              : 'Fast mechanical service without long appointments'}
          </p>
          <p className="text-sm sm:text-base md:text-lg text-gray-500">
            {lang === 'it'
              ? 'Solo lavori rapidi — Prenota online e vieni quando vuoi'
              : 'Quick jobs only — Book online and come when you want'}
          </p>
        </motion.div>

        {/* Services by Category */}
        {Object.entries(servicesByCategory).map(([category, services], index) => (
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
              {services.map((service) => (
                <motion.div
                  key={service.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 md:p-6 hover:border-white transition-all cursor-pointer flex flex-col h-full"
                  onClick={() => handleBookService(service.id)}
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
                      €{service.price}
                    </div>
                  </div>
                  <button className="w-full bg-white text-black font-bold py-2 md:py-3 px-4 md:px-6 rounded-full hover:bg-gray-200 transition-colors text-sm md:text-base mt-auto">
                    {lang === 'it' ? 'PRENOTA ORA' : 'BOOK NOW'}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-gray-900/50 border border-gray-800 rounded-lg p-8"
        >
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
        </motion.div>

        {/* Opening Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center"
        >
          <h3 className="text-lg md:text-xl font-bold text-white mb-4">
            {lang === 'it' ? 'Orari di Apertura' : 'Opening Hours'}
          </h3>
          <p className="text-gray-400">
            {lang === 'it' ? 'Lunedì - Sabato: 9:00 - 19:00' : 'Monday - Saturday: 9:00 AM - 7:00 PM'}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {lang === 'it' ? 'Chiusi la domenica' : 'Closed on Sundays'}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default MechanicalServicesPage;
