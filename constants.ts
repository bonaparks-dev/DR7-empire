import React from 'react';
import type { RentalCategory, MembershipTier, CommercialOperation, Amenity } from './types';
// FIX: Consolidate and correct icon imports
import {
  UsersIcon,
  CogIcon,
  ZapIcon,
  AnchorIcon,
  HomeIcon,
  PaperAirplaneIcon,
  BedIcon,
  BathIcon,
  WifiIcon,
  CarIcon,
  WavesIcon,
  TreePineIcon,
  Building2Icon,
  ShieldIcon,
  CrownIcon,
  StarIcon,
  PlusIcon,
  CreditCardIcon,
  CalendarIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  CubeTransparentIcon,
  TicketIcon,
  HelicopterIcon,
  SparklesIcon,
} from './components/icons/Icons';

const newCarsRawData = [
  // REMOVED: RS3 Verde - Hidden per request
  // {
  //   "id": 2,
  //   "name": "Audi RS3 Verde",
  //   "dailyPrice": 40,
  //   "specs": {
  //     "acceleration": "0–100 in 3.8s",
  //     "maxSpeed": "Max speed: 250km/h",
  //     "power": "400Cv",
  //     "torque": "500Nm",
  //     "engine": "2.5L inline 5-cylinder"
  //   },
  //   "image": "/audi-rs3.jpeg",
  //   "color": "Verde"
  // },
  {
    "id": 3,
    "name": "Audi RS3 Rossa",
    "dailyPrice": 70,
    "specs": {
      "acceleration": "0–100 in 3.8s",
      "power": "400Cv",
      "torque": "500Nm",
      "engine": "2.5L inline 5-cylinder"
    },
    "image": "/rs3.jpeg",
    "color": "Rossa"
  },
  {
    "id": 4,
    "name": "Mercedes A45 S AMG",
    "dailyPrice": 70,
    "specs": {
      "acceleration": "0–100 in 3.9s",
      "power": "421Cv",
      "torque": "500Nm",
      "engine": "2.0L 4-cylinder Turbo"
    },
    "image": "/mercedes_amg.jpeg"
  },
  {
    "id": 5,
    "name": "BMW M3 Competition",
    "dailyPrice": 120,
    "specs": {
      "acceleration": "0–100 in 3.9s",
      "maxSpeed": "Max speed: 250km/h",
      "power": "510Cv",
      "torque": "650Nm",
      "engine": "3.0L inline 6-cylinder"
    },
    "image": "/bmw-m3.jpeg"
  },
  {
    "id": 6,
    "name": "BMW M4 Competition",
    "dailyPrice": 80,
    "specs": {
      "acceleration": "0–100 in 3.8s",
      "power": "510Cv",
      "torque": "650Nm",
      "engine": "3.0L inline 6-cylinder"
    },
    "image": "/bmw-m4.jpeg"
  },
  {
    "id": 7,
    "name": "Porsche 992 Carrera 4S",
    "dailyPrice": 250,
    "specs": {
      "acceleration": "0–100 in 3.6s",
      "maxSpeed": "Max speed: 306km/h",
      "power": "450Cv",
      "torque": "530Nm",
      "engine": "3.0L Twin-Turbo Flat-6"
    },
    "image": "/porsche-911.jpeg"
  },
  {
    "id": 8,
    "name": "Mercedes C63 S AMG",
    "dailyPrice": 200,
    "specs": {
      "acceleration": "0–100 in 3.9s",
      "power": "510Cv",
      "torque": "700Nm",
      "engine": "4.0L V8 BiTurbo"
    },
    "image": "/c63.jpeg"
  },
  // REMOVED: Porsche Macan GTS - Hidden per request
  // {
  //   "id": 9,
  //   "name": "Porsche Macan GTS",
  //   "dailyPrice": 80,
  //   "specs": {
  //     "acceleration": "0–100 in 4.5s",
  //     "power": "440Cv",
  //     "torque": "550Nm",
  //     "engine": "2.9L Twin-Turbo V6"
  //   },
  //   "image": "/macan.jpeg"
  // },
  {
    "id": 10,
    "name": "Mercedes GLE 63 AMG",
    "dailyPrice": 80,
    "specs": {
      "acceleration": "0–100 in 3.8s",
      "power": "612Cv",
      "torque": "850Nm",
      "engine": "4.0L V8 BiTurbo"
    },
    "image": "/mercedes-gle.jpeg"
  }
];

