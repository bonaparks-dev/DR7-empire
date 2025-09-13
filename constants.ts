import type { RentalCategory, MembershipTier, Lottery, RentalSpec } from './types';
import { UsersIcon, CogIcon, ZapIcon, AnchorIcon, HomeIcon, PaperAirplaneIcon, WifiIcon, BathIcon } from './components/icons/Icons';

const newCarDataRaw = [
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
    "image": "/alpha.png",
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
    "image": "/hummer.png"
  },
  {
    "id": 3,
    "name": "Audi RS3",
    "dailyPrice": 60,
    "specs": {
      "acceleration": "0–100 in 3.8s",
      "maxSpeed": "Max speed: 250km/h",
      "power": "400Cv",
      "torque": "500Nm",
      "engine": "2.5L inline 5-cylinder"
    },
    "image": "/audi-rs3-green.jpg",
    "color": "Verde"
  },
  {
    "id": 4,
    "name": "Audi RS3",
    "dailyPrice": 60,
    "specs": {
      "acceleration": "0–100 in 3.8s",
      "power": "400Cv",
      "torque": "500Nm",
      "engine": "2.5L inline 5-cylinder"
    },
    "image": "/Rs3-red.png",
    "color": "Rossa"
  },
  {
    "id": 5,
    "name": "Mercedes A45 S AMG",
    "dailyPrice": 60,
    "specs": {
      "acceleration": "0–100 in 3.9s",
      "power": "421Cv",
      "torque": "500Nm",
      "engine": "2.0L 4-cylinder Turbo"
    },
    "image": "/mercedes-a45s-grey.jpg"
  },
  {
    "id": 6,
    "name": "BMW M2",
    "dailyPrice": 80,
    "specs": {
      "acceleration": "0–100 in 4.1s",
      "power": "460Cv",
      "torque": "550Nm",
      "engine": "3.0L inline 6-cylinder"
    },
    "image": "/bmw-m2-silver.jpg",
    "available": false
  },
  {
    "id": 7,
    "name": "BMW M3 Competition",
    "dailyPrice": 80,
    "specs": {
      "acceleration": "0–100 in 3.9s",
      "maxSpeed": "Max speed: 250km/h",
      "power": "510Cv",
      "torque": "650Nm",
      "engine": "3.0L inline 6-cylinder"
    },
    "image": "/bmw-m3-green.jpg"
  },
  {
    "id": 8,
    "name": "Mercedes GLE 53 AMG",
    "dailyPrice": 80,
    "specs": {
      "acceleration": "0–100 in 4.7s",
      "maxSpeed": "Max speed: 250km/h",
      "power": "435Cv",
      "torque": "520Nm",
      "engine": "3.0L inline 6-cylinder"
    },
    "image": "/mercedes-gle53-grey.jpg"
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
    "image": "/bmw-m4-blue.jpg"
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
    "image": "/porsche-911.png"
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
    "image": "/c63.png"
  },
  {
    "id": 12,
    "name": "Porsche Macan GTS",
    "dailyPrice": 120,
    "specs": {
      "acceleration": "0–100 in 4.5s",
      "power": "440Cv",
      "torque": "550Nm",
      "engine": "2.9L Twin-Turbo V6"
    },
    "image": "/macan.png"
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
    "image": "/mercedes-gle.png"
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
    "image": "/ferrari-portofino-red.jpg"
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
    "image": "/urus.png"
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
    "image": "/fiat-ducato-white.jpg",
    "available": true
  },
  {
    "id": 17,
    "name": "Mercedes E63 S AMG",
    "dailyPrice": 140,
    "specs": {
      "acceleration": "0–100 in 3.4s",
      "maxSpeed": "Max speed: 300km/h",
      "power": "612Cv",
      "torque": "850Nm",
      "engine": "4.0L V8 BiTurbo"
    },
    "image": "/mercedes-e63s-grey.jpg",
    "available": true
  }
];

