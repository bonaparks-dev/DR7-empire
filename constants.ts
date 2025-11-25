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
  {
    "id": 2,
    "name": "Audi RS3 Verde",
    "dailyPrice": 40,
    "specs": {
      "acceleration": "0–100 in 3.8s",
      "maxSpeed": "Max speed: 250km/h",
      "power": "400Cv",
      "torque": "500Nm",
      "engine": "2.5L inline 5-cylinder"
    },
    "image": "/audi-rs3.jpeg",
    "color": "Verde"
  },
  // REMOVED: Audi RS3 Rossa - Hidden per request
  // {
  //   "id": 3,
  //   "name": "Audi RS3 Rossa",
  //   "dailyPrice": 60,
  //   "specs": {
  //     "acceleration": "0–100 in 3.8s",
  //     "power": "400Cv",
  //     "torque": "500Nm",
  //     "engine": "2.5L inline 5-cylinder"
  //   },
  //   "image": "/rs3.jpeg",
  //   "color": "Rossa"
  // },
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
    "dailyPrice": 70,
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
    "dailyPrice": 150,
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
    "dailyPrice": 100,
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
  },
  {
    "id": 205,
    "name": "Mercedes V Class VIP DR7",
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

    const isAvailable = car.available !== false;
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

    const isAvailable = car.available !== false;

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
    label: { en: 'Exotic Supercars', it: 'Exotic Supercars' },
    data: mappedCars,
    icon: CarIcon,
  },
  {
    id: 'urban-cars',
    label: { en: 'Urban Cars', it: 'Urban Cars' },
    data: mappedUrbanCars,
    icon: CarIcon,
  },
  {
    id: 'yachts',
    label: { en: 'Yachts', it: 'Yacht' },
    data: [
      { id: 'yacht-1', name: 'Luxury Yacht', image: '/yacht1.jpeg', images: ['/yacht1.jpeg'], pricePerDay: { usd: 12000, eur: 11000, crypto: 0 }, specs: yachtSpecs },
    ],
    icon: AnchorIcon,
  },
  {
    id: 'jets',
    label: { en: 'Jets', it: 'Jet' },
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
    ],
    icon: PaperAirplaneIcon,
  },
  {
    id: 'helicopters',
    label: { en: 'Helicopters', it: 'Elicotteri' },
    data: [
        { id: 'heli-1', name: 'Airbus H125', image: '/heli1.jpeg', specs: helicopterSpecs },
        { id: 'heli-2', name: 'Bell 505 Jet Ranger X', image: '/heli2.jpeg', specs: helicopterSpecs },
    ],
    icon: HelicopterIcon,
  },
  {
    id: 'car-wash-services',
    label: { en: 'Luxury Wash', it: 'Luxury Wash' },
    data: [],
    icon: SparklesIcon,
  },
  {
    id: 'membership',
    label: { en: 'Members', it: 'Members' },
    data: [],
    icon: CrownIcon,
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
  name: { en: 'Lotteria DR7 S.p.A.', it: 'Lotteria DR7 S.p.A.' },
  subtitle: { en: 'Win an Alfa Romeo Stelvio Quadrifoglio', it: 'Vinci un\'Alfa Romeo Stelvio Quadrifoglio' },
  image: '/main.jpeg',
  ticketPriceEUR: 25,
  drawDate: '2025-12-24T10:00:00Z',
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
    { id: 'cagliari_airport', label: { en: 'Cagliari Elmas Airport', it: 'Aeroporto di Cagliari Elmas' } },
    { id: 'dr7_office', label: { en: 'DR7 Office Cagliari', it: 'Ufficio DR7 Cagliari' } },
];

export const INSURANCE_OPTIONS = [
    { id: 'KASKO_BASE', label: { en: 'KASKO BASE', it: 'KASKO BASE' }, description: { en: 'Standard liability coverage.', it: 'Copertura di responsabilità standard.' }, pricePerDay: { usd: 110, eur: 100, crypto: 0 } },
    { id: 'KASKO_BLACK', label: { en: 'KASKO BLACK', it: 'KASKO BLACK' }, description: { en: 'Reduced excess and windscreen cover.', it: 'Franchigia ridotta e copertura parabrezza.' }, pricePerDay: { usd: 165, eur: 150, crypto: 0 } },
    { id: 'KASKO_SIGNATURE', label: { en: 'KASKO SIGNATURE', it: 'KASKO SIGNATURE' }, description: { en: 'Zero excess. Complete peace of mind.', it: 'Zero franchigia. Massima tranquillità.' }, pricePerDay: { usd: 220, eur: 200, crypto: 0 } },
];