const specMappings: Record<string, { label: { en: string; it: string }; icon: React.FC<{ className?: string }>; transform?: (val: string) => string }> = {
  acceleration: { label: { en: '0-100km/h', it: '0-100km/h' }, icon: ZapIcon, transform: (val: string) => val.split(' in ')[1] || val },
  power: { label: { en: 'Power', it: 'Potenza' }, icon: ZapIcon },
  torque: { label: { en: 'Torque', it: 'Coppia' }, icon: CogIcon },
  engine: { label: { en: 'Engine', it: 'Motore' }, icon: CogIcon },
  maxSpeed: { label: { en: 'Max Speed', it: 'Velocità Max' }, icon: ZapIcon, transform: (val: string) => val.split(': ')[1] || val },
  special: { label: { en: 'Special', it: 'Speciale' }, icon: StarIcon },
  extras: { label: { en: 'Extras', it: 'Extra' }, icon: PlusIcon },
  color: { label: { en: 'Color', it: 'Colore' }, icon: CarIcon }
};

const EUR_TO_USD_RATE = 1.1;

const urbanCarsRawData = [
  {
    "id": 201,
    "name": "Fiat Panda Benzina (Arancione)",
    "dailyPrice": 19.90,
    "specs": {
      "power": "70Cv",
      "engine": "1.2L Benzina",
      "seats": "5 posti"
    },
    "image": "/panda1.jpeg",
    "color": "Arancione"
  },
  {
    "id": 202,
    "name": "Fiat Panda Benzina (Bianca)",
    "dailyPrice": 19.90,
    "specs": {
      "power": "70Cv",
      "engine": "1.2L Benzina",
      "seats": "5 posti"
    },
    "image": "/panda2.jpeg",
    "color": "Bianca"
  },
  {
    "id": 203,
    "name": "Fiat Panda Diesel (Grigia)",
    "dailyPrice": 24.90,
    "specs": {
      "power": "95Cv",
      "engine": "1.3L MultiJet Diesel",
      "seats": "5 posti"
    },
    "image": "/panda3.jpeg",
    "color": "Grigia"
  },
  {
    "id": 204,
    "name": "Renault Captur",
    "dailyPrice": 44.90,
    "specs": {
      "power": "130Cv",
      "engine": "1.3L TCe",
      "seats": "5 posti"
    },
    "image": "/captur.jpeg"
  }
];

const corporateFleetRawData = [
  {
    "id": 205,
    "name": "Mercedes Vito VIP DR7",
    "dailyPrice": 199,
    "specs": {
      "power": "163Cv",
      "engine": "2.0L Diesel",
      "seats": "7 posti"
    },
    "image": "/vito.jpeg"
  },
  {
    "id": 206,
    "name": "Furgone DR7 (Fiat Ducato Maxi)",
    "dailyPrice": 59,
    "specs": {
      "power": "140Cv",
      "engine": "2.3L MultiJet",
      "seats": "9 posti"
    },
    "image": "/ducato.jpeg"
  }
];

const mappedCars = newCarsRawData.map(car => {
  const specs: any[] = [];
  if (car.specs) {
    for (const [key, value] of Object.entries(car.specs)) {
      const mapping = specMappings[key as keyof typeof specMappings];
      if (mapping) {
        specs.push({
          label: mapping.label,
          value: 'transform' in mapping && mapping.transform ? mapping.transform(value as string) : value,
          icon: mapping.icon
        });
      }
    }
  }
  if ('color' in car && car.color) {
    specs.push({
      label: specMappings.color.label,
      value: car.color,
      icon: specMappings.color.icon
    });
  }

  const isAvailable = (car as any).available !== false;
  return {
    id: `car-${car.id}`,
    name: car.name,
    image: car.image,
    available: isAvailable,
    pricePerDay: isAvailable && car.dailyPrice ? {
      usd: Math.round(car.dailyPrice * EUR_TO_USD_RATE),
      eur: car.dailyPrice,
      crypto: 0
    } : undefined,
    specs: specs
  };
});