const specMapping = {
    acceleration: { label: { en: 'Acceleration', it: 'Accelerazione' }, icon: ZapIcon },
    power: { label: { en: 'Power', it: 'Potenza' }, icon: ZapIcon },
    torque: { label: { en: 'Torque', it: 'Coppia' }, icon: CogIcon },
    engine: { label: { en: 'Engine', it: 'Motore' }, icon: CogIcon },
    maxSpeed: { label: { en: 'Top Speed', it: 'Velocità Massima' }, icon: ZapIcon },
    special: { label: { en: 'Special', it: 'Speciale' }, icon: UsersIcon },
    extras: { label: { en: 'Extras', it: 'Extra' }, icon: UsersIcon },
};

const carData = newCarDataRaw.map(car => {
    const specs: RentalSpec[] = Object.entries(car.specs).map(([key, value]) => {
        const specInfo = specMapping[key as keyof typeof specMapping];
        if (!specInfo) return null;
        return { ...specInfo, value };
    }).filter((spec): spec is RentalSpec => spec !== null);

    return {
        id: `car${car.id}`,
        name: car.color ? `${car.name} (${car.color})` : car.name,
        image: car.image,
        pricePerDay: {
            usd: car.dailyPrice * 1.1,
            eur: car.dailyPrice,
            crypto: car.dailyPrice / 30000,
        },
        specs,
    };
});


const yachtData = [
    { id: 'yacht1', name: 'Azimut Grande 27M', image: 'https://picsum.photos/seed/azimut-yacht-ocean-sun/800/600', pricePerDay: { usd: 12000, eur: 11000, crypto: 0.35 }, specs: [ { label: { en: 'Length', it: 'Lunghezza' }, value: '27m', icon: AnchorIcon }, { label: { en: 'Cabins', it: 'Cabine' }, value: '5', icon: HomeIcon }, { label: { en: 'Guests', it: 'Ospiti' }, value: '10', icon: UsersIcon } ] },
    { id: 'yacht2', name: 'Riva 110 Dolcevita', image: 'https://picsum.photos/seed/riva-dolcevita-yacht-deck/800/600', pricePerDay: { usd: 18000, eur: 16500, crypto: 0.5 }, specs: [ { label: { en: 'Length', it: 'Lunghezza' }, value: '34m', icon: AnchorIcon }, { label: { en: 'Cabins', it: 'Cabine' }, value: '5', icon: HomeIcon }, { label: { en: 'Guests', it: 'Ospiti' }, value: '10', icon: UsersIcon } ] },
    { id: 'yacht3', name: 'Feadship Symphony', image: 'https://picsum.photos/seed/feadship-yacht-monaco-port/800/600', pricePerDay: { usd: 150000, eur: 138000, crypto: 4.5 }, specs: [ { label: { en: 'Length', it: 'Lunghezza' }, value: '101m', icon: AnchorIcon }, { label: { en: 'Cabins', it: 'Cabine' }, value: '8', icon: HomeIcon }, { label: { en: 'Guests', it: 'Ospiti' }, value: '16', icon: UsersIcon } ] },
    { id: 'yacht4', name: 'Lürssen Azzam', image: 'https://picsum.photos/seed/lurssen-yacht-sea-aerial/800/600', pricePerDay: { usd: 400000, eur: 368000, crypto: 12 }, specs: [ { label: { en: 'Length', it: 'Lunghezza' }, value: '180m', icon: AnchorIcon }, { label: { en: 'Cabins', it: 'Cabine' }, value: '18', icon: HomeIcon }, { label: { en: 'Guests', it: 'Ospiti' }, value: '36', icon: UsersIcon } ] },
    { id: 'yacht5', name: 'Benetti Lana', image: 'https://picsum.photos/seed/benetti-lana-yacht-pool/800/600', pricePerDay: { usd: 200000, eur: 184000, crypto: 6 }, specs: [ { label: { en: 'Length', it: 'Lunghezza' }, value: '107m', icon: AnchorIcon }, { label: { en: 'Cabins', it: 'Cabine' }, value: '8', icon: HomeIcon }, { label: { en: 'Guests', it: 'Ospiti' }, value: '12', icon: UsersIcon } ] },
    { id: 'yacht6', name: 'Sunseeker 131', image: 'https://picsum.photos/seed/sunseeker-yacht-mediterranean/800/600', pricePerDay: { usd: 35000, eur: 32200, crypto: 1 }, specs: [ { label: { en: 'Length', it: 'Lunghezza' }, value: '40m', icon: AnchorIcon }, { label: { en: 'Cabins', it: 'Cabine' }, value: '6', icon: HomeIcon }, { label: { en: 'Guests', it: 'Ospiti' }, value: '12', icon: UsersIcon } ] },
    { id: 'yacht7', name: 'Princess Y85', image: 'https://picsum.photos/seed/princess-yacht-interior/800/600', pricePerDay: { usd: 15000, eur: 13800, crypto: 0.45 }, specs: [ { label: { en: 'Length', it: 'Lunghezza' }, value: '26m', icon: AnchorIcon }, { label: { en: 'Cabins', it: 'Cabine' }, value: '4', icon: HomeIcon }, { label: { en: 'Guests', it: 'Ospiti' }, value: '8', icon: UsersIcon } ] },
    { id: 'yacht8', name: 'Ferretti 1000', image: 'https://picsum.photos/seed/ferretti-yacht-sunset-wake/800/600', pricePerDay: { usd: 22000, eur: 20200, crypto: 0.65 }, specs: [ { label: { en: 'Length', it: 'Lunghezza' }, value: '30m', icon: AnchorIcon }, { label: { en: 'Cabins', it: 'Cabine' }, value: '5', icon: HomeIcon }, { label: { en: 'Guests', it: 'Ospiti' }, value: '10', icon: UsersIcon } ] },
];

