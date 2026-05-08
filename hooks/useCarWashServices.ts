import { useState, useEffect } from 'react';
import type { WashService } from '../pages/CarWashServicesPage';

/**
 * Single source of truth for the Prime Wash catalog on the website.
 * Fetches from `/.netlify/functions/get-car-wash-services` (which reads
 * `car_wash_services` in Supabase, managed by admin Catalogo Lavaggio).
 *
 * Module-level cache so multiple components (page, wizard, booking page)
 * share one network request per page load. Call `invalidateCarWashServicesCache()`
 * after admin edits if you want a forced re-fetch.
 */

interface RawService extends WashService {
  category?: string;
  main_tab?: string;
}

let cache: RawService[] | null = null;
let pending: Promise<RawService[]> | null = null;

async function fetchOnce(): Promise<RawService[]> {
  if (cache) return cache;
  if (pending) return pending;
  pending = fetch('/.netlify/functions/get-car-wash-services')
    .then((r) => r.json())
    .then((data: { services?: RawService[] }) => {
      cache = data.services || [];
      return cache;
    })
    .catch((err) => {
      console.error('[useCarWashServices] fetch failed:', err);
      return [];
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

export function useCarWashServices(): RawService[] {
  const [services, setServices] = useState<RawService[]>(cache || []);
  useEffect(() => {
    let cancelled = false;
    fetchOnce().then((list) => {
      if (!cancelled) setServices(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return services;
}

export function invalidateCarWashServicesCache(): void {
  cache = null;
  pending = null;
}

export type { RawService as CarWashServiceRow };
