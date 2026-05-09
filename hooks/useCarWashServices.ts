import { useState, useEffect } from 'react';
import type { WashService } from '../pages/CarWashServicesPage';

/**
 * Single source of truth for the Prime Wash catalog on the website.
 * Fetches from `/.netlify/functions/get-car-wash-services` (which reads
 * `car_wash_services` in Supabase, managed by admin Catalogo Lavaggio).
 *
 * No persistent cache: admin updates to images, prices, descriptions etc
 * must be visible immediately. We only de-duplicate concurrent in-flight
 * requests via the `pending` Promise so multiple components mounting in
 * the same render don't hammer the function.
 */

interface RawService extends WashService {
  category?: string;
  main_tab?: string;
}

let pending: Promise<RawService[]> | null = null;

async function fetchOnce(): Promise<RawService[]> {
  if (pending) return pending;
  pending = fetch('/.netlify/functions/get-car-wash-services', { cache: 'no-store' })
    .then((r) => r.json())
    .then((data: { services?: RawService[] }) => data.services || [])
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
  const [services, setServices] = useState<RawService[]>([]);
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
  pending = null;
}

export type { RawService as CarWashServiceRow };