const newVillas = [
  { id: 1, name: "Villa 50m from the Beach", maxGuests: 9, bedrooms: 4, bathrooms: 4, image: "/elicriso1.png", price: 800 },
  { id: 2, name: "Villa by the Sea", maxGuests: 6, bedrooms: 3, bathrooms: 2, image: "/ginepro1.png", price: 600 },
  { id: 3, name: "Villa with Cliffside Pool", maxGuests: 12, bedrooms: 6, bathrooms: 5, image: "/ambra1.png", price: 2500 },
  { id: 4, name: "Villa Blue Bay", maxGuests: 6, bedrooms: 3, bathrooms: 2, image: "/loly1.png", price: 700 },
  { id: 5, name: "Villa 100m from the Beach", maxGuests: 9, bedrooms: 4, bathrooms: 3, image: "/glicine1.png", price: 750 },
  { id: 6, name: "Luxury House, Cagliari Center", maxGuests: 4, bedrooms: 2, bathrooms: 2, image: "/laj1.png", price: 400 },
  { id: 7, name: "Villa with Heated Jacuzzi", maxGuests: 6, bedrooms: 3, bathrooms: 2, image: "/josy1.png", price: 900 },
  { id: 8, name: "Villa Costa Smeralda", maxGuests: 8, bedrooms: 4, bathrooms: 3, image: "/white1.png", price: 1200 },
  { id: 9, name: "Villa with Heated Pool", maxGuests: 4, bedrooms: 2, bathrooms: 2, image: "/crystal1.png", price: 1500 }
];

const villaData = newVillas.map(villa => ({
    id: `villa${villa.id}`,
    name: villa.name,
    image: villa.image,
    pricePerDay: {
        usd: Math.round(villa.price * 1.1),
        eur: villa.price,
        crypto: parseFloat((villa.price / 60000).toFixed(3)),
    },
    specs: [
        { label: { en: 'Guests', it: 'Ospiti' }, value: String(villa.maxGuests), icon: UsersIcon },
        { label: { en: 'Bedrooms', it: 'Camere da Letto' }, value: String(villa.bedrooms), icon: HomeIcon },
        { label: { en: 'Bathrooms', it: 'Bagni' }, value: String(villa.bathrooms), icon: BathIcon }
    ]
}));

