import type { RentalCategory, MembershipTier, Lottery, Amenity, Villa } from './types';
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
} from './components/icons/Icons';

const carSpecs = [
    { label: { en: 'Seats', it: 'Posti' }, value: '2', icon: UsersIcon },
    { label: { en: 'Transmission', it: 'Cambio' }, value: 'Auto', icon: CogIcon },
    { label: { en: 'HP', it: 'CV' }, value: '700+', icon: ZapIcon },
];

const yachtSpecs = [
    { label: { en: 'Guests', it: 'Ospiti' }, value: '12', icon: UsersIcon },
    { label: { en: 'Length', it: 'Lunghezza' }, value: '70m', icon: AnchorIcon },
    { label: { en: 'Cabins', it: 'Cabine' }, value: '6', icon: BedIcon },
];

const jetSpecs = [
    { label: { en: 'Passengers', it: 'Passeggeri' }, value: '12', icon: UsersIcon },
    { label: { en: 'Range', it: 'Autonomia' }, value: '6000 nm', icon: PaperAirplaneIcon },
    { label: { en: 'Speed', it: 'Velocità' }, value: '500 kt', icon: ZapIcon },
];

const helicopterSpecs = [
    { label: { en: 'Passengers', it: 'Passeggeri' }, value: '5', icon: UsersIcon },
    { label: { en: 'Range', it: 'Autonomia' }, value: '300 nm', icon: PaperAirplaneIcon },
    { label: { en: 'Speed', it: 'Velocità' }, value: '150 kt', icon: ZapIcon },
];

export const VILLAS: Villa[] = [
  {
    id: 1,
    title: "Villa 50m from the Beach",
    location: "Geremeas, Sardegna",
    distanceToBeach: "50m dalla Spiaggia",
    maxGuests: 9,
    bedrooms: 4,
    bathrooms: 4,
    images: ["/elicriso1.png", "/elicriso2.png", "/elicriso3.png", "/elicriso4.png"],
    description: "Villa di lusso con piscina riscaldata e vista mare a soli 50 metri dalla spiaggia incontaminata di Geremeas.",
    rating: 4.9,
    reviewCount: 28
  },
  {
    id: 2,
    title: "Villa by the Sea",
    location: "Costa del Sud, Sardegna",
    distanceToBeach: "Accesso diretto al mare",
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    images: ["/ginepro1.png", "/ginepro2.png", "/ginepro3.png", "/ginepro4.png"],
    description: "Villa elegante con vista mare mozzafiato e accesso diretto alla spiaggia privata.",
    rating: 4.8,
    reviewCount: 22
  },
  {
    id: 3,
    title: "Villa with cliffside pool and private access to the sea",
    location: "Costa Smeralda, Sardegna",
    distanceToBeach: "Accesso privato al mare",
    maxGuests: 12,
    bedrooms: 6,
    bathrooms: 5,
    images: ["/ambra1.png", "/ambra2.png", "/ambra3.png", "/ambra4.png"],
    description: "Villa esclusiva di 400m² con piscina a strapiombo sul mare e accesso privato alla spiaggia.",
    rating: 4.9,
    reviewCount: 35
  },
  {
    id: 4,
    title: "Villa Blue Bay",
    location: "Blue Bay, Sardegna",
    distanceToBeach: "Vista mare",
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    images: ["/loly1.png", "/loly2.png", "/loly3.png", "/loly4.png"],
    description: "Villa moderna con piscina privata e vista panoramica sulla splendida Blue Bay.",
    rating: 4.7,
    reviewCount: 18
  },
  {
    id: 5,
    title: "Villa 100 mt from the beach",
    location: "Costa del Sud, Sardegna",
    distanceToBeach: "100m dalla Spiaggia",
    maxGuests: 9,
    bedrooms: 4,
    bathrooms: 3,
    images: ["/glicine1.png", "/glicine2.png", "/glicine3.png", "/glicine4.png"],
    description: "Villa tradizionale sarda a soli 100 metri dalla spiaggia con giardino mediterraneo.",
    rating: 4.6,
    reviewCount: 25
  },
  {
    id: 6,
    title: "Luxury House, Cagliari center",
    location: "Cagliari Centro, Sardegna",
    distanceToBeach: "Centro città",
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    images: ["/laj1.png", "/laj2.png", "/laj3.png", "/laj4.png"],
    description: "Casa elegante di 250m² nel centro storico di Cagliari con vista sulla città e comfort moderni.",
    rating: 4.5,
    reviewCount: 15
  },
  {
    id: 7,
    title: "Villa by the Sea with Heated Outdoor Jacuzzi",
    location: "Costa del Sud, Sardegna",
    distanceToBeach: "Accesso diretto al mare",
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    images: ["/josy1.png", "/josy2.png", "/josy3.png", "/josy4.png"],
    description: "Villa esclusiva sul mare con jacuzzi riscaldata all'aperto e accesso privato alla spiaggia.",
    rating: 4.8,
    reviewCount: 29
  },
  {
    id: 8,
    title: "Villa Costa Smeralda",
    location: "Costa Smeralda, Sardegna",
    distanceToBeach: "Vista mare",
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    images: ["/white1.png", "/white2.png", "/white3.png", "/white4.png"],
    description: "Villa moderna di 200m² con design minimalista, vista panoramica sul mare e spazi esterni raffinati.",
    rating: 4.7,
    reviewCount: 33
  },
  {
    id: 9,
    title: "Villa privacy on the sea, heated pool",
    location: "Costa Smeralda, Sardegna",
    distanceToBeach: "Accesso privato al mare",
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    images: ["/crystal1.png", "/crystal2.png", "/crystal3.png", "/crystal4.png"],
    description: "Villa esclusiva di 150m² con piscina riscaldata, privacy totale sul mare e design di lusso contemporaneo.",
    rating: 4.9,
    reviewCount: 18
  }
];

