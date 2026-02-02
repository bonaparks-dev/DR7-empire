import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';

export interface WashService {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  duration: string;
  description: string;
  descriptionEn: string;
  features: string[];
  featuresEn: string[];
  image?: string;
  priceUnit?: string;
  priceOptions?: { label: string; price: number }[];
}

// Alias for backward compatibility
export type Service = WashService;

interface CartItem {
  service: WashService;
  quantity: number;
  selectedOption?: { label: string; price: number };
}

// ==================== LAVAGGIO SERVICES ====================

// PRIME MOTO EXPERIENCE
const MOTO_SERVICES: WashService[] = [
  {
    id: 'moto-essential',
    name: 'PRIME MOTO ESSENTIAL',
    nameEn: 'PRIME MOTO ESSENTIAL',
    price: 9.90,
    duration: '20 min',
    description: 'Prelavaggio, lavaggio parti esterne con detergenti safe, pulizia zone accessibili, asciugatura a mano.',
    descriptionEn: 'Pre-wash, exterior wash with safe detergents, accessible areas cleaning, hand drying.',
    features: ['Prelavaggio', 'Lavaggio parti esterne con detergenti safe', 'Pulizia zone accessibili', 'Asciugatura a mano'],
    featuresEn: ['Pre-wash', 'Exterior wash with safe detergents', 'Accessible areas cleaning', 'Hand drying'],
    image: '/services/moto.jpeg',
  }
];

