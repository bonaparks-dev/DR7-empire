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
  StarIcon,
  PlusIcon,
  CreditCardIcon,
  CalendarIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  CubeTransparentIcon,
  TicketIcon,
} from './components/icons/Icons';

export const GOOGLE_CLIENT_ID = "380173701007-jn8ahgmtb039g5pfjmkvgb33rr75of8f.apps.googleusercontent.com";

export const VILLA_SERVICE_FEE_PERCENTAGE = 0.15;

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
    "image": "/audi-rs3.png",
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
    "image": "/mercedes-amg45.png"
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
    "image": "/bmw-m2.png",
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
    "image": "/bmw-m3.png"
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
    "image": "/mercedesGLE.png"
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
    "image": "/bmw-m4.png"
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
    "image": "/ferrari-portofino.png"
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
    "image": "/Ducato.png",
    "available": true
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

    return {
        id: `car-${car.id}`,
        name: car.name,
        image: car.image,
        pricePerDay: {
            usd: Math.round(car.dailyPrice * EUR_TO_USD_RATE),
            eur: car.dailyPrice,
            crypto: 0
        },
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

export const VILLAS: (Villa & { pricePerNightEUR?: number })[] = [
  {
    id: 1,
    title: "Villa 50m from the Beach",
    pricePerNightEUR: 500,
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
    pricePerNightEUR: 450,
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
    pricePerNightEUR: 1200,
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
    pricePerNightEUR: 600,
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
    pricePerNightEUR: 400,
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
    pricePerNightEUR: 350,
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
    pricePerNightEUR: 700,
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
    pricePerNightEUR: 900,
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
    pricePerNightEUR: 1500,
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
  pricePerDay: v.pricePerNightEUR ? {
    usd: Math.round(v.pricePerNightEUR * EUR_TO_USD_RATE),
    eur: v.pricePerNightEUR,
    crypto: 0
  } : undefined,
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
    data: mappedCars,
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
      { id: 'jet-1', name: 'Gulfstream G650', image: '/jets/gulfstream.jpeg', specs: [
        { label: { en: 'Passengers', it: 'Passeggeri' }, value: '19', icon: UsersIcon },
        { label: { en: 'Range', it: 'Autonomia' }, value: '7,500 nm', icon: PaperAirplaneIcon },
        { label: { en: 'Speed', it: 'Velocità' }, value: 'Mach 0.925', icon: ZapIcon },
      ], petsAllowed: true, smokingAllowed: false },
      { id: 'jet-2', name: 'Bombardier Global 7500', image: '/jets/bombardier.jpeg', specs: [
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
  },
  {
    id: 'helicopters',
    label: { en: 'Helicopters', it: 'Elicotteri' },
    data: [
      { id: 'heli-1', name: 'Airbus H130', image: '/helicopters/airbus.jpeg', specs: helicopterSpecs },
    ],
  },
];


export const MEMBERSHIP_TIERS: MembershipTier[] = [
    {
      id: 'silver',
      name: { en: 'Silver', it: 'Argento' },
      price: { monthly: { usd: 500, eur: 450, crypto: 0 }, annually: { usd: 5000, eur: 4500, crypto: 0 } },
      features: {
          en: [
            { icon: CarIcon, text: '2 Supercar rental days per month' },
            { icon: CalendarIcon, text: '10% discount on special event days' },
            'Priority booking access over non-members',
            'Dedicated concierge contact',
            'Exclusive member-only offers',
          ],
          it: [
            { icon: CarIcon, text: '2 giorni di noleggio Supercar al mese' },
            { icon: CalendarIcon, text: '10% di sconto nei giorni di eventi speciali' },
            'Accesso prioritario alle prenotazioni',
            'Contatto concierge dedicato',
            'Offerte esclusive per i membri',
          ]
      },
    },
    {
      id: 'gold',
      name: { en: 'Gold', it: 'Oro' },
      price: { monthly: { usd: 1500, eur: 1350, crypto: 0 }, annually: { usd: 15000, eur: 13500, crypto: 0 } },
      features: {
          en: [
            { icon: CarIcon, text: '5 Supercar rental days per month' },
            { icon: AnchorIcon, text: '1 Yacht rental day per month' },
            { icon: CalendarIcon, text: '15% discount on special event days' },
            'All Silver benefits',
            'Guaranteed vehicle availability (72h notice)',
            'Complimentary airport transfers',
            'Invitations to private DR7 events',
          ],
          it: [
            { icon: CarIcon, text: '5 giorni di noleggio Supercar al mese' },
            { icon: AnchorIcon, text: '1 giorno di noleggio Yacht al mese' },
            { icon: CalendarIcon, text: '15% di sconto nei giorni di eventi speciali' },
            'Tutti i vantaggi Silver',
            'Disponibilità veicolo garantita (preavviso 72h)',
            'Trasferimenti aeroportuali gratuiti',
            'Inviti a eventi privati DR7',
          ]
      },
      isPopular: true,
    },
    {
      id: 'platinum',
      name: { en: 'Platinum', it: 'Platino' },
      price: { monthly: { usd: 3000, eur: 2700, crypto: 0 }, annually: { usd: 30000, eur: 27000, crypto: 0 } },
      features: {
          en: [
            { icon: CarIcon, text: '10 Supercar rental days per month' },
            { icon: AnchorIcon, text: '2 Yacht rental days per month' },
            { icon: HomeIcon, text: '7 Villa rental nights per year' },
            { icon: CalendarIcon, text: '25% discount on special event days' },
            'All Gold benefits',
            'Access to exclusive off-market assets',
            'Personal lifestyle manager 24/7',
            'Complimentary vehicle upgrades',
          ],
          it: [
            { icon: CarIcon, text: '10 giorni di noleggio Supercar al mese' },
            { icon: AnchorIcon, text: '2 giorni di noleggio Yacht al mese' },
            { icon: HomeIcon, text: '7 notti in Villa all\'anno' },
            { icon: CalendarIcon, text: '25% di sconto nei giorni di eventi speciali' },
            'Tutti i vantaggi Gold',
            'Accesso ad asset esclusivi fuori mercato',
            'Manager personale per lo stile di vita 24/7',
            'Upgrade gratuiti dei veicoli',
          ]
      },
    },
];

export const LOTTERY_GIVEAWAY: Lottery = {
  id: 'lotto-christmas-2024',
  name: { en: 'DR7 Christmas Grand Giveaway', it: 'Grande Giveaway di Natale DR7' },
  subtitle: { en: 'Prize Pool Worth Over €400,000', it: 'Montepremi di Oltre 400.000€' },
  image: '/urus.png',
  ticketPriceUSD: 22,
  ticketPriceEUR: 20,
  drawDate: new Date(new Date().getFullYear(), 11, 25).toISOString(),
  prizes: [
    {
      tier: { en: 'Grand Prize', it: 'Primo Premio' },
      name: { en: 'Lamborghini Urus', it: 'Lamborghini Urus' },
      icon: CarIcon,
    },
    {
      tier: { en: 'Tier 2 Prizes', it: 'Premi di Livello 2' },
      name: { en: 'Luxury Trip to Dubai for 2', it: 'Viaggio di Lusso a Dubai per 2' },
      icon: PaperAirplaneIcon,
      quantity: 1,
    },
    {
      tier: { en: 'Tier 2 Prizes', it: 'Premi di Livello 2' },
      name: { en: 'Rolex Watch', it: 'Orologio Rolex' },
      icon: ClockIcon,
      quantity: 2,
    },
    {
      tier: { en: 'Tier 3 Prizes', it: 'Premi di Livello 3' },
      name: { en: 'iPhone 15 Pro', it: 'iPhone 15 Pro' },
      icon: DevicePhoneMobileIcon,
      quantity: 50,
    },
    {
      tier: { en: 'Tier 4 Prizes', it: 'Premi di Livello 4' },
      name: { en: 'PlayStation 5', it: 'PlayStation 5' },
      icon: CubeTransparentIcon,
      quantity: 100,
    },
  ],
  bonus: {
    en: 'Every non-winning ticket becomes a €20 coupon for a future rental on our platform.',
    it: 'Ogni biglietto non vincente diventa un coupon da 20€ per un noleggio futuro sulla nostra piattaforma.',
  }
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

export const AIRPORTS = [
    { iata: 'CAG', name: 'Cagliari Elmas Airport', city: 'Cagliari' },
    { iata: 'OLB', name: 'Olbia Costa Smeralda Airport', city: 'Olbia' },
    { iata: 'FCO', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome' },
    { iata: 'LIN', name: 'Linate Airport', city: 'Milan' },
    { iata: 'LBG', name: 'Paris–Le Bourget Airport', city: 'Paris' },
    { iata: 'GVA', name: 'Geneva Airport', city: 'Geneva' },
    { iata: 'NCE', name: 'Nice Côte d\'Azur Airport', city: 'Nice' },
    { iata: 'LCY', name: 'London City Airport', city: 'London' },
    { iata: 'DXB', name: 'Dubai International Airport', city: 'Dubai' },
    { iata: 'DWC', name: 'Al Maktoum International Airport', city: 'Dubai' },
    { iata: 'IBZ', name: 'Ibiza Airport', city: 'Ibiza' },
    { iata: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York' },
    { iata: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles' },
    { iata: 'VNY', name: 'Van Nuys Airport', city: 'Los Angeles' },
    { iata: 'TEB', name: 'Teterboro Airport', city: 'New York' },
    { iata: 'HPN', name: 'Westchester County Airport', city: 'New York' },
    { iata: 'MIA', name: 'Miami International Airport', city: 'Miami' },
    { iata: 'OPF', name: 'Miami-Opa Locka Executive Airport', city: 'Miami' },
    { iata: 'PBI', name: 'Palm Beach International Airport', city: 'Palm Beach' },
    { iata: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas' },
    { iata: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco' },
    { iata: 'ORD', name: "O'Hare International Airport", city: 'Chicago' },
    { iata: 'MDW', name: 'Midway International Airport', city: 'Chicago' },
    { iata: 'DAL', name: 'Dallas Love Field', city: 'Dallas' },
    { iata: 'LHR', name: 'Heathrow Airport', city: 'London' },
    { iata: 'LGW', name: 'Gatwick Airport', city: 'London' },
    { iata: 'LTN', name: 'Luton Airport', city: 'London' },
    { iata: 'FAB', name: 'Farnborough Airport', city: 'London' },
    { iata: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris' },
    { iata: 'ZRH', name: 'Zurich Airport', city: 'Zurich' },
    { iata: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat Airport', city: 'Barcelona' },
    { iata: 'MAD', name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid' },
    { iata: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam' },
    { iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt' },
    { iata: 'MUC', name: 'Munich Airport', city: 'Munich' },
    { iata: 'VIE', name: 'Vienna International Airport', city: 'Vienna' },
    { iata: 'ATH', name: 'Athens International Airport', city: 'Athens' },
    { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul' },
    { iata: 'SVO', name: 'Sheremetyevo International Airport', city: 'Moscow' },
    { iata: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong' },
    { iata: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore' },
    { iata: 'NRT', name: 'Narita International Airport', city: 'Tokyo' },
    { iata: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney' },
    { iata: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto' },
    { iata: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City' },
    { iata: 'GRU', name: 'São Paulo/Guarulhos–Governador André Franco Montoro International Airport', city: 'São Paulo' },
    { iata: 'EZE', name: 'Ministro Pistarini International Airport', city: 'Buenos Aires' },
    { iata: 'JNB', name: 'O. R. Tambo International Airport', city: 'Johannesburg' },
    { iata: 'CAI', name: 'Cairo International Airport', city: 'Cairo' },
    { iata: 'DOH', name: 'Hamad International Airport', city: 'Doha' },
    { iata: 'AUH', name: 'Abu Dhabi International Airport', city: 'Abu Dhabi' },
    { iata: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh' },
    { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai' },
    { iata: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi' },
    { iata: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing' },
    { iata: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai' },
    { iata: 'ICN', name: 'Incheon International Airport', city: 'Seoul' },
    { iata: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur' },
    { iata: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok' },
    { iata: 'CGK', name: 'Soekarno–Hatta International Airport', city: 'Jakarta' },
    { iata: 'MNL', name: 'Ninoy Aquino International Airport', city: 'Manila' },
    { iata: 'SCL', name: 'Arturo Merino Benítez International Airport', city: 'Santiago' },
    { iata: 'BOG', name: 'El Dorado International Airport', city: 'Bogotá' },
    { iata: 'LIM', name: 'Jorge Chávez International Airport', city: 'Lima' },
    { iata: 'GIG', name: 'Rio de Janeiro/Galeão–Antonio Carlos Jobim International Airport', city: 'Rio de Janeiro' },
    { iata: 'PMI', name: 'Palma de Mallorca Airport', city: 'Palma de Mallorca' },
    { iata: 'AGP', name: 'Málaga-Costa del Sol Airport', city: 'Málaga' },
    { iata: 'NAP', name: 'Naples International Airport', city: 'Naples' },
    { iata: 'VCE', name: 'Venice Marco Polo Airport', city: 'Venice' },
    { iata: 'FLR', name: 'Florence Airport, Peretola', city: 'Florence' },
    { iata: 'PSA', name: 'Pisa International Airport', city: 'Pisa' },
    { iata: 'CTA', name: 'Catania–Fontanarossa Airport', city: 'Catania' },
    { iata: 'PMO', name: 'Falcone Borsellino Airport', city: 'Palermo' },
    { iata: 'JTR', name: 'Santorini (Thira) International Airport', city: 'Santorini' },
    { iata: 'JMK', name: 'Mykonos Airport', city: 'Mykonos' },
    { iata: 'LCA', name: 'Larnaca International Airport', city: 'Larnaca' },
    { iata: 'MLA', name: 'Malta International Airport', city: 'Malta' },
    { iata: 'DBV', name: 'Dubrovnik Airport', city: 'Dubrovnik' },
    { iata: 'SPU', name: 'Split Airport', city: 'Split' },
    { iata: 'TIV', name: 'Tivat Airport', city: 'Tivat' },
    { iata: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague' },
    { iata: 'BUD', name: 'Budapest Ferenc Liszt International Airport', city: 'Budapest' },
    { iata: 'WAW', name: 'Warsaw Chopin Airport', city: 'Warsaw' },
    { iata: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen' },
    { iata: 'OSL', name: 'Oslo Airport, Gardermoen', city: 'Oslo' },
    { iata: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm' },
    { iata: 'HEL', name: 'Helsinki-Vantaa Airport', city: 'Helsinki' },
    { iata: 'KEF', name: 'Keflavík Airport', city: 'Reykjavík' },
    { iata: 'DUB', name: 'Dublin Airport', city: 'Dublin' },
    { iata: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh' },
    { iata: 'LIS', name: 'Humberto Delgado Airport', city: 'Lisbon' },
    { iata: 'OPO', name: 'Francisco Sá Carneiro Airport', city: 'Porto' },
    { iata: 'BRU', name: 'Brussels Airport', city: 'Brussels' },
    { iata: 'LUX', name: 'Luxembourg Airport', city: 'Luxembourg' },
    { iata: 'BER', name: 'Berlin Brandenburg Airport', city: 'Berlin' },
    { iata: 'HAM', name: 'Hamburg Airport', city: 'Hamburg' },
    { iata: 'DUS', name: 'Düsseldorf Airport', city: 'Düsseldorf' },
    { iata: 'CGN', name: 'Cologne Bonn Airport', city: 'Cologne' },
    { iata: 'STR', name: 'Stuttgart Airport', city: 'Stuttgart' },
    { iata: 'HAJ', name: 'Hannover Airport', city: 'Hanover' },
    { iata: 'BRE', name: 'Bremen Airport', city: 'Bremen' },
    { iata: 'LEJ', name: 'Leipzig/Halle Airport', city: 'Leipzig' },
    { iata: 'DRS', name: 'Dresden Airport', city: 'Dresden' },
    { iata: 'NUE', name: 'Nuremberg Airport', city: 'Nuremberg' },
    { iata: 'FMO', name: 'Münster Osnabrück International Airport', city: 'Münster' },
    { iata: 'DTM', name: 'Dortmund Airport', city: 'Dortmund' },
    { iata: 'PAD', name: 'Paderborn Lippstadt Airport', city: 'Paderborn' },
    { iata: 'KSF', name: 'Kassel Airport', city: 'Kassel' },
    { iata: 'SCN', name: 'Saarbrücken Airport', city: 'Saarbrücken' },
    { iata: 'FDH', name: 'Friedrichshafen Airport', city: 'Friedrichshafen' },
    { iata: 'HHN', name: 'Frankfurt-Hahn Airport', city: 'Hahn' },
    { iata: 'FKB', name: 'Karlsruhe/Baden-Baden Airport', city: 'Baden-Baden' },
];

// For Helicopters
export const HELI_DEPARTURE_POINTS = [
    { id: 'CAG', name: 'Cagliari Elmas Airport' },
    { id: 'OLB', name: 'Olbia Costa Smeralda Airport' },
];

export const HELI_ARRIVAL_POINTS = [
    { id: 'PCV', name: 'Porto Cervo' },
    { id: 'FVG', name: 'Forte Village' },
];

// For Yachts
export const YACHT_PICKUP_MARINAS = [
    { id: 'MCG', label: { en: 'Marina di Cagliari', it: 'Marina di Cagliari' } },
    { id: 'MPC', label: { en: 'Marina di Porto Cervo', it: 'Marina di Porto Cervo' } },
    { id: 'MPR', label: { en: 'Marina di Portisco', it: 'Marina di Portisco' } },
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

export const CRYPTO_ADDRESSES = {
    btc: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    eth: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    sol: 'So11111111111111111111111111111111111111112',
    usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
};