// Adapter: async getters that return location data either from the admin
// config (centralina_pro_config.site_copy.locations) or the constants.ts
// fallback. Shape matches the legacy constants exports so callers don't
// need to change how they index/lookup items.
import { getLocationsCopy, type BilingualLocationItem } from './siteCopy';
import {
  AIRPORTS as DEFAULT_AIRPORTS,
  PICKUP_LOCATIONS as DEFAULT_PICKUP_LOCATIONS,
  RETURN_LOCATIONS as DEFAULT_RETURN_LOCATIONS,
  YACHT_PICKUP_MARINAS as DEFAULT_YACHT_PICKUP_MARINAS,
  HELI_DEPARTURE_POINTS as DEFAULT_HELI_DEPARTURE_POINTS,
  HELI_ARRIVAL_POINTS as DEFAULT_HELI_ARRIVAL_POINTS,
} from '../constants';

interface LegacyBilingualItem {
  id: string;
  label: { en: string; it: string };
}

function toLegacyBilingual(items: BilingualLocationItem[]): LegacyBilingualItem[] {
  return items.map(it => ({ id: it.id, label: { en: it.label_en, it: it.label_it } }));
}

/** Airports — same shape as DEFAULT_AIRPORTS. */
export async function getAirports() {
  const loc = await getLocationsCopy();
  return loc.airports && loc.airports.length > 0 ? loc.airports : DEFAULT_AIRPORTS;
}

/** Pickup locations — legacy shape `{ id, label: { en, it } }`. */
export async function getPickupLocations(): Promise<LegacyBilingualItem[]> {
  const loc = await getLocationsCopy();
  return loc.pickup_locations && loc.pickup_locations.length > 0
    ? toLegacyBilingual(loc.pickup_locations)
    : DEFAULT_PICKUP_LOCATIONS;
}

/** Return locations — legacy shape `{ id, label: { en, it } }`. */
export async function getReturnLocations(): Promise<LegacyBilingualItem[]> {
  const loc = await getLocationsCopy();
  return loc.return_locations && loc.return_locations.length > 0
    ? toLegacyBilingual(loc.return_locations)
    : DEFAULT_RETURN_LOCATIONS;
}

/** Yacht marinas — legacy shape `{ id, label: { en, it } }`. */
export async function getYachtMarinas(): Promise<LegacyBilingualItem[]> {
  const loc = await getLocationsCopy();
  return loc.yacht_marinas && loc.yacht_marinas.length > 0
    ? toLegacyBilingual(loc.yacht_marinas)
    : DEFAULT_YACHT_PICKUP_MARINAS;
}

/** Heli departure points — same shape `{ id, name }`. */
export async function getHeliDeparturePoints() {
  const loc = await getLocationsCopy();
  return loc.heli_departure_points && loc.heli_departure_points.length > 0
    ? loc.heli_departure_points
    : DEFAULT_HELI_DEPARTURE_POINTS;
}

/** Heli arrival points — same shape `{ id, name }`. */
export async function getHeliArrivalPoints() {
  const loc = await getLocationsCopy();
  return loc.heli_arrival_points && loc.heli_arrival_points.length > 0
    ? loc.heli_arrival_points
    : DEFAULT_HELI_ARRIVAL_POINTS;
}