const mappedVillas = VILLAS.map(v => ({
  id: `villa-${v.id}`,
  name: v.title,
  image: v.images[0],
  specs: [
    { label: { en: 'Guests', it: 'Ospiti' }, value: v.maxGuests.toString(), icon: UsersIcon },
    { label: { en: 'Bedrooms', it: 'Camere' }, value: v.bedrooms.toString(), icon: BedIcon },
    { label: { en: 'Bathrooms', it: 'Bagni' }, value: v.bathrooms.toString(), icon: BathIcon },
  ],
  location: v.location,
  distanceToBeach: v.distanceToBeach,
  images: v.images,
  description: { en: v.description, it: v.description },
}));

export const RENTAL_CATEGORIES: RentalCategory[] = [
  {
    id: 'cars',
    label: { en: 'Cars', it: 'Auto' },
    data: [
      { id: 'car-1', name: 'Lamborghini Revuelto', image: '/cars/revuelto.jpeg', pricePerDay: { usd: 3500, eur: 3200, crypto: 0 }, specs: carSpecs },
      { id: 'car-2', name: 'Ferrari 296 GTB', image: '/cars/296gtb.jpeg', pricePerDay: { usd: 3200, eur: 2900, crypto: 0 }, specs: carSpecs },
      { id: 'car-3', name: 'Rolls Royce Cullinan', image: '/cars/cullinan.jpeg', pricePerDay: { usd: 2800, eur: 2500, crypto: 0 }, specs: [{ label: { en: 'Seats', it: 'Posti' }, value: '4', icon: UsersIcon }, carSpecs[1], carSpecs[2]] },
    ],
  },
  {
    id: 'yachts',
    label: { en: 'Yachts', it: 'Yacht' },
    data: [
      { id: 'yacht-1', name: 'Azimut Grande 27M', image: '/yachts/azimut.jpeg', pricePerDay: { usd: 12000, eur: 11000, crypto: 0 }, specs: yachtSpecs },
      { id: 'yacht-2', name: 'Ferretti 920', image: '/yachts/ferretti.jpeg', pricePerDay: { usd: 15000, eur: 13500, crypto: 0 }, specs: yachtSpecs },
    ],
  },
  {
    id: 'villas',
    label: { en: 'Villas', it: 'Ville' },
    data: mappedVillas,
  },
  {
    id: 'jets',
    label: { en: 'Jets', it: 'Jet' },
    data: [
      { id: 'jet-1', name: 'Gulfstream G650', image: '/jets/gulfstream.jpeg', pricePerDay: { usd: 25000, eur: 23000, crypto: 0 }, specs: jetSpecs },
    ],
  },
  {
    id: 'helicopters',
    label: { en: 'Helicopters', it: 'Elicotteri' },
    data: [
      { id: 'heli-1', name: 'Airbus H130', image: '/helicopters/airbus.jpeg', pricePerDay: { usd: 8000, eur: 7300, crypto: 0 }, specs: helicopterSpecs },
    ],
  },
];


export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: 'silver',
    name: { en: 'Silver', it: 'Argento' },
    price: { monthly: { usd: 500, eur: 450, crypto: 0 }, annually: { usd: 5000, eur: 4500, crypto: 0 } },
    features: {
        en: ['Priority booking access', 'Dedicated concierge contact', 'Exclusive member-only offers'],
        it: ['Accesso prioritario alle prenotazioni', 'Contatto concierge dedicato', 'Offerte esclusive per i membri']
    },
  },
  {
    id: 'gold',
    name: { en: 'Gold', it: 'Oro' },
    price: { monthly: { usd: 1500, eur: 1350, crypto: 0 }, annually: { usd: 15000, eur: 13500, crypto: 0 } },
    features: {
        en: ['All Silver benefits', 'Guaranteed vehicle availability', 'Airport transfers included', 'Invitations to private events'],
        it: ['Tutti i vantaggi Silver', 'Disponibilità veicolo garantita', 'Trasferimenti aeroportuali inclusi', 'Inviti a eventi privati']
    },
    isPopular: true,
  },
  {
    id: 'platinum',
    name: { en: 'Platinum', it: 'Platino' },
    price: { monthly: { usd: 3000, eur: 2700, crypto: 0 }, annually: { usd: 30000, eur: 27000, crypto: 0 } },
    features: {
        en: ['All Gold benefits', 'Access to off-market assets', 'Personal lifestyle manager', 'Complimentary upgrades'],
        it: ['Tutti i vantaggi Gold', 'Accesso ad asset fuori mercato', 'Manager personale per lo stile di vita', 'Upgrade gratuiti']
    },
  },
];