const mappedUrbanCars = urbanCarsRawData.map(car => {
  const specs: any[] = [];
  if (car.specs) {
    for (const [key, value] of Object.entries(car.specs)) {
      const mapping = specMappings[key as keyof typeof specMappings];
      if (mapping) {
        specs.push({
          label: mapping.label,
          value: 'transform' in mapping && mapping.transform ? mapping.transform(value as string) : value,
          icon: mapping.icon
        });
      }
    }
  }

  const isAvailable = (car as any).available !== false;

  return {
    id: `urban-car-${car.id}`,
    name: car.name,
    image: car.image,
    available: isAvailable,
    pricePerDay: isAvailable && car.dailyPrice ? {
      usd: Math.round(car.dailyPrice * EUR_TO_USD_RATE),
      eur: car.dailyPrice,
      crypto: 0
    } : undefined,
    specs: specs
  };
});

const mappedCorporateFleet = corporateFleetRawData.map(car => {
  const specs: any[] = [];
  if (car.specs) {
    for (const [key, value] of Object.entries(car.specs)) {
      const mapping = specMappings[key as keyof typeof specMappings];
      if (mapping) {
        specs.push({
          label: mapping.label,
          value: 'transform' in mapping && mapping.transform ? mapping.transform(value as string) : value,
          icon: mapping.icon
        });
      }
    }
  }

  const isAvailable = (car as any).available !== false;

  return {
    id: `corporate-fleet-${car.id}`,
    name: car.name,
    image: car.image,
    available: isAvailable,
    pricePerDay: isAvailable && car.dailyPrice ? {
      usd: Math.round(car.dailyPrice * EUR_TO_USD_RATE),
      eur: car.dailyPrice,
      crypto: 0
    } : undefined,
    specs: specs
  };
});


const yachtSpecs = [
  { label: { en: 'Guests', it: 'Ospiti' }, value: '12', icon: UsersIcon },
  { label: { en: 'Length', it: 'Lunghezza' }, value: '70m', icon: AnchorIcon },
  { label: { en: 'Cabins', it: 'Cabine' }, value: '6', icon: BedIcon },
];

const helicopterSpecs = [
  { label: { en: 'Passengers', it: 'Passeggeri' }, value: '5', icon: UsersIcon },
  { label: { en: 'Range', it: 'Autonomia' }, value: '300 nm', icon: PaperAirplaneIcon },
  { label: { en: 'Speed', it: 'Velocità' }, value: '150 kt', icon: ZapIcon },
];