const jetData = [
    { id: 'jet1', name: 'Gulfstream G700', image: 'https://picsum.photos/seed/gulfstream-g700-jet-sky-wing/800/600', pricePerDay: { usd: 90000, eur: 82000, crypto: 2.5 }, specs: [ { label: { en: 'Range', it: 'Autonomia' }, value: '13,890 km', icon: PaperAirplaneIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '19', icon: UsersIcon }, { label: { en: 'Wi-Fi', it: 'Wi-Fi' }, value: 'Ka-band', icon: WifiIcon } ] },
    { id: 'jet2', name: 'Bombardier Global 8000', image: 'https://picsum.photos/seed/bombardier-global-runway-jet/800/600', pricePerDay: { usd: 120000, eur: 110000, crypto: 3.5 }, specs: [ { label: { en: 'Range', it: 'Autonomia' }, value: '14,816 km', icon: PaperAirplaneIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '19', icon: UsersIcon }, { label: { en: 'Wi-Fi', it: 'Wi-Fi' }, value: 'High-Speed', icon: WifiIcon } ] },
    { id: 'jet3', name: 'Cessna Citation Longitude', image: 'https://picsum.photos/seed/cessna-citation-jet-clouds/800/600', pricePerDay: { usd: 55000, eur: 50600, crypto: 1.6 }, specs: [ { label: { en: 'Range', it: 'Autonomia' }, value: '6,482 km', icon: PaperAirplaneIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '12', icon: UsersIcon }, { label: { en: 'Wi-Fi', it: 'Wi-Fi' }, value: 'Standard', icon: WifiIcon } ] },
];

const helicopterData = [
    { id: 'heli1', name: 'Airbus ACH160', image: 'https://picsum.photos/seed/airbus-ach160-helicopter-city/800/600', pricePerDay: { usd: 20000, eur: 18500, crypto: 0.6 }, specs: [ { label: { en: 'Range', it: 'Autonomia' }, value: '852 km', icon: PaperAirplaneIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '10', icon: UsersIcon }, { label: { en: 'Speed', it: 'Velocità' }, value: '287 km/h', icon: ZapIcon } ] },
    { id: 'heli2', name: 'Bell 525 Relentless', image: 'https://picsum.photos/seed/bell-525-helicopter-mountains/800/600', pricePerDay: { usd: 28000, eur: 25700, crypto: 0.85 }, specs: [ { label: { en: 'Range', it: 'Autonomia' }, value: '926 km', icon: PaperAirplaneIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '16', icon: UsersIcon }, { label: { en: 'Speed', it: 'Velocità' }, value: '306 km/h', icon: ZapIcon } ] },
    { id: 'heli3', name: 'Sikorsky S-92', image: 'https://picsum.photos/seed/sikorsky-s92-helicopter-offshore/800/600', pricePerDay: { usd: 35000, eur: 32200, crypto: 1 }, specs: [ { label: { en: 'Range', it: 'Autonomia' }, value: '999 km', icon: PaperAirplaneIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '19', icon: UsersIcon }, { label: { en: 'Speed', it: 'Velocità' }, value: '280 km/h', icon: ZapIcon } ] },
];


export const RENTAL_CATEGORIES: RentalCategory[] = [
    { id: 'cars', label: { en: 'Cars', it: 'Auto' }, data: carData },
    { id: 'yachts', label: { en: 'Yachts', it: 'Yacht' }, data: yachtData },
    { id: 'villas', label: { en: 'Villas', it: 'Ville' }, data: villaData },
    { id: 'helicopters', label: { en: 'Helicopters', it: 'Elicotteri' }, data: helicopterData },
    { id: 'jets', label: { en: 'Private Jets', it: 'Jet Privati' }, data: jetData },
];

export const MEMBERSHIP_TIERS: MembershipTier[] = [
    { id: 'basic', name: { en: 'Basic', it: 'Base' }, price: { monthly: { usd: 500, eur: 450, crypto: 0.015 }, annually: { usd: 5000, eur: 4500, crypto: 0.15 } }, features: { en: ['Access to premium rentals', 'Standard support', 'Basic event invites'], it: ['Accesso a noleggi premium', 'Supporto standard', 'Inviti a eventi base'] } },
    { id: 'premium', name: { en: 'Premium', it: 'Premium' }, price: { monthly: { usd: 1500, eur: 1350, crypto: 0.045 }, annually: { usd: 15000, eur: 13500, crypto: 0.45 } }, features: { en: ['All Basic features', 'Priority booking', '24/7 concierge service', 'Exclusive event access'], it: ['Tutti i vantaggi Base', 'Prenotazione prioritaria', 'Servizio concierge 24/7', 'Accesso a eventi esclusivi'] }, isPopular: true },
    { id: 'signature', name: { en: 'Signature', it: 'Signature' }, price: { monthly: { usd: 5000, eur: 4600, crypto: 0.15 }, annually: { usd: 50000, eur: 46000, crypto: 1.5 } }, features: { en: ['All Premium features', 'Guaranteed availability', 'Personal lifestyle manager', 'Access to off-market assets'], it: ['Tutti i vantaggi Premium', 'Disponibilità garantita', 'Manager personale lifestyle', 'Accesso a beni fuori mercato'] } },
];