// PRIME URBAN CLASS
const URBAN_SERVICES: WashService[] = [
  {
    id: 'urban-exterior',
    name: 'PRIME EXTERIOR CLEAN',
    nameEn: 'PRIME EXTERIOR CLEAN',
    price: 14.90,
    duration: '15 min',
    description: 'Auto presentabile, pulita, ordinata.',
    descriptionEn: 'Presentable, clean, tidy car.',
    features: ['Prelavaggio', 'Lavaggio carrozzeria', 'Vetri esterni', 'Cerchi rapidi', 'Asciugatura a mano'],
    featuresEn: ['Pre-wash', 'Body wash', 'Exterior glass', 'Quick wheels', 'Hand drying'],
    image: '/services/exterior.jpeg',
  },
  {
    id: 'urban-interior',
    name: 'PRIME INTERIOR CLEAN',
    nameEn: 'PRIME INTERIOR CLEAN',
    price: 19.90,
    duration: '30 min',
    description: 'Abitacolo pulito, aria migliore, comfort immediato.',
    descriptionEn: 'Clean cabin, better air, immediate comfort.',
    features: ['Aspirazione completa (sedili, moquette, tappetini)', 'Pulizia superfici interne', 'Vetri interni anti-aloni', 'Rifinitura plastiche'],
    featuresEn: ['Complete vacuuming (seats, carpet, mats)', 'Interior surfaces cleaning', 'Anti-halo interior glass', 'Plastic finishing'],
    image: '/services/interior.jpeg',
  },
  {
    id: 'urban-full',
    name: 'PRIME FULL CLEAN',
    nameEn: 'PRIME FULL CLEAN',
    price: 24.90,
    duration: '45 min',
    description: 'Pulita dentro e fuori senza "mezze misure".',
    descriptionEn: 'Clean inside and out, no half measures.',
    features: ['Interni + esterni completi', 'Schiuma profumata', 'Cerchi/Passaruota/Vetri', 'Aspirazione profonda', 'Asciugatura e rifinitura'],
    featuresEn: ['Complete interior + exterior', 'Scented foam', 'Wheels/Wheel arches/Glass', 'Deep vacuuming', 'Drying and finishing'],
    image: '/services/full.jpeg',
  },
  {
    id: 'urban-full-n2',
    name: 'PRIME FULL CLEAN N₂',
    nameEn: 'PRIME FULL CLEAN N₂',
    price: 34.90,
    duration: '50 min',
    description: 'Aria pulita, odori eliminati alla radice.',
    descriptionEn: 'Clean air, odors eliminated at the root.',
    features: ['Tutto il Full Clean', 'Sanificazione abitacolo all\'azoto'],
    featuresEn: ['Everything from Full Clean', 'Nitrogen cabin sanitization'],
    image: '/services/full-n2.jpeg',
  },
  {
    id: 'urban-top-shine',
    name: 'PRIME TOP SHINE',
    nameEn: 'PRIME TOP SHINE',
    price: 49,
    duration: '90 min',
    description: 'Più brillantezza, più protezione, più presenza.',
    descriptionEn: 'More shine, more protection, more presence.',
    features: ['Full Clean + trattamento lucidante veloce', 'Rifinitura extra plastiche e bocchette', 'Dettagli più curati', 'Acqua Prime Luxury'],
    featuresEn: ['Full Clean + quick polish treatment', 'Extra plastic and vent finishing', 'More detailed care', 'Prime Luxury Water'],
    image: '/services/topshine.jpeg',
  },
  {
    id: 'urban-vip',
    name: 'PRIME VIP EXPERIENCE',
    nameEn: 'PRIME VIP EXPERIENCE',
    price: 75,
    duration: '120 min',
    description: 'Auto rigenerata, non solo pulita.',
    descriptionEn: 'Regenerated car, not just clean.',
    features: ['Top Shine + decontaminazione carrozzeria', 'Pulizia e igienizzazione sedili pelle', 'Sanificazione all\'azoto', 'Sigillante premium', 'Profumo premium + omaggio', 'Acqua Prime Luxury'],
    featuresEn: ['Top Shine + body decontamination', 'Leather seat cleaning and sanitization', 'Nitrogen sanitization', 'Premium sealant', 'Premium perfume + gift', 'Prime Luxury Water'],
    image: '/services/vip.jpeg',
  },
  {
    id: 'urban-luxury',
    name: 'PRIME LUXURY DETAIL',
    nameEn: 'PRIME LUXURY DETAIL',
    price: 119,
    duration: '180 min',
    description: 'Effetto concessionaria. Punto.',
    descriptionEn: 'Dealership effect. Period.',
    features: ['VIP Experience + igienizzazione totale dettagli', 'Sedili (tessuto o pelle), moquette e tappetini', 'Cielo interno', 'Vano motore con prodotti specifici', 'Profumo premium + Acqua Prime Luxury'],
    featuresEn: ['VIP Experience + total detail sanitization', 'Seats (fabric or leather), carpet and mats', 'Headliner', 'Engine bay with specific products', 'Premium perfume + Prime Luxury Water'],
    image: '/services/luxury.jpeg',
  }
];