export const LOTTERY_GIVEAWAY: Lottery = {
  id: 'lotto-1',
  name: { en: 'Lamborghini Revuelto 2024', it: 'Lamborghini Revuelto 2024' },
  description: {
    en: 'Win a brand new Lamborghini Revuelto. The V12 hybrid plug-in HPEV (High Performance Electrified Vehicle). A new paradigm in terms of performance, sportiness and driving pleasure.',
    it: 'Vinci una Lamborghini Revuelto nuova di zecca. L\'HPEV (High Performance Electrified Vehicle) ibrido plug-in V12. Un nuovo paradigma in termini di prestazioni, sportività e piacere di guida.'
  },
  image: '/cars/revuelto.jpeg',
  ticketPriceUSD: 50,
  ticketPriceEUR: 45,
  drawDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
};

export const GOOGLE_REVIEWS = [
    { id: 1, name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', date: '2 weeks ago', rating: 5, review: 'Exceptional service and an incredible selection of vehicles. The team at DR7 made our trip unforgettable. The booking process was seamless, and the car was immaculate. Highly recommend!' },
    { id: 2, name: 'Maria Garcia', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704e', date: '1 month ago', rating: 5, review: 'Renting a yacht through DR7 was the highlight of our vacation. The crew was professional, and the yacht itself was stunning. A truly first-class experience from start to finish.' },
    { id: 3, name: 'David Chen', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704f', date: '3 months ago', rating: 5, review: 'The villa we booked was even more beautiful in person. DR7\'s attention to detail and customer service is second to none. They handled every request with professionalism and care.' },
];

export const PICKUP_LOCATIONS = [
    { id: 'cagliari_airport', label: { en: 'Cagliari Elmas Airport', it: 'Aeroporto di Cagliari Elmas' } },
    { id: 'cagliari_office', label: { en: 'DR7 Office Cagliari', it: 'Ufficio DR7 Cagliari' } },
];

export const INSURANCE_OPTIONS = [
    { id: 'KASKO_BASE', label: { en: 'Basic Cover', it: 'Copertura Base' }, description: { en: 'Standard liability coverage.', it: 'Copertura di responsabilità standard.' }, pricePerDay: { usd: 50, eur: 45, crypto: 0 } },
    { id: 'KASKO_BLACK', label: { en: 'Premium Cover', it: 'Copertura Premium' }, description: { en: 'Reduced excess and windscreen cover.', it: 'Franchigia ridotta e copertura parabrezza.' }, pricePerDay: { usd: 80, eur: 72, crypto: 0 } },
    { id: 'KASKO_SIGNATURE', label: { en: 'Full Cover', it: 'Copertura Completa' }, description: { en: 'Zero excess. Complete peace of mind.', it: 'Zero franchigia. Massima tranquillità.' }, pricePerDay: { usd: 120, eur: 110, crypto: 0 } },
];

export const RENTAL_EXTRAS = [
    { id: 'gps', label: { en: 'GPS Navigation', it: 'Navigatore GPS' }, pricePerDay: { usd: 15, eur: 13, crypto: 0 } },
    { id: 'child_seat', label: { en: 'Child Seat', it: 'Seggiolino per Bambini' }, pricePerDay: { usd: 10, eur: 9, crypto: 0 } },
    { id: 'additional_driver', label: { en: 'Additional Driver', it: 'Guidatore Aggiuntivo' }, pricePerDay: { usd: 25, eur: 22, crypto: 0 } },
];

export const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'IT', name: 'Italy' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'AE', name: 'United Arab Emirates' },
];

export const INSURANCE_ELIGIBILITY = {
    KASKO_SIGNATURE: { minAge: 30, minLicenseYears: 5 },
    KASKO_BLACK: { minAge: 25, minLicenseYears: 3 },
    KASKO_BASE: { minAge: 21, minLicenseYears: 1 },
};

export const VALIDATION_MESSAGES = {
    en: {
      base: "Driver does not meet the minimum requirements for any insurance plan. Please contact us for assistance.",
    },
    it: {
      base: "Il conducente non soddisfa i requisiti minimi per nessun piano assicurativo. Vi preghiamo di contattarci per assistenza.",
    }
};