
import type { RentalCategory, MembershipTier } from './types';
import { UsersIcon, CogIcon, ZapIcon, AnchorIcon, HomeIcon, PaperAirplaneIcon, WifiIcon } from './components/icons/Icons';

const carData = [
  { id: 'car1', name: 'Ferrari SF90', image: 'https://picsum.photos/seed/sf90/800/600', pricePerDay: { usd: 3500, eur: 3200, crypto: 0.1 }, specs: [ { label: { en: 'Top Speed', it: 'Velocità Massima' }, value: '340 km/h', icon: ZapIcon }, { label: { en: 'Engine', it: 'Motore' }, value: 'V8 Hybrid', icon: CogIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '2', icon: UsersIcon } ] },
  { id: 'car2', name: 'Lamborghini Revuelto', image: 'https://picsum.photos/seed/revuelto/800/600', pricePerDay: { usd: 4000, eur: 3700, crypto: 0.12 }, specs: [ { label: { en: 'Top Speed', it: 'Velocità Massima' }, value: '350 km/h', icon: ZapIcon }, { label: { en: 'Engine', it: 'Motore' }, value: 'V12 Hybrid', icon: CogIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '2', icon: UsersIcon } ] },
  { id: 'car3', name: 'Rolls-Royce Spectre', image: 'https://picsum.photos/seed/spectre/800/600', pricePerDay: { usd: 2800, eur: 2600, crypto: 0.08 }, specs: [ { label: { en: 'Top Speed', it: 'Velocità Massima' }, value: '250 km/h', icon: ZapIcon }, { label: { en: 'Engine', it: 'Motore' }, value: 'Electric', icon: CogIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '4', icon: UsersIcon } ] },
];

const yachtData = [
    { id: 'yacht1', name: 'Azimut Grande 27M', image: 'https://picsum.photos/seed/azimut/800/600', pricePerDay: { usd: 12000, eur: 11000, crypto: 0.35 }, specs: [ { label: { en: 'Length', it: 'Lunghezza' }, value: '27m', icon: AnchorIcon }, { label: { en: 'Cabins', it: 'Cabine' }, value: '5', icon: HomeIcon }, { label: { en: 'Guests', it: 'Ospiti' }, value: '10', icon: UsersIcon } ] },
    { id: 'yacht2', name: 'Riva 110 Dolcevita', image: 'https://picsum.photos/seed/riva/800/600', pricePerDay: { usd: 18000, eur: 16500, crypto: 0.5 }, specs: [ { label: { en: 'Length', it: 'Lunghezza' }, value: '34m', icon: AnchorIcon }, { label: { en: 'Cabins', it: 'Cabine' }, value: '5', icon: HomeIcon }, { label: { en: 'Guests', it: 'Ospiti' }, value: '10', icon: UsersIcon } ] },
];

const villaData = [
    { id: 'villa1', name: 'Villa Oleandra, Lake Como', image: 'https://picsum.photos/seed/como/800/600', pricePerDay: { usd: 25000, eur: 23000, crypto: 0.7 }, specs: [ { label: { en: 'Bedrooms', it: 'Camere da Letto' }, value: '15', icon: HomeIcon }, { label: { en: 'Guests', it: 'Ospiti' }, value: '30', icon: UsersIcon }, { label: { en: 'Feature', it: 'Caratteristica' }, value: 'Private Dock', icon: AnchorIcon } ] },
];

const jetData = [
    { id: 'jet1', name: 'Gulfstream G700', image: 'https://picsum.photos/seed/g700/800/600', pricePerDay: { usd: 90000, eur: 82000, crypto: 2.5 }, specs: [ { label: { en: 'Range', it: 'Autonomia' }, value: '13,890 km', icon: PaperAirplaneIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '19', icon: UsersIcon }, { label: { en: 'Wi-Fi', it: 'Wi-Fi' }, value: 'Ka-band', icon: WifiIcon } ] },
];

const helicopterData = [
    { id: 'heli1', name: 'Airbus ACH160', image: 'https://picsum.photos/seed/ach160/800/600', pricePerDay: { usd: 20000, eur: 18500, crypto: 0.6 }, specs: [ { label: { en: 'Range', it: 'Autonomia' }, value: '852 km', icon: PaperAirplaneIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '10', icon: UsersIcon }, { label: { en: 'Speed', it: 'Velocità' }, value: '287 km/h', icon: ZapIcon } ] },
];


export const RENTAL_CATEGORIES: RentalCategory[] = [
    { id: 'cars', label: { en: 'Supercars', it: 'Supercar' }, data: carData },
    { id: 'yachts', label: { en: 'Yachts', it: 'Yacht' }, data: yachtData },
    { id: 'villas', label: { en: 'Villas', it: 'Ville' }, data: villaData },
    { id: 'jets', label: { en: 'Private Jets', it: 'Jet Privati' }, data: jetData },
    { id: 'helicopters', label: { en: 'Helicopters', it: 'Elicotteri' }, data: helicopterData },
];

export const MEMBERSHIP_TIERS: MembershipTier[] = [
    { id: 'basic', name: { en: 'Basic', it: 'Base' }, price: { monthly: { usd: 500, eur: 450, crypto: 0.015 }, annually: { usd: 5000, eur: 4500, crypto: 0.15 } }, features: { en: ['Access to premium rentals', 'Standard support', 'Basic event invites'], it: ['Accesso a noleggi premium', 'Supporto standard', 'Inviti a eventi base'] } },
    { id: 'premium', name: { en: 'Premium', it: 'Premium' }, price: { monthly: { usd: 1500, eur: 1350, crypto: 0.045 }, annually: { usd: 15000, eur: 13500, crypto: 0.45 } }, features: { en: ['All Basic features', 'Priority booking', '24/7 concierge service', 'Exclusive event access'], it: ['Tutti i vantaggi Base', 'Prenotazione prioritaria', 'Servizio concierge 24/7', 'Accesso a eventi esclusivi'] }, isPopular: true },
    { id: 'signature', name: { en: 'Signature', it: 'Signature' }, price: { monthly: { usd: 5000, eur: 4600, crypto: 0.15 }, annually: { usd: 50000, eur: 46000, crypto: 1.5 } }, features: { en: ['All Premium features', 'Guaranteed availability', 'Personal lifestyle manager', 'Access to off-market assets'], it: ['Tutti i vantaggi Premium', 'Disponibilità garantita', 'Manager personale lifestyle', 'Accesso a beni fuori mercato'] } },
];