export const LOTTERY_GIVEAWAY: Lottery = {
  id: 'giveaway1',
  name: { en: 'Win a Lamborghini Revuelto', it: 'Vinci una Lamborghini Revuelto' },
  description: { 
    en: 'Participate in the DR7 Lottery for a chance to win the revolutionary Lamborghini Revuelto. With its V12 hybrid engine, this masterpiece of engineering could be yours. Each ticket brings you one step closer to owning a legend.',
    it: 'Partecipa alla Lotteria DR7 per avere la possibilità di vincere la rivoluzionaria Lamborghini Revuelto. Con il suo motore ibrido V12, questo capolavoro di ingegneria potrebbe essere tuo. Ogni biglietto ti avvicina a possedere una leggenda.'
  },
  image: 'https://picsum.photos/seed/lamborghini-revuelto-win/1200/800',
  ticketPriceUSD: 22,
  ticketPriceEUR: 20,
  drawDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
};

export const PICKUP_LOCATIONS = [
  { id: 'cagliari_airport', label: { en: 'Cagliari Elmas Airport', it: 'Aeroporto di Cagliari Elmas' } },
  { id: 'dr7_office', label: { en: 'DR7 Office Cagliari', it: 'Ufficio DR7 Cagliari' } },
];

export const INSURANCE_ELIGIBILITY = {
  KASKO_BASE: {
    minAge: 18,
    minLicenseYears: 2,
    description: "Base KASKO insurance requires at least 2 years of driving license."
  },
  KASKO_BLACK: {
    minAge: 25,
    minLicenseYears: 5,
    description: "Black KASKO insurance requires at least 25 years old and 5 years of driving license."
  },
  KASKO_SIGNATURE: {
    minAge: 30,
    minLicenseYears: 10,
    description: "Signature KASKO insurance requires at least 30 years old and 10 years of driving license."
  }
};

export const VALIDATION_MESSAGES = {
  en: {
    base: "You must have at least 2 years of driving experience for KASKO BASE.",
    black: "You must be at least 25 years old and have 5 years of driving experience for KASKO BLACK.",
    signature: "You must be at least 30 years old and have 10 years of driving experience for KASKO SIGNATURE."
  },
  it: {
    base: "Devi avere almeno 2 anni di esperienza di guida per il KASKO BASE.",
    black: "Devi avere almeno 25 anni e 5 anni di esperienza di guida per il KASKO BLACK.",
    signature: "Devi avere almeno 30 anni e 10 anni di esperienza di guida per il KASKO SIGNATURE."
  }
};

export const INSURANCE_OPTIONS = [
  { id: 'KASKO_BASE', label: { en: 'Basic Cover (KASKO BASE)', it: 'Copertura Base (KASKO BASE)' }, description: { en: 'Standard liability coverage.', it: 'Copertura di responsabilità standard.' }, pricePerDay: { usd: 0, eur: 0 } },
  { id: 'KASKO_BLACK', label: { en: 'Premium Cover (KASKO BLACK)', it: 'Copertura Premium (KASKO BLACK)' }, description: { en: 'Reduced excess and windscreen cover.', it: 'Franchigia ridotta e copertura parabrezza.' }, pricePerDay: { usd: 30, eur: 28 } },
  { id: 'KASKO_SIGNATURE', label: { en: 'Full Cover (KASKO SIGNATURE)', it: 'Copertura Completa (KASKO SIGNATURE)' }, description: { en: 'Zero excess. Complete peace of mind.', it: 'Zero franchigia. Massima tranquillità.' }, pricePerDay: { usd: 50, eur: 46 } },
];