export const RENTAL_CATEGORIES: RentalCategory[] = [
  {
    id: 'cars',
    label: { en: 'DR7 Supercar & Luxury Division', it: 'DR7 Supercar & Luxury Division' },
    data: mappedCars,
    icon: CarIcon,
  },
  {
    id: 'urban-cars',
    label: { en: 'DR7 Urban Mobility Division', it: 'DR7 Urban Mobility Division' },
    data: mappedUrbanCars,
    icon: CarIcon,
  },
  {
    id: 'corporate-fleet',
    label: { en: 'DR7 Corporate & Utility Fleet Division', it: 'DR7 Corporate & Utility Fleet Division' },
    data: mappedCorporateFleet,
    icon: CarIcon,
  },
  {
    id: 'yachts',
    label: { en: 'DR7 Yachting Division', it: 'DR7 Yachting Division' },
    data: [
      { id: 'yacht-1', name: 'Luxury Yacht', image: '/yacht1.jpeg', images: ['/yacht1.jpeg'], pricePerDay: { usd: 12000, eur: 11000, crypto: 0 }, specs: yachtSpecs },
    ],
    icon: AnchorIcon,
  },
  {
    id: 'jets',
    label: { en: 'DR7 Aviation Division', it: 'DR7 Aviation Division' },
    data: [
      {
        id: 'jet-1',
        name: 'Cessna Citation Mustang',
        image: '/jet1.jpeg',
        images: ['/jet1.jpeg', '/jet2.jpeg'],
        specs: [
          { label: { en: 'Passengers', it: 'Passeggeri' }, value: '4', icon: UsersIcon },
          { label: { en: 'Year', it: 'Anno' }, value: '2008', icon: CalendarIcon },
          { label: { en: 'Type', it: 'Tipo' }, value: 'Entry Level Jet', icon: PaperAirplaneIcon },
        ],
        petsAllowed: false,
        smokingAllowed: false
      },
      {
        id: 'jet-2',
        name: 'Cessna Citation CJ2',
        image: '/jet3.jpeg',
        images: ['/jet3.jpeg', '/jet4.jpeg'],
        specs: [
          { label: { en: 'Passengers', it: 'Passeggeri' }, value: '6', icon: UsersIcon },
          { label: { en: 'Year', it: 'Anno' }, value: '2004', icon: CalendarIcon },
          { label: { en: 'Type', it: 'Tipo' }, value: 'Light Jet', icon: PaperAirplaneIcon },
        ],
        petsAllowed: false,
        smokingAllowed: false
      },
      { id: 'heli-1', name: 'Airbus H125', image: '/heli1.jpeg', specs: helicopterSpecs },
      { id: 'heli-2', name: 'Bell 505 Jet Ranger X', image: '/heli2.jpeg', specs: helicopterSpecs },
    ],
    icon: PaperAirplaneIcon,
  },
  {
    id: 'car-wash-services',
    label: { en: 'DR7 Luxury Care Services', it: 'DR7 Luxury Care Services' },
    data: [],
    icon: SparklesIcon,
  },
  {
    id: 'mechanical-services',
    label: { en: 'DR7 Rapid Response Services', it: 'DR7 Rapid Response Services' },
    data: [],
    icon: CogIcon,
  },
  {
    id: 'membership',
    label: { en: 'DR7 Exclusive Members Club', it: 'DR7 Exclusive Members Club' },
    data: [],
    icon: CrownIcon,
  },
  {
    id: 'credit-wallet',
    label: { en: 'DR7 Credit Wallet', it: 'DR7 Credit Wallet' },
    data: [],
    icon: CreditCardIcon,
  },
];

// FIX: Export missing constants
export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: 'silver',
    name: { en: 'Silver', it: 'Argento' },
    price: {
      monthly: { usd: 99, eur: 90, crypto: 0 },
      annually: { usd: 990, eur: 900, crypto: 0 },
    },
    features: {
      en: [
        '10% discount on all car rentals and premium washes',
        'Priority booking access',
        'Zero deposit option with "No Deposit" service',
        'Monthly invitations to partner events (restaurants, clubs, luxury brands)',
        'Access to "DR7 Members Priority" WhatsApp group for flash offers',
      ],
      it: [
        'Sconto del 10% su tutti i noleggi auto e lavaggi premium',
        'Accesso prioritario alle prenotazioni',
        'Possibilità di azzerare la cauzione con il servizio "No Cauzione"',
        'Inviti mensili a eventi partner (ristoranti, club, luxury brands)',
        'Accesso al gruppo WhatsApp "DR7 Members Priority" per offerte lampo',
      ],
    },
  },
  {
    id: 'gold',
    name: { en: 'Gold', it: 'Oro' },
    price: {
      monthly: { usd: 253, eur: 230, crypto: 0 },
      annually: { usd: 2530, eur: 2300, crypto: 0 },
    },
    features: {
      en: [
        '15% discount on all rentals (cars, yachts, villas, helicopters)',
        '24/7 personal concierge service (WhatsApp VIP Line)',
        '2 complimentary airport transfers per month (Cagliari area)',
        'Absolute priority for last-minute bookings',
        'Cancel bookings up to 24h before without penalties',
        'Invitations to private DR7 events and partner evenings',
        'Access to off-market assets (exclusive cars, yachts, villas)',
        '€150 annual voucher for DR7 services',
      ],
      it: [
        'Sconto del 15% su tutti i noleggi auto, yacht, ville ed elicotteri',
        'Servizio di portineria personale 24/7 (WhatsApp VIP Line)',
        'Trasferimenti aeroportuali gratuiti (2 al mese, area Cagliari)',
        'Priorità assoluta nelle prenotazioni last-minute',
        'Possibilità di annullare una prenotazione fino a 24h prima senza penali',
        'Inviti a eventi privati DR7 e serate partner',
        'Accesso a beni fuori mercato (auto, yacht, ville esclusive non pubblicate)',
        'Voucher annuale da €150 da utilizzare in servizi DR7',
      ],
    },
    isPopular: true,
  },
  {
    id: 'platinum',
    name: { en: 'Platinum', it: 'Platino' },
    price: {
      monthly: { usd: 506, eur: 460, crypto: 0 },
      annually: { usd: 5060, eur: 4600, crypto: 0 },
    },
    features: {
      en: [
        '20% discount on all DR7 services (cars, yachts, helicopters, villas, Luxury Wash)',
        'Dedicated personal manager (lifestyle & travel)',
        'Guaranteed availability with 48h notice, even in high season',
        'VIP access to off-market assets and reserved DR7 auctions',
        '"Zero Deposit" service always included',
        'Complete concierge for travel, restaurants, and special requests',
        'Priority on events, previews, and new models',
        'Welcome Gift DR7 (box with merchandise + €300 voucher)',
        'Access to DR7 Private Club with lounge and exclusive party invitations',
      ],
      it: [
        'Sconto del 20% su tutti i servizi DR7 (auto, yacht, elicotteri, ville, Luxury Wash)',
        'Manager personale dedicato (lifestyle & travel)',
        'Disponibilità garantita con 48 ore di preavviso, anche in alta stagione',
        'Accesso VIP a beni fuori mercato e aste riservate DR7',
        'Servizio "Zero Cauzione" sempre incluso',
        'Concierge completo per viaggi, ristoranti e richieste speciali',
        'Priorità su eventi, anteprime e nuovi modelli',
        'Welcome Gift DR7 (box con merchandising + voucher €300)',
        'Accesso al DR7 Private Club, con lounge e inviti alle serate più esclusive',
      ],
    },
  },
];