export const URBAN_INSURANCE_OPTIONS = [
    { id: 'KASKO_BASE', label: { en: 'KASKO BASE', it: 'KASKO BASE' }, description: { en: 'Base coverage with deductible and damage percentage.', it: 'Copertura base con franchigia e percentuale sul danno.' }, pricePerDay: { usd: 0, eur: 0, crypto: 0 } },
    { id: 'KASKO_BLACK', label: { en: 'KASKO BLACK', it: 'KASKO BLACK' }, description: { en: 'Intermediate coverage with fixed deductible.', it: 'Copertura intermedia con franchigia fissa.' }, pricePerDay: { usd: 6, eur: 5, crypto: 0 } },
    { id: 'KASKO_SIGNATURE', label: { en: 'KASKO SIGNATURE', it: 'KASKO SIGNATURE' }, description: { en: 'Top-tier coverage with reduced deductible.', it: 'Copertura top di gamma con franchigia ridotta.' }, pricePerDay: { usd: 28, eur: 25, crypto: 0 } },
];

export const RENTAL_EXTRAS = [
    { id: 'additional_driver', label: { en: 'Additional Driver', it: 'Guidatore Aggiuntivo' }, pricePerDay: { usd: 13, eur: 10, crypto: 0 } },
    { id: 'young_driver_fee', label: { en: 'Young Driver Fee (Under 25)', it: 'Supplemento Giovane Conducente (Sotto 25)' }, pricePerDay: { usd: 11, eur: 10, crypto: 0 }, autoApply: true },
    { id: 'mobility_service', label: { en: 'Mobility Service', it: 'Servizio Mobilità' }, pricePerDay: { usd: 7.14, eur: 7.00, crypto: 0 }, description: { en: 'Assistance in case of user-caused errors preventing the trip (empty tank, dead battery, lost or locked key)', it: 'Assistenza in caso di errori causati dall\'utente che impediscono il viaggio (serbatoio vuoto, batteria scarica, chiave persa o bloccata)' } },
    { id: 'accident_insurance', label: { en: 'Driver & Passenger Accident Insurance', it: 'Assicurazione Infortuni Conducente e Passeggeri' }, pricePerDay: { usd: 10.42, eur: 9.00, crypto: 0 }, description: { en: 'Financial coverage in case of disability, injury, or death for the driver and passengers', it: 'Copertura finanziaria in caso di invalidità, infortunio o decesso per conducente e passeggeri' } },
    { id: 'refueling_service', label: { en: 'Refueling Service', it: 'Servizio Rifornimento' }, pricePerDay: { usd: 24.20, eur: 22.00, crypto: 0 }, oneTime: true, description: { en: 'DR7 handles refueling or electric charging upon return (charged at current rates)', it: 'DR7 gestisce il rifornimento o la ricarica elettrica al ritorno (addebitato alle tariffe correnti)' } },
    { id: 'infant_seat', label: { en: 'Infant Seat', it: 'Seggiolino Neonato' }, pricePerDay: { usd: 27.23, eur: 24.00, crypto: 0 }, description: { en: 'Suitable for infants and small children up to 4 years old (40–105 cm), rear-facing only', it: 'Adatto per neonati e bambini piccoli fino a 4 anni (40-105 cm), solo rivolto all\'indietro' } },
    { id: 'child_seat', label: { en: 'Child Seat', it: 'Seggiolino Bambino' }, pricePerDay: { usd: 27.23, eur: 24.00, crypto: 0 }, description: { en: 'For children aged 15 months – 12 years (67–150 cm)', it: 'Per bambini dai 15 mesi ai 12 anni (67-150 cm)' } },
    { id: 'booster_seat', label: { en: 'Booster Seat', it: 'Rialzo' }, pricePerDay: { usd: 10.18, eur: 9.00, crypto: 0 }, description: { en: 'For children aged 8 – 12 years (135–150 cm)', it: 'Per bambini dagli 8 ai 12 anni (135-150 cm)' } },
];

export const COUNTRIES = [
    { code: 'IT', name: 'Italy' }, { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },  { code: 'FR', name: 'Altri' },
];

export const INSURANCE_ELIGIBILITY = {
    KASKO_BASE: { minAge: 20, minLicenseYears: 2 },
    KASKO_BLACK: { minAge: 25, minLicenseYears: 5 },
    KASKO_SIGNATURE: { minAge: 30, minLicenseYears: 10 },
};

export const URBAN_INSURANCE_ELIGIBILITY = {
    KASKO_BASE: { minAge: 18, minLicenseYears: 3 },
    KASKO_BLACK: { minAge: 25, minLicenseYears: 5 },
    KASKO_SIGNATURE: { minAge: 30, minLicenseYears: 10 },
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