export const RENTAL_EXTRAS = [
  { id: 'gps', label: { en: 'GPS Navigation', it: 'Navigatore GPS' }, pricePerDay: { usd: 10, eur: 9 } },
  { id: 'child_seat', label: { en: 'Child Seat', it: 'Seggiolino per Bambini' }, pricePerDay: { usd: 15, eur: 14 } },
  { id: 'additional_driver', label: { en: 'Additional Driver', it: 'Guidatore Aggiuntivo' }, pricePerDay: { usd: 25, eur: 23 } },
];

export const COUNTRIES = [
    { name: 'United States', code: 'US' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'Italy', code: 'IT' },
    { name: 'France', code: 'FR' },
    { name: 'Germany', code: 'DE' },
    { name: 'Spain', code: 'ES' },
    { name: 'United Arab Emirates', code: 'AE' },
    { name: 'Switzerland', code: 'CH' },
    { name: 'Monaco', code: 'MC' },
    { name: 'Canada', code: 'CA' },
    { name: 'Australia', code: 'AU' },
    { name: 'Japan', code: 'JP' },
    { name: 'China', code: 'CN' },
    { name: 'Russia', code: 'RU' },
    { name: 'Brazil', code: 'BR' },
    { name: 'India', code: 'IN' },
    { name: 'Netherlands', code: 'NL' },
    { name: 'Sweden', code: 'SE' },
    { name: 'Norway', code: 'NO' },
    { name: 'Denmark', code: 'DK' },
];

export const GOOGLE_REVIEWS = [
  {
    id: 'review-1',
    name: 'Alex Johnson',
    avatar: 'https://avatar.iran.liara.run/username?username=Alex+Johnson',
    rating: 5,
    review: 'Unforgettable experience! The Lamborghini was pristine, and the service from DR7 was impeccable. Felt like a VIP from start to finish.',
    date: '2 weeks ago',
  },
  {
    id: 'review-2',
    name: 'Sophia Chen',
    avatar: 'https://avatar.iran.liara.run/username?username=Sophia+Chen',
    rating: 5,
    review: 'Rented a yacht for a day trip. The crew was professional, and the vessel was magnificent. It was the highlight of our vacation in Sardinia.',
    date: '1 month ago',
  },
  {
    id: 'review-3',
    name: 'Liam O\'Connell',
    avatar: 'https://avatar.iran.liara.run/username?username=Liam+OConnell',
    rating: 5,
    review: 'The DR7 Club membership is worth every penny. The concierge service is phenomenal and has arranged everything for me, flawlessly.',
    date: '3 weeks ago',
  },
  {
    id: 'review-4',
    name: 'Isabella Rossi',
    avatar: 'https://avatar.iran.liara.run/username?username=Isabella+Rossi',
    rating: 5,
    review: 'Booking our villa through DR7 was seamless. The property was breathtaking, and their attention to detail made our stay perfect. Highly recommended.',
    date: '1 week ago',
  },
  {
    id: 'review-5',
    name: 'Marcus Holloway',
    avatar: 'https://avatar.iran.liara.run/username?username=Marcus+Holloway',
    rating: 4,
    review: 'Great selection of cars. The pickup process at the airport was smooth. The car had a minor scuff, but it was noted and didn\'t affect the drive.',
    date: '2 months ago',
  },
  {
    id: 'review-6',
    name: 'Chloé Dubois',
    avatar: 'https://avatar.iran.liara.run/username?username=Chloe+Dubois',
    rating: 5,
    review: 'Absolutely first-class service. The private jet charter was handled with utmost professionalism and discretion. Will be using their services again.',
    date: '1 month ago',
  },
  {
      id: 'review-7',
      name: 'Kenji Tanaka',
      avatar: 'https://avatar.iran.liara.run/username?username=Kenji+Tanaka',
      rating: 5,
      review: 'Participated in the lottery and while I didn\'t win the grand prize, the experience was fun and well-organized. A very professional platform.',
      date: '3 days ago',
  }
];