export const COMMERCIAL_OPERATION_GIVEAWAY: CommercialOperation = {
  id: 'christmas-2024',
  name: { en: 'DR7 Official Lottery', it: 'DR7 Official Lottery' },
  subtitle: { en: 'Win an Alfa Romeo Stelvio Quadrifoglio', it: 'Vinci un\'Alfa Romeo Stelvio Quadrifoglio' },
  image: '/main.jpeg',
  ticketPriceEUR: 25,
  drawDate: '2026-01-24T09:00:00Z',
  prizes: [
    {
      tier: { en: 'Grand Prize', it: 'Premio Unico' },
      name: { en: 'Alfa Romeo Stelvio Quadrifoglio', it: 'Alfa Romeo Stelvio Quadrifoglio' },
      icon: CarIcon,
    }
  ],
  bonus: {
    en: 'Only 2,000 tickets available. Drawing supervised by lawyer. Full transparency guaranteed.',
    it: 'Solo 2.000 biglietti disponibili. Estrazione supervisionata da avvocato. Trasparenza totale garantita.',
  },
};

export const PICKUP_LOCATIONS = [
  { id: 'dr7_office', label: { en: 'DR7 Office (Viale Marconi, 229, 09131 Cagliari CA)', it: 'Viale Marconi, 229, 09131 Cagliari CA' } },
];

// Automatic KASKO Insurance - Applied to all bookings
export const AUTO_INSURANCE = {
  id: 'KASKO',
  name: 'Copertura assicurativa KASKO',
  coverage: [
    'RCA',
    'Furto (solo in caso di restituzione chiave, altrimenti paga il 100% del valore del veicolo)',
    'Atti vandalici',
    'Agenti atmosferici',
    'Incendio',
    'Distruzione totale'
  ],
  additionalCondition: 'È attivabile per qualsiasi danno recato alla vettura anche con oggetti non identificabili per mezzo di targa, previo preventivo in officina ufficiale.'
};

// Deductible amounts by vehicle category
export const INSURANCE_DEDUCTIBLES = {
  URBAN: { fixed: 2000, percent: 30, description: 'Da risarcire: €2.000 + 30% del valore del danno' },
  UTILITARIA: { fixed: 2000, percent: 30, description: 'Da risarcire: €2.000 + 30% del valore del danno' },
  SUPERCAR: { fixed: 5000, percent: 30, description: 'Da risarcire: €5.000 + 30% del danno' }
};