// PRIME MAXI CLASS
const MAXI_SERVICES: WashService[] = [
  {
    id: 'maxi-exterior',
    name: 'PRIME MAXI EXTERIOR CLEAN',
    nameEn: 'PRIME MAXI EXTERIOR CLEAN',
    price: 19.90,
    duration: '20 min',
    description: 'Grande auto, grande impatto.',
    descriptionEn: 'Big car, big impact.',
    features: ['Prelavaggio, lavaggio carrozzeria', 'Vetri, cerchi rapidi', 'Asciugatura a mano'],
    featuresEn: ['Pre-wash, body wash', 'Glass, quick wheels', 'Hand drying'],
    image: '/services/maxi-exterior.jpeg',
  },
  {
    id: 'maxi-interior',
    name: 'PRIME MAXI INTERIOR CLEAN',
    nameEn: 'PRIME MAXI INTERIOR CLEAN',
    price: 24.90,
    duration: '35 min',
    description: 'Ordine reale, niente zone "saltate".',
    descriptionEn: 'Real order, no "skipped" areas.',
    features: ['Aspirazione completa (volumi grandi)', 'Pulizia superfici', 'Vetri interni', 'Rifinitura plastiche'],
    featuresEn: ['Complete vacuuming (large volumes)', 'Surface cleaning', 'Interior glass', 'Plastic finishing'],
    image: '/services/maxi-interior.jpeg',
  },
  {
    id: 'maxi-full',
    name: 'PRIME MAXI FULL CLEAN',
    nameEn: 'PRIME MAXI FULL CLEAN',
    price: 29.90,
    duration: '55 min',
    description: 'Pulizia totale, visibile.',
    descriptionEn: 'Total, visible cleaning.',
    features: ['Interni + esterni completi', 'Schiuma profumata', 'Cerchi/passaruota/vetri', 'Aspirazione e rifinitura'],
    featuresEn: ['Complete interior + exterior', 'Scented foam', 'Wheels/wheel arches/glass', 'Vacuuming and finishing'],
    image: '/services/maxi-full.jpeg',
  },
  {
    id: 'maxi-full-n2',
    name: 'PRIME MAXI FULL CLEAN N₂',
    nameEn: 'PRIME MAXI FULL CLEAN N₂',
    price: 39.90,
    duration: '55 min',
    description: 'Igiene profonda per famiglie e viaggi.',
    descriptionEn: 'Deep hygiene for families and travel.',
    features: ['Maxi Full Clean + sanificazione all\'azoto'],
    featuresEn: ['Maxi Full Clean + nitrogen sanitization'],
    image: '/services/maxi-full-n2.jpeg',
  },
  {
    id: 'maxi-top-shine',
    name: 'PRIME TOP SHINE MAXI',
    nameEn: 'PRIME TOP SHINE MAXI',
    price: 59,
    duration: '100 min',
    description: 'Presenza premium.',
    descriptionEn: 'Premium presence.',
    features: ['Maxi Full Clean + lucidante veloce', 'Rifiniture extra', 'Dettagli curati', 'Acqua Prime Luxury'],
    featuresEn: ['Maxi Full Clean + quick polish', 'Extra finishing', 'Detailed care', 'Prime Luxury Water'],
    image: '/services/maxi-topshine.jpeg',
  },
  {
    id: 'maxi-vip',
    name: 'PRIME VIP EXPERIENCE MAXI',
    nameEn: 'PRIME VIP EXPERIENCE MAXI',
    price: 85,
    duration: '130 min',
    description: '"Come nuova", anche sui grandi volumi.',
    descriptionEn: '"Like new", even on large vehicles.',
    features: ['Top Shine Maxi + decontaminazione', 'Sedili pelle', 'Sanificazione all\'azoto', 'Sigillante premium', 'Profumo premium + omaggio', 'Acqua Prime Luxury'],
    featuresEn: ['Top Shine Maxi + decontamination', 'Leather seats', 'Nitrogen sanitization', 'Premium sealant', 'Premium perfume + gift', 'Prime Luxury Water'],
    image: '/services/maxi-vip.jpeg',
  },
  {
    id: 'maxi-luxury',
    name: 'PRIME LUXURY DETAIL MAXI',
    nameEn: 'PRIME LUXURY DETAIL MAXI',
    price: 179,
    duration: '240 min',
    description: 'Rigenerazione completa.',
    descriptionEn: 'Complete regeneration.',
    features: ['VIP Maxi + igienizzazione totale', 'Sedili (tessuto/pelle)', 'Moquette/tappetini', 'Cielo', 'Vano motore', 'Profumo premium + Acqua Prime Luxury'],
    featuresEn: ['VIP Maxi + total sanitization', 'Seats (fabric/leather)', 'Carpet/mats', 'Headliner', 'Engine bay', 'Premium perfume + Prime Luxury Water'],
    image: '/services/maxi-luxury.jpeg',
  }
];

