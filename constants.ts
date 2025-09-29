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
} from './components/icons/Icons';

const newCarsRawData = [
  {
    "id": 1,
    "name": "Alfa Romeo Stelvio Quadrifoglio",
    "dailyPrice": 40,
    "specs": {
      "acceleration": "0–100 in 3.8s",
      "power": "510Cv",
      "torque": "600Nm",
      "engine": "2.9L V6 BiTurbo"
    },
    "image": "/alpha.jpeg",
    "available": false
  },
  {
    "id": 2,
    "name": "Hummer H2",
    "dailyPrice": 40,
    "specs": {
      "acceleration": "0–100 in 7.8s",
      "maxSpeed": "Max speed: 160km/h",
      "power": "398Cv",
      "torque": "574Nm",
      "engine": "6.2L V8"
    },
    "image": "/hummer1.jpeg"
  },
  {
    "id": 3,
    "name": "Audi RS3",
    "dailyPrice": 70,
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
  {
    "id": 4,
    "name": "Audi RS3",
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
    "id": 5,
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
    "id": 6,
    "name": "Porsche Cayenne S",
    "dailyPrice": 100,
    "specs": {
      "acceleration": "0–100 in 5.0s",
      "power": "475Cv",
      "torque": "600Nm",
      "engine": "4.0L twin-turbo V8"
    },
    "image": "/cayenne.jpeg",
  },
  {
    "id": 7,
    "name": "BMW M3 Competition",
    "dailyPrice": 100,
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
    "id": 8,
    "name": "Mercedes GLE 53 AMG",
    "dailyPrice": 120,
    "specs": {
      "acceleration": "0–100 in 4.7s",
      "maxSpeed": "Max speed: 250km/h",
      "power": "435Cv",
      "torque": "520Nm",
      "engine": "3.0L inline 6-cylinder"
    },
    "image": "/mercedesGLE.jpeg"
  },
  {
    "id": 9,
    "name": "BMW M4 Competition",
    "dailyPrice": 100,
    "specs": {
      "acceleration": "0–100 in 3.8s",
      "power": "510Cv",
      "torque": "650Nm",
      "engine": "3.0L inline 6-cylinder"
    },
    "image": "/bmw-m4.jpeg"
  },
  {
    "id": 10,
    "name": "Porsche 992 Carrera 4S",
    "dailyPrice": 120,
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
    "id": 11,
    "name": "Mercedes C63 S AMG",
    "dailyPrice": 120,
    "specs": {
      "acceleration": "0–100 in 3.9s",
      "power": "510Cv",
      "torque": "700Nm",
      "engine": "4.0L V8 BiTurbo"
    },
    "image": "/c63.jpeg"
  },
  {
    "id": 12,
    "name": "Porsche Macan GTS",
    "dailyPrice": 100,
    "specs": {
      "acceleration": "0–100 in 4.5s",
      "power": "440Cv",
      "torque": "550Nm",
      "engine": "2.9L Twin-Turbo V6"
    },
    "image": "/macan.jpeg"
  },
  {
    "id": 13,
    "name": "Mercedes GLE 63 AMG",
    "dailyPrice": 120,
    "specs": {
      "acceleration": "0–100 in 3.8s",
      "power": "612Cv",
      "torque": "850Nm",
      "engine": "4.0L V8 BiTurbo"
    },
    "image": "/mercedes-gle.jpeg"
  },
  {
    "id": 14,
    "name": "Ferrari Portofino M",
    "dailyPrice": 500,
    "specs": {
      "acceleration": "0–100 in 3.45s",
      "maxSpeed": "Max speed: 320km/h",
      "power": "620Cv",
      "torque": "760Nm",
      "engine": "3.9L Twin-Turbo V8"
    },
    "image": "/ferrari-portofino.jpeg",
    "available": false
  },
  {
    "id": 15,
    "name": "Lamborghini Urus Performante",
    "dailyPrice": 500,
    "specs": {
      "acceleration": "0–100 in 3.3s",
      "maxSpeed": "Max speed: 306km/h",
      "power": "666Cv",
      "torque": "850Nm",
      "engine": "4.0L Twin-Turbo V8"
    },
    "image": "/urus.jpeg"
  },
  {
    "id": 16,
    "name": "Fiat Ducato",
    "dailyPrice": 100,
    "specs": {
      "engine": "2.3L MultiJet Turbo Diesel",
      "power": "140Cv",
      "special": "Includes 100km pack",
      "extras": "Unlimited option: +50€"
    },
    "image": "/Ducato.jpeg",
    "available": false
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
    label: { en: 'Cars', it: 'Auto' },
    data: mappedCars,
    icon: CarIcon,
  },
  {
    id: 'yachts',
    label: { en: 'Yachts', it: 'Yacht' },
    data: [
      { id: 'yacht-1', name: 'Azimut Grande 27M', image: '/yacht.jpeg', pricePerDay: { usd: 12000, eur: 11000, crypto: 0 }, specs: yachtSpecs },
      { id: 'yacht-2', name: 'Ferretti 920', image: '/yachts/ferretti.jpeg', pricePerDay: { usd: 15000, eur: 13500, crypto: 0 }, specs: yachtSpecs },
    ],
    icon: AnchorIcon,
  },
  {
    id: 'jets',
    label: { en: 'Jets', it: 'Jet' },
    data: [
      { id: 'jet-1', name: 'Gulfstream G650', image: '/privatejet1.jpeg', specs: [
        { label: { en: 'Passengers', it: 'Passeggeri' }, value: '19', icon: UsersIcon },
        { label: { en: 'Range', it: 'Autonomia' }, value: '7,500 nm', icon: PaperAirplaneIcon },
        { label: { en: 'Speed', it: 'Velocità' }, value: 'Mach 0.925', icon: ZapIcon },
      ], petsAllowed: true, smokingAllowed: false },
      { id: 'jet-2', name: 'Bombardier Global 7500', image: '/privatejet2.jpeg', specs: [
        { label: { en: 'Passengers', it: 'Passeggeri' }, value: '19', icon: UsersIcon },
        { label: { en: 'Range', it: 'Autonomia' }, value: '7,700 nm', icon: PaperAirplaneIcon },
        { label: { en: 'Speed', it: 'Velocità' }, value: 'Mach 0.925', icon: ZapIcon },
      ], petsAllowed: true, smokingAllowed: true },
      { id: 'jet-3', name: 'Cessna Citation Longitude', image: '/jets/cessna.jpeg', specs: [
        { label: { en: 'Passengers', it: 'Passeggeri' }, value: '12', icon: UsersIcon },
        { label: { en: 'Range', it: 'Autonomia' }, value: '3,500 nm', icon: PaperAirplaneIcon },
        { label: { en: 'Speed', it: 'Velocità' }, value: '483 ktas', icon: ZapIcon },
      ], petsAllowed: false, smokingAllowed: false },
      { id: 'jet-4', name: 'Embraer Phenom 300E', image: '/jets/embraer.jpeg', specs: [
        { label: { en: 'Passengers', it: 'Passeggeri' }, value: '10', icon: UsersIcon },
        { label: { en: 'Range', it: 'Autonomia' }, value: '2,010 nm', icon: PaperAirplaneIcon },
        { label: { en: 'Speed', it: 'Velocità' }, value: '464 ktas', icon: ZapIcon },
      ], petsAllowed: true, smokingAllowed: false },
    ],
    icon: PaperAirplaneIcon,
  },
  {
    id: 'helicopters',
    label: { en: 'Helicopters', it: 'Elicotteri' },
    data: [
        { id: 'heli-1', name: 'Airbus H125', image: '/helicopter.jpeg', specs: helicopterSpecs },
        { id: 'heli-2', name: 'Bell 505 Jet Ranger X', image: '/helicopters/bell_505.jpeg', specs: helicopterSpecs },
    ],
    icon: HelicopterIcon,
  },
];

// FIX: Export missing constants
export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: 'silver',
    name: { en: 'Silver', it: 'Argento' },
    price: {
      monthly: { usd: 100, eur: 90, crypto: 0 },
      annually: { usd: 1000, eur: 900, crypto: 0 },
    },
    features: {
      en: [
        '5% discount on all car rentals',
        'Priority booking access',
        { icon: CreditCardIcon, text: 'Exclusive partner offers' },
      ],
      it: [
        'Sconto del 5% su tutti i noleggi auto',
        'Accesso prioritario alle prenotazioni',
        { icon: CreditCardIcon, text: 'Offerte esclusive dei partner' },
      ],
    },
  },
  {
    id: 'gold',
    name: { en: 'Gold', it: 'Oro' },
    price: {
      monthly: { usd: 250, eur: 230, crypto: 0 },
      annually: { usd: 2500, eur: 2300, crypto: 0 },
    },
    features: {
      en: [
        '10% discount on all rentals (cars, yachts)',
        '24/7 personal concierge service',
        'Complimentary airport transfers',
        { icon: CalendarIcon, text: 'Invitations to private events' },
      ],
      it: [
        'Sconto del 10% su tutti i noleggi (auto, yacht)',
        'Servizio di concierge personale 24/7',
        'Trasferimenti aeroportuali gratuiti',
        { icon: CalendarIcon, text: 'Inviti a eventi privati' },
      ],
    },
    isPopular: true,
  },
  {
    id: 'platinum',
    name: { en: 'Platinum', it: 'Platino' },
    price: {
      monthly: { usd: 500, eur: 460, crypto: 0 },
      annually: { usd: 5000, eur: 4600, crypto: 0 },
    },
    features: {
      en: [
        '15% discount on all services',
        'Dedicated lifestyle manager',
        'Guaranteed availability with 48h notice',
        'Access to off-market assets',
        { icon: ClockIcon, text: 'Last-minute booking priority' },
      ],
      it: [
        'Sconto del 15% su tutti i servizi',
        'Manager dedicato allo stile di vita',
        'Disponibilità garantita con 48 ore di preavviso',
        'Accesso a beni fuori mercato',
        { icon: ClockIcon, text: 'Priorità prenotazioni last-minute' },
      ],
    },
  },
];