export const DEPOSIT_RULES = {
  UTILITARIA: {
    LOYAL_CUSTOMER: 0,        // 3+ rentals
    LICENSE_UNDER_5: 1000,    // < 5 years
    LICENSE_5_OR_MORE: 500,   // ≥ 5 years
  },
  SUPERCAR: {
    LOYAL_CUSTOMER: 0,        // 3+ rentals
    LICENSE_UNDER_5: 2000,    // < 5 years
    LICENSE_5_OR_MORE: 1000,  // ≥ 5 years
  },
  LOYAL_CUSTOMER_THRESHOLD: 3, // Minimum rentals for loyalty
};



export const VALIDATION_MESSAGES = {
  en: { base: 'Based on your age and license history, only Basic Cover is available.' },
  it: { base: 'In base alla tua età e anzianità di patente, è disponibile solo la Copertura Base.' }
};

export const AGE_BUCKETS = [
  { value: 18, label: '18+' },
  { value: 21, label: '21+' },
  { value: 23, label: '23+' },
  { value: 25, label: '25+' },
  { value: 30, label: '30+' },
];

export const LICENSE_OBTENTION_YEAR_OPTIONS = Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - i);

export const YACHT_PICKUP_MARINAS = [
  { id: 'marina_di_cagliari', label: { en: 'Marina di Cagliari', it: 'Marina di Cagliari' } },
  { id: 'porto_cervo', label: { en: 'Marina di Porto Cervo', it: 'Marina di Porto Cervo' } },
];

export const AIRPORTS = [
  { iata: 'CAG', name: 'Cagliari Elmas Airport', city: 'Cagliari' },
  { iata: 'OLB', name: 'Olbia Costa Smeralda Airport', city: 'Olbia' },
  { iata: 'AHO', name: 'Alghero-Fertilia Airport', city: 'Alghero' },
  { iata: 'FCO', name: 'Leonardo da Vinci-Fiumicino Airport', city: 'Rome' },
  { iata: 'LIN', name: 'Linate Airport', city: 'Milan' },
  { iata: 'NCE', name: 'Nice Côte d\'Azur Airport', city: 'Nice' },
  { iata: 'LBG', name: 'Paris-Le Bourget Airport', city: 'Paris' },
  { iata: 'LTN', name: 'London Luton Airport', city: 'London' },
  { iata: 'IBZ', name: 'Ibiza Airport', city: 'Ibiza' },
];

export const HELI_DEPARTURE_POINTS = [
  { id: 'cagliari', name: 'Cagliari Heliport' },
  { id: 'porto_cervo', name: 'Porto Cervo Heliport' },
  { id: 'forte_village', name: 'Forte Village Resort' },
];

export const HELI_ARRIVAL_POINTS = [
  ...HELI_DEPARTURE_POINTS,
  { id: 'cala_di_volpe', name: 'Hotel Cala di Volpe' },
  { id: 'villasimius', name: 'Villasimius Private Pad' },
];

export const CRYPTO_ADDRESSES: Record<string, string> = {
  btc: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  eth: '0x1234567890123456789012345678901234567890',
  usdt: '0xabcdef1234567890abcdef1234567890abcdef12',
};

export const RENTAL_EXTRAS = [
  {
    id: 'young_driver_fee',
    label: { en: 'Young Driver Fee', it: 'Supplemento Giovane Conducente' },
    description: { en: 'Required for drivers under 25', it: 'Richiesto per conducenti sotto i 25 anni' },
    pricePerDay: { usd: 11, eur: 10, crypto: 10 },
    autoApply: true,
    oneTime: false
  },
  {
    id: 'additional_driver',
    label: { en: 'Additional Driver', it: 'Guidatore Aggiuntivo' },
    description: { en: 'Add a second driver', it: 'Aggiungi un secondo guidatore' },
    pricePerDay: { usd: 11, eur: 10, crypto: 10 },
    autoApply: false,
    oneTime: false
  }
];