// PRIME EXTRA CARE (add-ons for Lavaggio - 10 services: 15-24)
const EXTRA_CARE_SERVICES: WashService[] = [
  {
    id: 'extra-child',
    name: 'PRIME CHILD CARE',
    nameEn: 'PRIME CHILD CARE',
    price: 14.90,
    duration: '15 min',
    description: 'Igiene e tranquillità.',
    descriptionEn: 'Hygiene and peace of mind.',
    features: ['Pulizia e igienizzazione seggiolino', 'Trattamento macchie'],
    featuresEn: ['Child seat cleaning and sanitization', 'Stain treatment'],
  },
  {
    id: 'extra-engine',
    name: 'PRIME ENGINE CLEAN',
    nameEn: 'PRIME ENGINE CLEAN',
    price: 29.90,
    duration: '30 min',
    description: 'Motore pulito e ordinato.',
    descriptionEn: 'Clean and tidy engine.',
    features: ['Pulizia vano motore con prodotti specifici', 'Tecnica safe', 'Rifinitura plastiche'],
    featuresEn: ['Engine bay cleaning with specific products', 'Safe technique', 'Plastic finishing'],
  },
  {
    id: 'extra-glass',
    name: 'PRIME GLASS CARE',
    nameEn: 'PRIME GLASS CARE',
    price: 9.90,
    duration: '10 min',
    description: 'Visibilità perfetta.',
    descriptionEn: 'Perfect visibility.',
    features: ['Vetri interni/esterni + anti-aloni'],
    featuresEn: ['Interior/exterior glass + anti-halo'],
  },
  {
    id: 'extra-odor',
    name: 'PRIME ODOR CONTROL',
    nameEn: 'PRIME ODOR CONTROL',
    price: 9.90,
    duration: '5 min',
    description: 'Aria pulita.',
    descriptionEn: 'Clean air.',
    features: ['Trattamento neutralizzante + profumazione premium'],
    featuresEn: ['Neutralizing treatment + premium fragrance'],
  },
  {
    id: 'extra-pet',
    name: 'PRIME PET CLEAN',
    nameEn: 'PRIME PET CLEAN',
    price: 19.90,
    duration: '20 min',
    description: 'Tessuti liberi dai peli.',
    descriptionEn: 'Fabrics free from pet hair.',
    features: ['Rimozione peli con strumenti dedicati', 'Aspirazione mirata'],
    featuresEn: ['Pet hair removal with dedicated tools', 'Targeted vacuuming'],
  },
  {
    id: 'extra-plastic',
    name: 'PRIME PLASTIC REFRESH',
    nameEn: 'PRIME PLASTIC REFRESH',
    price: 14.90,
    duration: '15 min',
    description: 'Plastiche piene e curate.',
    descriptionEn: 'Full and well-maintained plastics.',
    features: ['Pulizia + ravvivante protettivo (no effetto unto)'],
    featuresEn: ['Cleaning + protective revitalizer (no greasy effect)'],
  },
  {
    id: 'extra-quick-shine',
    name: 'PRIME QUICK SHINE',
    nameEn: 'PRIME QUICK SHINE',
    price: 14.90,
    duration: '10 min',
    description: 'Più gloss subito.',
    descriptionEn: 'More gloss immediately.',
    features: ['Cera spray protettiva + rifinitura'],
    featuresEn: ['Protective spray wax + finishing'],
  },
  {
    id: 'extra-rim',
    name: 'PRIME RIM CARE',
    nameEn: 'PRIME RIM CARE',
    price: 9.90,
    duration: '10 min',
    description: 'Look più "nuovo".',
    descriptionEn: 'More "new" look.',
    features: ['Detergente specifico', 'Spazzolatura fronte cerchio', 'Rifinitura gomme'],
    featuresEn: ['Specific detergent', 'Wheel face brushing', 'Tire finishing'],
    priceUnit: 'per 4 cerchi',
  },
  {
    id: 'extra-seat-clean',
    name: 'PRIME SEAT CLEAN',
    nameEn: 'PRIME SEAT CLEAN',
    price: 9.90,
    duration: '15 min',
    description: 'Sedile davvero pulito.',
    descriptionEn: 'Truly clean seat.',
    features: ['Pretrattamento', 'Pulizia profonda in base al materiale', 'Asciugatura controllata'],
    featuresEn: ['Pre-treatment', 'Deep cleaning based on material', 'Controlled drying'],
    priceUnit: 'a sedile',
  },
  {
    id: 'extra-seat-protect',
    name: 'PRIME SEAT PROTECT',
    nameEn: 'PRIME SEAT PROTECT',
    price: 14.90,
    duration: '10 min',
    description: 'Sedili più protetti nel tempo.',
    descriptionEn: 'Seats more protected over time.',
    features: ['Trattamento protettivo sedili'],
    featuresEn: ['Seat protective treatment'],
    priceUnit: 'a sedile',
  },
];