export const COMMERCIAL_OPERATION_GIVEAWAY: CommercialOperation = {
  id: 'christmas-2024',
  name: { en: 'DR7 Million', it: 'DR7 Milioni' },
  subtitle: { en: 'Prize Pool Worth Over $7,000,000', it: 'Montepremi di Oltre €7.000.000' },
  image: '/main.jpeg',
  ticketPriceUSD: 23.60,
  ticketPriceEUR: 20,
  drawDate: '2025-12-24T10:00:00Z',
  prizes: [
    {
      tier: { en: 'Grand Prize', it: 'Primo Premio' },
      name: { en: 'Lamborghini Revuelto', it: 'Lamborghini Revuelto' },
      icon: CarIcon,
    },
    {
      tier: { en: 'Tier 2 Prizes', it: 'Premi di Livello 2' },
      name: { en: 'Rolex Submariner', it: 'Rolex Submariner' },
      icon: ClockIcon,
      quantity: 5
    },
    {
      tier: { en: 'Tier 3 Prizes', it: 'Premi di Livello 3' },
      name: { en: 'iPhone 16 Pro Max', it: 'iPhone 16 Pro Max' },
      icon: DevicePhoneMobileIcon,
      quantity: 10,
    },
    {
      tier: { en: 'Tier 4 Prizes', it: 'Premi di Livello 4' },
      name: { en: '1 Year DR7 Gold Membership', it: '1 Anno di Abbonamento DR7 Gold' },
      icon: CubeTransparentIcon,
      quantity: 20,
    }
  ],
  bonus: {
    en: 'Every ticket purchased also includes 100 entries into our flash giveaway for a luxury weekend in Sardinia!',
    it: 'Ogni biglietto acquistato include anche 100 partecipazioni al nostro giveaway flash per un weekend di lusso in Sardegna!',
  },
};

