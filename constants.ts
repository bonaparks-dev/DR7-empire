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
  ShieldIcon,
  CrownIcon,
} from './components/icons/Icons';

export const GOOGLE_CLIENT_ID = "380173701007-jn8ahgmtb039g5pfjmkvgb33rr75of8f.apps.googleusercontent.com";

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
    size: "400 m²",
    images: ["/ambra1.png", "/ambra2.png", "/ambra3.png", "/ambra4.png"],
    rating: 4.9,
    reviewCount: 35,
    description: {
      en: "Enchanting Villa overlooking the sea with a unique architectural style, with a wonderful sea view that can be observed from any corner of the house. Thanks to its outdoor spaces you can spend exclusive moments of relaxation and privacy admiring the colorful sunsets.",
      it: "Incantevole Villa con vista sul mare dallo stile architettonico unico, con una meravigliosa vista mare che può essere osservata da ogni angolo della casa. Grazie ai suoi spazi esterni potrete trascorrere momenti esclusivi di relax e privacy ammirando i tramonti colorati."
    },
    amenities: [
      { icon: WavesIcon, title: { en: "Cliffside Pool", it: "Piscina a Strapiombo" }, description: { en: "Infinity pool overlooking the sea", it: "Piscina a sfioro vista mare" } },
      { icon: HomeIcon, title: { en: "Private Sea Access", it: "Accesso Privato al Mare" }, description: { en: "Direct access to crystal waters", it: "Accesso diretto alle acque cristalline" } },
      { icon: TreePineIcon, title: { en: "Panoramic Views", it: "Vista Panoramica" }, description: { en: "Sea view from every corner", it: "Vista mare da ogni angolo" } },
      { icon: WifiIcon, title: { en: "Free WiFi", it: "WiFi Gratuito" }, description: { en: "High-speed internet", it: "Connessione internet veloce" } },
      { icon: CarIcon, title: { en: "Private Parking", it: "Parcheggio Privato" }, description: { en: "Reserved parking space", it: "Posto auto riservato" } },
      { icon: ShieldIcon, title: { en: "24/7 Security", it: "Sicurezza 24/7" }, description: { en: "Security service", it: "Servizio di sorveglianza" } }
    ],
    features: {
      en: [
        "4 luxury double bedrooms",
        "2 additional bunk beds",
        "5 complete bathrooms",
        "Panoramic living room with sea view",
        "Professional equipped kitchen",
        "Multiple panoramic terraces",
        "Outdoor relaxation area",
        "External dining area",
        "Unique modern architecture",
        "Smart TV in all rooms",
        "Air conditioning",
        "High-speed Wi-Fi"
      ],
      it: [
        "4 camere matrimoniali di lusso",
        "2 letti a castello aggiuntivi",
        "5 bagni completi",
        "Soggiorno panoramico vista mare",
        "Cucina professionale attrezzata",
        "Terrazze panoramiche multiple",
        "Area relax all'aperto",
        "Zona pranzo esterna",
        "Architettura unica moderna",
        "Smart TV in tutte le stanze",
        "Aria condizionata",
        "Wi-Fi ad alta velocità"
      ]
    }
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
    size: "250 m²",
    images: ["/laj1.png", "/laj2.png", "/laj3.png", "/laj4.png"],
    rating: 4.5,
    reviewCount: 15,
    description: {
      en: "Elegant 250m² house in the historic center of Cagliari with city view and modern comforts. This unique property combines the charm of traditional Sardinian architecture with modern comforts, offering a breathtaking view of the city and an authentic experience in the cultural center of Sardinia.",
      it: "Casa elegante di 250m² nel centro storico di Cagliari con vista sulla città e comfort moderni. Questa proprietà unica combina il fascino dell'architettura tradizionale sarda con i comfort moderni, offrendo una vista mozzafiato sulla città e un'esperienza autentica nel centro culturale della Sardegna."
    },
    amenities: [
      { icon: Building2Icon, title: { en: "Historic Center", it: "Centro Storico" }, description: { en: "In the heart of Cagliari", it: "Nel cuore di Cagliari" } },
      { icon: CrownIcon, title: { en: "City View", it: "Vista Città" }, description: { en: "Panorama of historic center", it: "Panorama sul centro storico" } },
      { icon: HomeIcon, title: { en: "250m² of Elegance", it: "250m² di Eleganza" }, description: { en: "Spacious and refined spaces", it: "Spazi ampi e raffinati" } },
      { icon: WifiIcon, title: { en: "Free WiFi", it: "WiFi Gratuito" }, description: { en: "High-speed internet", it: "Connessione internet veloce" } },
      { icon: CarIcon, title: { en: "Reserved Parking", it: "Parcheggio Riservato" }, description: { en: "Parking in city center", it: "Posto auto nel centro" } },
      { icon: ShieldIcon, title: { en: "24/7 Security", it: "Sicurezza 24/7" }, description: { en: "Security service", it: "Servizio di sorveglianza" } }
    ],
    features: {
      en: [
        "2 elegant bedrooms",
        "2 modern bathrooms with premium finishes",
        "Spacious living room with city view",
        "Fully equipped kitchen",
        "Panoramic terrace with historic view",
        "Air conditioning in all rooms",
        "Smart TV with international channels",
        "Hi-fi audio system",
        "Digital safe",
        "Professional hair dryer",
        "Premium courtesy set",
        "Strategic central location",
        "Close to restaurants and attractions",
        "Easy access to public transport"
      ],
      it: [
        "2 camere da letto eleganti",
        "2 bagni moderni con finiture di pregio",
        "Ampio soggiorno con vista sulla città",
        "Cucina completamente attrezzata",
        "Terrazza panoramica con vista storica",
        "Aria condizionata in tutte le stanze",
        "Smart TV con canali internazionali",
        "Sistema audio hi-fi",
        "Cassaforte digitale",
        "Asciugacapelli professionale",
        "Set di cortesia premium",
        "Posizione centrale strategica",
        "Vicino a ristoranti e attrazioni",
        "Accesso facile ai trasporti pubblici"
      ]
    }
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
    size: "150 m²",
    images: ["/crystal1.png", "/crystal2.png", "/crystal3.png", "/crystal4.png"],
    rating: 4.9,
    reviewCount: 18,
    description: {
      en: "In the Residence on the Gulf you will find this beautiful Villa with private heated infinity pool plus a large Jacuzzi for 2, surrounded by greenery with breathtaking views of the sea and the most beautiful sunsets of southern Sardinia. An oasis of peace and tranquility for couples seeking maximum privacy in a luxury setting just steps from the crystal clear waters.",
      it: "Nel Residence sul Golfo troverete questa splendida Villa con piscina privata riscaldata a sfioro più una grande Jacuzzi per 2, circondata dal verde con vista mozzafiato sul mare e i più bei tramonti della Sardegna meridionale. Un'oasi di pace e tranquillità per coppie che cercano il massimo della privacy in un ambiente di lusso a pochi passi dalle acque cristalline."
    },
    amenities: [
      { icon: WavesIcon, title: { en: "Heated Infinity Pool", it: "Piscina Riscaldata a Sfioro" }, description: { en: "Private heated infinity pool with sea view", it: "Piscina privata riscaldata a sfioro vista mare" } },
      { icon: CrownIcon, title: { en: "Large Jacuzzi for 2", it: "Grande Jacuzzi per 2" }, description: { en: "Luxury jacuzzi with panoramic views", it: "Jacuzzi di lusso con vista panoramica" } },
      { icon: TreePineIcon, title: { en: "Surrounded by Greenery", it: "Circondata dal Verde" }, description: { en: "Lush Mediterranean gardens", it: "Rigogliosi giardini mediterranei" } },
      { icon: HomeIcon, title: { en: "Maximum Privacy", it: "Massima Privacy" }, description: { en: "Exclusive and secluded location", it: "Posizione esclusiva e riservata" } },
      { icon: WifiIcon, title: { en: "Free WiFi", it: "WiFi Gratuito" }, description: { en: "High-speed internet connection", it: "Connessione internet ad alta velocità" } },
      { icon: ShieldIcon, title: { en: "24/7 Security", it: "Sicurezza 24/7" }, description: { en: "Round-the-clock security service", it: "Servizio di sorveglianza continuo" } }
    ],
    features: {
      en: [
        "2 elegant double bedrooms",
        "2 modern bathrooms with luxury finishes",
        "Spacious living room with sea view",
        "Fully equipped modern kitchen",
        "Private heated infinity pool",
        "Large Jacuzzi for 2 people",
        "Panoramic terrace with relaxation area",
        "Mediterranean garden with privacy",
        "Air conditioning in all rooms",
        "Smart TV with satellite channels",
        "Bluetooth audio system",
        "Digital safe",
        "Professional hair dryer",
        "Luxury courtesy set"
      ],
      it: [
        "2 eleganti camere matrimoniali",
        "2 bagni moderni con finiture di lusso",
        "Ampio soggiorno con vista mare",
        "Cucina moderna completamente attrezzata",
        "Piscina privata riscaldata a sfioro",
        "Grande Jacuzzi per 2 persone",
        "Terrazza panoramica con area relax",
        "Giardino mediterraneo con privacy",
        "Aria condizionata in tutte le stanze",
        "Smart TV con canali satellitari",
        "Sistema audio Bluetooth",
        "Cassaforte digitale",
        "Asciugacapelli professionale",
        "Set di cortesia di lusso"
      ]
    }
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
  description: typeof v.description === 'string' 
    ? { en: v.description, it: v.description } 
    : v.description,
  size: v.size,
  amenities: v.amenities,
  features: v.features,
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