// PRIME EXPERIENCE (courtesy car and supercar experiences - 25-28)
const EXPERIENCE_SERVICES: WashService[] = [
  {
    id: 'extra-courtesy',
    name: 'PRIME COURTESY DRIVE',
    nameEn: 'PRIME COURTESY DRIVE',
    price: 9.90,
    duration: '-',
    description: 'Nessuna attesa, nessuna perdita di tempo.',
    descriptionEn: 'No waiting, no time wasted.',
    features: ['Auto pronta all\'uso mentre la tua viene lavata'],
    featuresEn: ['Car ready to use while yours is being washed'],
    priceOptions: [
      { label: '1 ora', price: 9.90 },
      { label: '2 ore', price: 14.90 },
      { label: '3 ore', price: 19.90 },
      { label: '4+ ore', price: 5.90 },
    ],
  },
  {
    id: 'extra-supercar',
    name: 'SUPERCAR EXPERIENCE',
    nameEn: 'SUPERCAR EXPERIENCE',
    price: 89,
    duration: '-',
    description: 'Non è un servizio. È un\'esperienza.',
    descriptionEn: 'It\'s not a service. It\'s an experience.',
    features: ['Guida una delle nostre supercar mentre la tua auto viene trattata'],
    featuresEn: ['Drive one of our supercars while your car is being treated'],
    priceOptions: [
      { label: '1 ora', price: 89 },
      { label: '2 ore', price: 149 },
      { label: '3 ore', price: 189 },
      { label: '4+ ore', price: 69 },
    ],
  },
  {
    id: 'extra-icon',
    name: 'PRIME ICON EXPERIENCE',
    nameEn: 'PRIME ICON EXPERIENCE',
    price: 189,
    duration: '-',
    description: 'L\'esperienza definitiva. Lamborghini & Ferrari.',
    descriptionEn: 'The ultimate experience. Lamborghini & Ferrari.',
    features: ['Guidi una Lamborghini o una Ferrari mentre la tua auto viene rigenerata'],
    featuresEn: ['Drive a Lamborghini or Ferrari while your car is being regenerated'],
    priceOptions: [
      { label: '1 ora', price: 189 },
      { label: '2 ore', price: 289 },
      { label: '3 ore', price: 349 },
      { label: '4+ ore', price: 69 },
    ],
  }
];

// ==================== MECCANICA SERVICES ====================