export const PICKUP_LOCATIONS = [
    { id: 'cagliari_airport', label: { en: 'Cagliari Elmas Airport', it: 'Aeroporto di Cagliari Elmas' } },
    { id: 'dr7_office', label: { en: 'DR7 Office Cagliari', it: 'Ufficio DR7 Cagliari' } },
];

export const INSURANCE_OPTIONS = [
    { id: 'KASKO_BASE', label: { en: 'Basic Cover', it: 'Copertura Base' }, description: { en: 'Standard liability coverage.', it: 'Copertura di responsabilità standard.' }, pricePerDay: { usd: 0, eur: 0, crypto: 0 } },
    { id: 'KASKO_BLACK', label: { en: 'Premium Cover', it: 'Copertura Premium' }, description: { en: 'Reduced excess and windscreen cover.', it: 'Franchigia ridotta e copertura parabrezza.' }, pricePerDay: { usd: 55, eur: 50, crypto: 0 } },
    { id: 'KASKO_SIGNATURE', label: { en: 'Full Cover', it: 'Copertura Completa' }, description: { en: 'Zero excess. Complete peace of mind.', it: 'Zero franchigia. Massima tranquillità.' }, pricePerDay: { usd: 110, eur: 100, crypto: 0 } },
];

export const RENTAL_EXTRAS = [
    { id: 'gps', label: { en: 'GPS Navigation', it: 'Navigatore GPS' }, pricePerDay: { usd: 11, eur: 10, crypto: 0 } },
    { id: 'child_seat', label: { en: 'Child Seat', it: 'Seggiolino per Bambini' }, pricePerDay: { usd: 8, eur: 7, crypto: 0 } },
    { id: 'additional_driver', label: { en: 'Additional Driver', it: 'Guidatore Aggiuntivo' }, pricePerDay: { usd: 16, eur: 15, crypto: 0 } },
];

export const COUNTRIES = [
    { code: 'IT', name: 'Italy' }, { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
];

export const INSURANCE_ELIGIBILITY = {
    KASKO_BASE: { minAge: 25, minLicenseYears: 1 },
    KASKO_BLACK: { minAge: 25, minLicenseYears: 3 },
    KASKO_SIGNATURE: { minAge: 30, minLicenseYears: 5 },
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
