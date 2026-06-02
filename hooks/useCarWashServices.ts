import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { WashService } from '../pages/CarWashServicesPage';

/**
 * Single source of truth for the Prime Wash catalog on the website.
 * Fetches from `/.netlify/functions/get-car-wash-services` (which reads
 * `car_wash_services` in Supabase, managed by admin Catalogo Lavaggio).
 *
 * 2026-06-02: subscription Supabase realtime su `car_wash_services` —
 * quando l'admin modifica un servizio (prezzo, durata, descrizione)
 * il sito ri-fetcha automaticamente senza dover ricaricare la pagina.
 * Prima il client cachava lo stato del componente e non vedeva mai gli
 * update finche' non si chiudeva il tab.
 *
 * No persistent cache: admin updates to images, prices, descriptions etc
 * must be visible immediately.
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
    const load = () => {
      fetchOnce().then((list) => {
        if (!cancelled) setServices(list);
      });
    };
    load();

    // 2026-06-02: realtime — quando admin Catalogo Prime Wash modifica una
    // riga di car_wash_services, ri-fetch immediato. Risultato: cambi di
    // durata/prezzo/nome visibili sul wizard del cliente senza ricaricare.
    const channel = supabase
      .channel('car-wash-services-website-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'car_wash_services' },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);
  return services;
}

export function invalidateCarWashServicesCache(): void {
  pending = null;
}

export type { RawService as CarWashServiceRow };
