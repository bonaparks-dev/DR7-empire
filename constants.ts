import type { RentalCategory, MembershipTier, Lottery } from './types';
import { UsersIcon, CogIcon, ZapIcon, AnchorIcon, HomeIcon, PaperAirplaneIcon, WifiIcon } from './components/icons/Icons';

const carData = [
  { id: 'car1', name: 'Ferrari SF90', image: 'https://picsum.photos/seed/ferrari-sf90-red/800/600', pricePerDay: { usd: 3500, eur: 3200, crypto: 0.1 }, specs: [ { label: { en: 'Top Speed', it: 'Velocità Massima' }, value: '340 km/h', icon: ZapIcon }, { label: { en: 'Engine', it: 'Motore' }, value: 'V8 Hybrid', icon: CogIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '2', icon: UsersIcon } ] },
  { id: 'car2', name: 'Lamborghini Revuelto', image: 'https://picsum.photos/seed/lamborghini-revuelto-yellow/800/600', pricePerDay: { usd: 4000, eur: 3700, crypto: 0.12 }, specs: [ { label: { en: 'Top Speed', it: 'Velocità Massima' }, value: '350 km/h', icon: ZapIcon }, { label: { en: 'Engine', it: 'Motore' }, value: 'V12 Hybrid', icon: CogIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '2', icon: UsersIcon } ] },
  { id: 'car3', name: 'Rolls-Royce Spectre', image: 'https://picsum.photos/seed/rolls-royce-spectre-blue/800/600', pricePerDay: { usd: 2800, eur: 2600, crypto: 0.08 }, specs: [ { label: { en: 'Top Speed', it: 'Velocità Massima' }, value: '250 km/h', icon: ZapIcon }, { label: { en: 'Engine', it: 'Motore' }, value: 'Electric', icon: CogIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '4', icon: UsersIcon } ] },
];

const yachtData = [
    { id: 'yacht1', name: 'Azimut Grande 27M', image: 'https://picsum.photos/seed/azimut-yacht-ocean/800/600', pricePerDay: { usd: 12000, eur: 11000, crypto: 0.35 }, specs: [ { label: { en: 'Length', it: 'Lunghezza' }, value: '27m', icon: AnchorIcon }, { label: { en: 'Cabins', it: 'Cabine' }, value: '5', icon: HomeIcon }, { label: { en: 'Guests', it: 'Ospiti' }, value: '10', icon: UsersIcon } ] },
    { id: 'yacht2', name: 'Riva 110 Dolcevita', image: 'https://picsum.photos/seed/riva-dolcevita-yacht/800/600', pricePerDay: { usd: 18000, eur: 16500, crypto: 0.5 }, specs: [ { label: { en: 'Length', it: 'Lunghezza' }, value: '34m', icon: AnchorIcon }, { label: { en: 'Cabins', it: 'Cabine' }, value: '5', icon: HomeIcon }, { label: { en: 'Guests', it: 'Ospiti' }, value: '10', icon: UsersIcon } ] },
];

const villaData = [
    { id: 'villa1', name: 'Villa Oleandra, Lake Como', image: 'https://picsum.photos/seed/villa-lake-como-luxury/800/600', pricePerDay: { usd: 25000, eur: 23000, crypto: 0.7 }, specs: [ { label: { en: 'Bedrooms', it: 'Camere da Letto' }, value: '15', icon: HomeIcon }, { label: { en: 'Guests', it: 'Ospiti' }, value: '30', icon: UsersIcon }, { label: { en: 'Feature', it: 'Caratteristica' }, value: 'Private Dock', icon: AnchorIcon } ] },
];

const jetData = [
    { id: 'jet1', name: 'Gulfstream G700', image: 'https://picsum.photos/seed/gulfstream-g700-jet-sky/800/600', pricePerDay: { usd: 90000, eur: 82000, crypto: 2.5 }, specs: [ { label: { en: 'Range', it: 'Autonomia' }, value: '13,890 km', icon: PaperAirplaneIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '19', icon: UsersIcon }, { label: { en: 'Wi-Fi', it: 'Wi-Fi' }, value: 'Ka-band', icon: WifiIcon } ] },
];

const helicopterData = [
    { id: 'heli1', name: 'Airbus ACH160', image: 'https://picsum.photos/seed/airbus-ach160-helicopter/800/600', pricePerDay: { usd: 20000, eur: 18500, crypto: 0.6 }, specs: [ { label: { en: 'Range', it: 'Autonomia' }, value: '852 km', icon: PaperAirplaneIcon }, { label: { en: 'Passengers', it: 'Passeggeri' }, value: '10', icon: UsersIcon }, { label: { en: 'Speed', it: 'Velocità' }, value: '287 km/h', icon: ZapIcon } ] },
];


export const RENTAL_CATEGORIES: RentalCategory[] = [
    { id: 'cars', label: { en: 'Supercars', it: 'Supercar' }, data: carData },
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

export const INSURANCE_OPTIONS = [
  { id: 'basic', label: { en: 'Basic Cover', it: 'Copertura Base' }, description: { en: 'Standard liability coverage.', it: 'Copertura di responsabilità standard.' }, pricePerDay: { usd: 0, eur: 0 } },
  { id: 'premium', label: { en: 'Premium Cover', it: 'Copertura Premium' }, description: { en: 'Reduced excess and windscreen cover.', it: 'Franchigia ridotta e copertura parabrezza.' }, pricePerDay: { usd: 30, eur: 28 } },
  { id: 'full', label: { en: 'Full Cover', it: 'Copertura Completa' }, description: { en: 'Zero excess. Complete peace of mind.', it: 'Zero franchigia. Massima tranquillità.' }, pricePerDay: { usd: 50, eur: 46 } },
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