// PRIME TECH SERVICE (manodopera - 29-32)
const TECH_SERVICES: WashService[] = [
  {
    id: 'tech-brake',
    name: 'PRIME BRAKE SERVICE',
    nameEn: 'PRIME BRAKE SERVICE',
    price: 29,
    duration: '30 min',
    description: 'Controllo e manutenzione freni.',
    descriptionEn: 'Brake check and maintenance.',
    features: ['Controllo pastiglie', 'Controllo dischi', 'Verifica liquido freni'],
    featuresEn: ['Brake pad check', 'Disc check', 'Brake fluid check'],
  },
  {
    id: 'tech-battery',
    name: 'PRIME BATTERY SWAP',
    nameEn: 'PRIME BATTERY SWAP',
    price: 19,
    duration: '15 min',
    description: 'Sostituzione batteria rapida.',
    descriptionEn: 'Quick battery replacement.',
    features: ['Rimozione batteria vecchia', 'Installazione batteria nuova', 'Test avviamento'],
    featuresEn: ['Old battery removal', 'New battery installation', 'Start test'],
  },
  {
    id: 'tech-wiper',
    name: 'PRIME WIPER SERVICE',
    nameEn: 'PRIME WIPER SERVICE',
    price: 9.90,
    duration: '5 min',
    description: 'Visibilità e sicurezza di guida.',
    descriptionEn: 'Visibility and driving safety.',
    features: ['Rimozione spazzole usurate', 'Installazione nuove spazzole', 'Verifica corretta aderenza'],
    featuresEn: ['Worn blade removal', 'New blade installation', 'Proper adhesion check'],
    priceUnit: 'anteriore o posteriore',
  },
  {
    id: 'tech-headlight',
    name: 'PRIME HEADLIGHT RESTORE',
    nameEn: 'PRIME HEADLIGHT RESTORE',
    price: 34.90,
    duration: '30 min',
    description: 'Migliora estetica, visibilità e sicurezza.',
    descriptionEn: 'Improves aesthetics, visibility and safety.',
    features: ['Pulizia profonda del faro', 'Lucidatura progressiva', 'Ripristino trasparenza'],
    featuresEn: ['Deep headlight cleaning', 'Progressive polishing', 'Transparency restoration'],
    priceOptions: [
      { label: '1 faro', price: 34.90 },
      { label: '2 fari', price: 59.90 },
      { label: '4 fari', price: 89.90 },
    ],
  }
];

type MainTabType = 'lavaggio' | 'meccanica';
type LavaggioCategory = 'moto' | 'urban' | 'maxi' | 'extra' | 'experience';
type MeccanicaCategory = 'tech';

const LAVAGGIO_CATEGORIES = [
  { id: 'moto' as LavaggioCategory, name: 'PRIME MOTO EXPERIENCE', nameEn: 'PRIME MOTO EXPERIENCE' },
  { id: 'urban' as LavaggioCategory, name: 'PRIME URBAN CLASS', nameEn: 'PRIME URBAN CLASS' },
  { id: 'maxi' as LavaggioCategory, name: 'PRIME MAXI CLASS', nameEn: 'PRIME MAXI CLASS', subtitle: 'station wagon · SUV · monovolume' },
  { id: 'extra' as LavaggioCategory, name: 'PRIME EXTRA CARE', nameEn: 'PRIME EXTRA CARE', subtitle: 'in aggiunta a un lavaggio' },
  { id: 'experience' as LavaggioCategory, name: 'PRIME EXPERIENCE', nameEn: 'PRIME EXPERIENCE', subtitle: 'auto di cortesia' },
];

const MECCANICA_CATEGORIES = [
  { id: 'tech' as MeccanicaCategory, name: 'PRIME TECH SERVICE', nameEn: 'PRIME TECH SERVICE', subtitle: 'manodopera' },
];

