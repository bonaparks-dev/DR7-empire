// Adapter: returns yacht/jet/heli items in the legacy `RentalItem` shape so
// consumer pages can drop in without rewriting render logic. Spec icons +
// labels are resolved here (kept in code — admin only edits the values).
import {
  UsersIcon,
  ZapIcon,
  AnchorIcon,
  BedIcon,
  PaperAirplaneIcon,
  CalendarIcon,
} from '../components/icons/Icons';
import type { RentalItem, RentalSpec } from '../types';
import {
  getAviationMarineCopy,
  type AviationMarineItem,
  type AviationMarineSpecKey,
} from './siteCopy';

const SPEC_REGISTRY: Record<AviationMarineSpecKey, { label: { en: string; it: string }; icon: RentalSpec['icon'] }> = {
  passengers: { label: { en: 'Passengers', it: 'Passeggeri' }, icon: UsersIcon },
  year:       { label: { en: 'Year', it: 'Anno' },             icon: CalendarIcon },
  type:       { label: { en: 'Type', it: 'Tipo' },             icon: PaperAirplaneIcon },
  range:      { label: { en: 'Range', it: 'Autonomia' },       icon: PaperAirplaneIcon },
  speed:      { label: { en: 'Speed', it: 'Velocità' },        icon: ZapIcon },
  guests:     { label: { en: 'Guests', it: 'Ospiti' },         icon: UsersIcon },
  length:     { label: { en: 'Length', it: 'Lunghezza' },      icon: AnchorIcon },
  cabins:     { label: { en: 'Cabins', it: 'Cabine' },         icon: BedIcon },
};

function toRentalItem(it: AviationMarineItem): RentalItem {
  const specs: RentalSpec[] = it.specs.map(s => ({
    label: SPEC_REGISTRY[s.key].label,
    value: s.value,
    icon: SPEC_REGISTRY[s.key].icon,
  }));
  return {
    id: it.id,
    name: it.name,
    image: it.image,
    images: it.images,
    specs,
    ...(typeof it.price_per_day_eur === 'number'
      ? { pricePerDay: { usd: Math.round(it.price_per_day_eur * 1.1), eur: it.price_per_day_eur, crypto: 0 } }
      : {}),
    ...(typeof it.pets_allowed === 'boolean' ? { petsAllowed: it.pets_allowed } : {}),
    ...(typeof it.smoking_allowed === 'boolean' ? { smokingAllowed: it.smoking_allowed } : {}),
  };
}

export async function getYachtFleet(): Promise<RentalItem[]> {
  const cp = await getAviationMarineCopy();
  return (cp.yachts || []).map(toRentalItem);
}

/** Returns combined jets + helis (the original `jets` category mixed both). */
export async function getJetFleet(): Promise<RentalItem[]> {
  const cp = await getAviationMarineCopy();
  return [
    ...((cp.jets || []).map(toRentalItem)),
    ...((cp.helis || []).map(toRentalItem)),
  ];
}