const CarWashServicesPage: React.FC = () => {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<MainTabType>('lavaggio');
  const [lavaggioCategory, setLavaggioCategory] = useState<LavaggioCategory>('urban');
  const [meccanicaCategory, setMeccanicaCategory] = useState<MeccanicaCategory>('tech');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const getLavaggioServices = (category: LavaggioCategory): WashService[] => {
    switch (category) {
      case 'moto': return MOTO_SERVICES;
      case 'urban': return URBAN_SERVICES;
      case 'maxi': return MAXI_SERVICES;
      case 'extra': return EXTRA_CARE_SERVICES;
      case 'experience': return EXPERIENCE_SERVICES;
      default: return [];
    }
  };

  const getMeccanicaServices = (category: MeccanicaCategory): WashService[] => {
    switch (category) {
      case 'tech': return TECH_SERVICES;
      default: return [];
    }
  };

  const addToCart = (service: WashService, selectedOption?: { label: string; price: number }) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item =>
        item.service.id === service.id &&
        item.selectedOption?.label === selectedOption?.label
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      return [...prev, { service, quantity: 1, selectedOption }];
    });
    setShowCart(true);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      updated[index].quantity += delta;
      if (updated[index].quantity <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      return updated;
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.selectedOption?.price || item.service.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const hasWashService = () => {
    return cart.some(item =>
      !item.service.id.startsWith('extra-') && !item.service.id.startsWith('tech-')
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Check if extra care services are selected without a main wash
    const hasExtraCare = cart.some(item => item.service.id.startsWith('extra-'));
    if (hasExtraCare && !hasWashService()) {
      alert(lang === 'it'
        ? 'I servizi Extra Care richiedono la selezione di un lavaggio principale.'
        : 'Extra Care services require selecting a main wash service.');
      return;
    }

    navigate('/car-wash-booking', {
      state: {
        cartItems: cart.map(item => ({
          serviceId: item.service.id,
          serviceName: lang === 'it' ? item.service.name : item.service.nameEn,
          price: item.selectedOption?.price || item.service.price,
          quantity: item.quantity,
          option: item.selectedOption?.label
        })),
        total: getCartTotal()
      }
    });
  };

  const currentServices = mainTab === 'lavaggio'
    ? getLavaggioServices(lavaggioCategory)
    : getMeccanicaServices(meccanicaCategory);

  const currentCategories = mainTab === 'lavaggio' ? LAVAGGIO_CATEGORIES : MECCANICA_CATEGORIES;
  const activeCategory = mainTab === 'lavaggio' ? lavaggioCategory : meccanicaCategory;

  return (
    <div className="min-h-screen bg-black pt-32 pb-32">
      {/* Main Tab Navigation: LAVAGGIO | MECCANICA */}
      <div className="container mx-auto px-4 mb-6">
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setMainTab('lavaggio')}
            className={`px-8 py-3 rounded-full font-bold text-lg transition-all duration-300 ${
              mainTab === 'lavaggio'
                ? 'bg-white text-black'
                : 'bg-transparent text-white border-2 border-white hover:bg-white/10'
            }`}
          >
            LAVAGGIO
          </button>
          <button
            onClick={() => setMainTab('meccanica')}
            className={`px-8 py-3 rounded-full font-bold text-lg transition-all duration-300 ${
              mainTab === 'meccanica'
                ? 'bg-white text-black'
                : 'bg-transparent text-white border-2 border-white hover:bg-white/10'
            }`}
          >
            MECCANICA
          </button>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex flex-wrap justify-center gap-2">
          {currentCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => mainTab === 'lavaggio'
                ? setLavaggioCategory(cat.id as LavaggioCategory)
                : setMeccanicaCategory(cat.id as MeccanicaCategory)
              }
              className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-900/50 text-white border border-gray-700 hover:border-white'
              }`}
            >
              <span>{lang === 'it' ? cat.name : cat.nameEn}</span>
              {cat.subtitle && (
                <span className="hidden sm:inline text-[10px] ml-1 opacity-70">({cat.subtitle})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Extra Care Warning */}
      {mainTab === 'lavaggio' && lavaggioCategory === 'extra' && (
        <div className="container mx-auto px-6 mb-6">
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
            <p className="text-yellow-200 text-sm">
              {lang === 'it'
                ? 'I servizi Extra Care sono disponibili in aggiunta a un lavaggio a scelta obbligatorio.'
                : 'Extra Care services are available as add-ons to a required wash service.'}
            </p>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden group transition-all duration-300 hover:border-white/50 hover:shadow-2xl hover:shadow-white/10 flex flex-col"
            >
              {/* Service Image - matching car rental aspect ratio */}
              <div className="relative overflow-hidden">
                <img
                  src={service.image || '/services/default-wash.jpg'}
                  alt={lang === 'it' ? service.name : service.nameEn}
                  className="w-full aspect-[9/16] object-cover transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>

              {/* Price and Button Section */}
              <div className="px-6 pt-6 pb-4 flex-grow flex flex-col">
                <div className="mt-auto space-y-2">
                  <div>
                    <span className="text-2xl font-bold text-white">€{service.price.toFixed(2)}</span>
                    {service.priceUnit && <span className="text-sm text-gray-400 ml-1">{service.priceUnit}</span>}
                  </div>
                </div>

                <div className="mt-3">
                  {service.priceOptions ? (
                    <div className="space-y-2">
                      {service.priceOptions.map((option) => (
                        <button
                          key={option.label}
                          onClick={() => addToCart(service, option)}
                          className="w-full flex justify-between items-center bg-transparent border-2 border-white text-white px-6 py-2 rounded-full font-semibold text-sm transform transition-all duration-300 group-hover:bg-white group-hover:text-black"
                        >
                          <span>{option.label}</span>
                          <span>€{option.price.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(service)}
                      className="w-full bg-transparent border-2 border-white text-white px-6 py-2 rounded-full font-semibold text-sm transform transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:scale-105"
                    >
                      {lang === 'it' ? 'AGGIUNGI AL CARRELLO' : 'ADD TO CART'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-white text-black px-6 py-4 rounded-full font-bold shadow-2xl flex items-center gap-3 z-40 hover:bg-gray-200 transition-colors"
        >
          <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
          <span>€{getCartTotal().toFixed(2)}</span>
        </motion.button>
      )}

      {/* Cart Sidebar */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-black border-l border-gray-800 z-50 flex flex-col"
            >
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {lang === 'it' ? 'Il tuo carrello' : 'Your cart'}
                </h2>
                <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-white text-2xl">
                  &times;
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    {lang === 'it' ? 'Il carrello è vuoto' : 'Your cart is empty'}
                  </p>
                ) : (
                  cart.map((item, index) => (
                    <div key={`${item.service.id}-${item.selectedOption?.label || ''}-${index}`} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-white text-sm">
                            {lang === 'it' ? item.service.name : item.service.nameEn}
                          </h4>
                          {item.selectedOption && (
                            <span className="text-gray-400 text-xs">{item.selectedOption.label}</span>
                          )}
                        </div>
                        <button onClick={() => removeFromCart(index)} className="text-red-500 hover:text-red-400 text-sm">
                          {lang === 'it' ? 'Rimuovi' : 'Remove'}
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(index, -1)}
                            className="w-8 h-8 rounded-full border border-gray-600 text-white hover:bg-gray-800"
                          >
                            -
                          </button>
                          <span className="text-white font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, 1)}
                            className="w-8 h-8 rounded-full border border-gray-600 text-white hover:bg-gray-800"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-white font-bold">
                          €{((item.selectedOption?.price || item.service.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg text-white">{lang === 'it' ? 'Totale' : 'Total'}</span>
                    <span className="text-2xl font-bold text-white">€{getCartTotal().toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-white text-black py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-colors"
                  >
                    {lang === 'it' ? 'PROCEDI' : 'CHECKOUT'}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Export all services combined for backward compatibility
export const SERVICES: WashService[] = [
  ...MOTO_SERVICES,
  ...URBAN_SERVICES,
  ...MAXI_SERVICES,
  ...EXTRA_CARE_SERVICES,
  ...EXPERIENCE_SERVICES,
  ...TECH_SERVICES,
];

// Export individual service arrays
export {
  MOTO_SERVICES,
  URBAN_SERVICES,
  MAXI_SERVICES,
  EXTRA_CARE_SERVICES,
  EXPERIENCE_SERVICES,
  TECH_SERVICES,
};

export default CarWashServicesPage;
