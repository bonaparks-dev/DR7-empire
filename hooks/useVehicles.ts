import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CarIcon } from '../components/icons/Icons';

const EUR_TO_USD_RATE = 1.09;

interface Vehicle {
  id: string;
  display_name: string;
  plate: string | null;
  status: 'available' | 'unavailable' | 'rented' | 'maintenance' | 'retired';
  daily_rate: number;
  category: 'exotic' | 'urban' | 'aziendali' | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

interface TransformedVehicle {
  id: string;
  name: string;
  image: string;
  available: boolean;
  pricePerDay?: {
    usd: number;
    eur: number;
    crypto: number;
  };
  specs: Array<{
    label: { en: string; it: string };
    value: string;
    icon: any;
  }>;
  vehicleIds?: string[]; // For grouped vehicles, stores all actual vehicle IDs
  displayNames?: string[]; // For grouped vehicles, stores all actual vehicle display names
  plates?: string[]; // For grouped vehicles, stores all license plates (targa)
  unavailableFrom?: string; // ISO date string when vehicle becomes unavailable
  bookingDisabled?: boolean; // Hide booking button on card
}

// Helper function to get vehicle image based on name
const getVehicleImage = (name: string): string => {
  if (!name) return '/default-car.jpeg';
  const lowerName = name.toLowerCase();

  if (lowerName.includes('rs3')) return '/rs3.jpeg';
  if (lowerName.includes('m3')) return '/bmw-m3.jpeg';
  if (lowerName.includes('m340')) return '/bmw-m340i.jpeg';
  if (lowerName.includes('911') || lowerName.includes('carrera')) return '/porsche-911.jpeg';
  if (lowerName.includes('c63')) return '/c63.jpeg';
  if (lowerName.includes('a45')) return '/mercedes_amg.jpeg';
  if (lowerName.includes('cayenne')) return '/cayenne.jpeg';
  if (lowerName.includes('macan')) return '/macan.jpeg';
  if (lowerName.includes('gle')) return '/mercedes-gle.jpeg';
  if (lowerName.includes('m4')) return '/bmw-m4.jpeg';
  if (lowerName.includes('ducato')) return '/ducato.jpeg';
  if (lowerName.includes('vito') || lowerName.includes('v class')) return '/vito.jpeg';
  if (lowerName.includes('208')) return '/208.jpeg';
  if (lowerName.includes('clio') && (lowerName.includes('arancio') || lowerName.includes('orange'))) return '/clio4a.jpeg';
  if (lowerName.includes('clio') && (lowerName.includes('blu') || lowerName.includes('blue'))) return '/clio4b.jpeg';
  if (lowerName.includes('c3') && (lowerName.includes('red') || lowerName.includes('rosso'))) return '/c3r.jpeg';
  if (lowerName.includes('c3') && (lowerName.includes('white') || lowerName.includes('bianca'))) return '/cr3w.jpeg';
  if (lowerName.includes('c3')) return '/c3.jpeg'; // fallback for other C3 variants
  if (lowerName.includes('captur')) return '/captur.jpeg';
  if (lowerName.includes('panda') && (lowerName.includes('bianca') || lowerName.includes('white'))) return '/panda2.jpeg';
  if (lowerName.includes('panda') && (lowerName.includes('aranci') || lowerName.includes('orange'))) return '/panda3.jpeg';
  if (lowerName.includes('panda')) return '/panda1.jpeg';

  // Default image
  return '/default-car.jpeg';
};

// Helper function to get vehicle specs based on name
// Helper function to get vehicle specs based on name
const getVehicleSpecs = (name: string) => {
  if (!name) return { acceleration: 'N/A', power: 'N/A', engine: 'N/A' };
  const lowerName = name.toLowerCase();

  // RS3 specs
  if (lowerName.includes('rs3')) {
    return {
      acceleration: '0–100 in 3.8s',
      power: '400Cv',
      torque: '500Nm',
      engine: '2.5L inline 5-cylinder'
    };
  }

  // M3 specs
  if (lowerName.includes('m3') && !lowerName.includes('m340')) {
    return {
      acceleration: '0–100 in 3.9s',
      power: '510Cv',
      torque: '650Nm',
      engine: '3.0L Twin-Turbo Inline-6'
    };
  }

  // M340i specs
  if (lowerName.includes('m340')) {
    return {
      acceleration: '0–100 in 4.4s',
      power: '374Cv',
      torque: '500Nm',
      engine: '3.0L Twin-Turbo Inline-6'
    };
  }

  // 911 Carrera specs
  if (lowerName.includes('911') || lowerName.includes('carrera')) {
    return {
      acceleration: '0–100 in 4.2s',
      power: '385Cv',
      torque: '450Nm',
      engine: '3.0L Twin-Turbo Flat-6'
    };
  }

  // C63 specs
  if (lowerName.includes('c63')) {
    return {
      acceleration: '0–100 in 3.9s',
      power: '510Cv',
      torque: '700Nm',
      engine: '4.0L V8 BiTurbo'
    };
  }

  // A45 specs
  if (lowerName.includes('a45')) {
    return {
      acceleration: '0–100 in 3.9s',
      power: '421Cv',
      torque: '500Nm',
      engine: '2.0L Turbo Inline-4'
    };
  }

  // GLE specs
  if (lowerName.includes('gle')) {
    return {
      acceleration: '0–100 in 5.3s',
      power: '367Cv',
      torque: '500Nm',
      engine: '3.0L Turbo Inline-6'
    };
  }

  // M4 specs
  if (lowerName.includes('m4')) {
    return {
      acceleration: '0–100 in 3.9s',
      power: '510Cv',
      torque: '650Nm',
      engine: '3.0L Twin-Turbo Inline-6'
    };
  }

  // Ducato specs
  if (lowerName.includes('ducato')) {
    return {
      passengers: '9 passengers',
      seats: '9 posti'
    };
  }

  // Default specs
  return {
    acceleration: 'N/A',
    power: 'N/A',
    engine: 'N/A'
  };
};

// Get 1-day price from Centralina Pro tariffe for a vehicle category
function getProDayPrice(proConfig: any, category: string | null): number | null {
  if (!proConfig?.prezzoDinamico?.tariffe) return null
  const PRO_TO_DB: Record<string, string> = { supercars: 'exotic', urban: 'urban', aziendali: 'aziendali' }
  for (const tariff of proConfig.prezzoDinamico.tariffe) {
    const dbCat = PRO_TO_DB[tariff.id] || tariff.id
    if (dbCat === category) {
      const table = tariff.unica || tariff.residente || tariff.non_residente || {}
      const day1 = table['1']
      if (typeof day1 === 'number' && day1 > 0) return day1
    }
  }
  // Also check per-vehicle base_prices
  return null
}

// Transform database vehicle to expected format
const transformVehicle = (vehicle: Vehicle, proConfig?: any): TransformedVehicle => {
  const isAvailable = vehicle.status === 'available';
  // Use metadata.specs if available, otherwise use getVehicleSpecs
  const specs = vehicle.metadata?.specs || getVehicleSpecs(vehicle.display_name);

  // Convert specs object to array format expected by the UI
  const specsArray: any[] = [];

  if (specs.acceleration) {
    specsArray.push({
      label: { en: 'Acceleration', it: 'Accelerazione' },
      value: specs.acceleration,
      icon: CarIcon
    });
  }

  if (specs.power) {
    specsArray.push({
      label: { en: 'Power', it: 'Potenza' },
      value: specs.power,
      icon: CarIcon
    });
  }

  if (specs.torque) {
    specsArray.push({
      label: { en: 'Torque', it: 'Coppia' },
      value: specs.torque,
      icon: CarIcon
    });
  }

  if (specs.engine) {
    specsArray.push({
      label: { en: 'Engine', it: 'Motore' },
      value: specs.engine,
      icon: CarIcon
    });
  }

  if (specs.passengers) {
    specsArray.push({
      label: { en: 'Passengers', it: 'Passeggeri' },
      value: specs.passengers,
      icon: CarIcon
    });
  }

  // Force correct image for Vito/V-Class vehicles, otherwise use metadata or fallback
  const lowerName = vehicle.display_name ? vehicle.display_name.toLowerCase() : '';
  let vehicleImage: string;

  if (lowerName.includes('vito') || lowerName.includes('v class')) {
    // Force correct image for Vito vehicles regardless of metadata
    vehicleImage = '/vito.jpeg';
  } else {
    // Use metadata.image if available, otherwise fallback to getVehicleImage
    vehicleImage = vehicle.metadata?.image || getVehicleImage(vehicle.display_name);
  }

  return {
    id: `car-${vehicle.id}`,
    name: vehicle.display_name,
    image: vehicleImage,
    available: isAvailable,
    pricePerDay: (() => {
      // Priority: per-vehicle Pro base_price > category Pro tariffe (NO vehicle.daily_rate)
      const rawProVehiclePrice = proConfig?.prezzoDinamico?.dynamic?.base_prices?.[vehicle.id]
      const proVehiclePrice = typeof rawProVehiclePrice === 'number' ? rawProVehiclePrice
        : typeof rawProVehiclePrice === 'string' ? parseFloat(rawProVehiclePrice) : NaN
      const proCategoryPrice = getProDayPrice(proConfig, vehicle.category)
      const price = (!isNaN(proVehiclePrice) && proVehiclePrice > 0)
        ? proVehiclePrice
        : (proCategoryPrice || 0)
      console.log(`[useVehicles] ${vehicle.display_name}: raw=${rawProVehiclePrice} parsed=${proVehiclePrice} cat=${proCategoryPrice} → final=${price}`)
      return price > 0 ? { usd: Math.round(price * EUR_TO_USD_RATE), eur: price, crypto: 0 } : undefined
    })(),
    specs: specsArray,
    unavailableFrom: vehicle.metadata?.unavailable_from || undefined,
    bookingDisabled: vehicle.metadata?.booking_disabled || false
  };
};


const CACHE_KEY_PREFIX = 'dr7_vehicles_cache_';
const CACHE_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes (reduced for debugging)

/**
 * Invalidate vehicle cache for a specific category or all categories.
 * Call this after a successful booking to ensure fresh availability data.
 */
export const invalidateVehicleCache = (category?: string) => {
  try {
    if (category) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${category}`);
    } else {
      // Invalidate all vehicle cache keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    }
    console.log('[useVehicles] Cache invalidata dopo prenotazione');
  } catch (err) {
    console.warn('[useVehicles] Impossibile invalidare cache:', err);
  }
};

export const useVehicles = (category?: 'exotic' | 'urban' | 'aziendali') => {
  const [vehicles, setVehicles] = useState<TransformedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  useEffect(() => {
    const cacheKey = `${CACHE_KEY_PREFIX}${category || 'all'}`;

    // Try to load from cache immediately
    const loadFromCache = () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;

          // Use cache if less than 24 hours old
          if (age < CACHE_EXPIRY_MS) {
            console.log(`Loaded ${data.length} vehicles from cache (age: ${Math.round(age / 1000 / 60)}min)`);
            setVehicles(data);
            return true;
          }
        }
      } catch (err) {
        console.warn('Failed to load from cache:', err);
      }
      return false;
    };

    const fetchVehicles = async () => {
      let isMounted = true;

      // Load cache first for instant display
      const hasCache = loadFromCache();
      if (hasCache) {
        setLoading(false); // Show cached data immediately
      }

      // Helper: Detect browser
      const getBrowserInfo = () => {
        const ua = navigator.userAgent;
        const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
        const isSafari = /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor);
        return { isChrome, isSafari, userAgent: ua };
      };

      // Helper: Fetch with timeout and retry (optimized)
      const fetchWithRetry = async (attemptNumber = 0): Promise<any> => {
        const maxAttempts = 2; // Reduced from 3 to 2
        const timeout = 8000; // Reduced from 10s to 8s
        const backoffDelay = attemptNumber * 500; // Reduced: 0ms, 500ms

        // Wait for backoff delay before retry
        if (backoffDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }

        try {
          // Create timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout after 10s')), timeout);
          });

          // 🚨 EMERGENCY FIX: Direct Supabase call instead of broken Netlify function
          // TODO: Restore Netlify function once environment variables are fixed
          let query = supabase
            .from('vehicles')
            .select('*')
            .neq('status', 'retired')
            .order('display_name', { ascending: true });

          // Filter by category if specified
          if (category && ['exotic', 'urban', 'aziendali'].includes(category)) {
            query = query.eq('category', category);
          }

          // Execute query directly
          const fetchPromise = query.then(({ data, error }) => {
            if (error) {
              throw error;
            }
            return { data, error: null };
          });

          const { data, error: fetchError } = await Promise.race([
            fetchPromise,
            timeoutPromise
          ]) as any;

          if (fetchError) {
            // Enhanced error logging with full diagnostics
            const browserInfo = getBrowserInfo();
            console.error('Error fetching vehicles (detailed diagnostics):', {
              // Request info
              requestUrl: '[vehicles endpoint]',
              category,
              attemptNumber: attemptNumber + 1,
              maxAttempts,

              // Error details
              errorMessage: fetchError.message,
              errorName: fetchError.name,
              errorCode: fetchError.code,
              errorDetails: fetchError.details,
              errorHint: fetchError.hint,
              errorStack: fetchError.stack,

              // Network info
              networkOnline: navigator.onLine,

              // Browser info
              browser: browserInfo.isChrome ? 'Chrome' : browserInfo.isSafari ? 'Safari' : 'Other',
              userAgent: browserInfo.userAgent,

              // Timestamp
              timestamp: new Date().toISOString(),

              // CORS/blocking indicators
              possibleCORS: fetchError.message?.includes('CORS') || fetchError.message?.includes('blocked'),
              possibleMixedContent: fetchError.message?.includes('mixed content'),
            });

            // Retry logic
            if (attemptNumber < maxAttempts - 1) {
              console.warn(`Retrying fetch (attempt ${attemptNumber + 2}/${maxAttempts})...`);
              return fetchWithRetry(attemptNumber + 1);
            }

            throw fetchError;
          }

          return data;
        } catch (err: any) {
          // Handle timeout or network errors
          const browserInfo = getBrowserInfo();
          console.error('Fatal error in fetchVehicles (detailed diagnostics):', {
            // Request info
            requestUrl: '[vehicles endpoint]',
            category,
            attemptNumber: attemptNumber + 1,
            maxAttempts,

            // Error details
            errorMessage: err.message,
            errorName: err.name,
            errorStack: err.stack,

            // Network info
            networkOnline: navigator.onLine,

            // Browser info
            browser: browserInfo.isChrome ? 'Chrome' : browserInfo.isSafari ? 'Safari' : 'Other',
            userAgent: browserInfo.userAgent,

            // Timestamp
            timestamp: new Date().toISOString(),

            // Error type indicators
            isTimeout: err.message?.includes('timeout'),
            isNetworkError: err.message?.includes('fetch') || err.message?.includes('network'),
            possibleHTTP2Error: err.message?.includes('HTTP2') || err.message?.includes('ERR_'),
          });

          // Retry logic for network errors
          if (attemptNumber < maxAttempts - 1) {
            console.warn(`Retrying fetch after error (attempt ${attemptNumber + 2}/${maxAttempts})...`);
            return fetchWithRetry(attemptNumber + 1);
          }

          throw err;
        }
      };

      try {
        setError(null);
        setUsingCache(false);

        const data = await fetchWithRetry();

        if (!isMounted) return;

        // Transform vehicles to expected format
        console.log(`[useVehicles] Raw DB returned ${(data || []).length} vehicles for category: ${category || 'all'}`, (data || []).map((v: any) => `${v.display_name} (${v.status})`));
        // Fetch Pro config for card prices
        let proConfig: any = null
        try {
          const { data: proRow, error: proError } = await supabase
            .from('centralina_pro_config')
            .select('config')
            .eq('id', 'main')
            .maybeSingle()
          if (proError) {
            console.error('[useVehicles] Pro config fetch ERROR:', proError.message, proError.code)
          } else {
            proConfig = proRow?.config || null
            console.log('[useVehicles] Pro config loaded:', proConfig ? `${Object.keys(proConfig).length} keys, base_prices: ${JSON.stringify(Object.keys(proConfig?.prezzoDinamico?.dynamic?.base_prices || {}))}` : 'NULL')
          }
        } catch (err) { console.error('[useVehicles] Pro config fetch EXCEPTION:', err) }

        const transformedVehicles = (data || []).map((v: Vehicle) => transformVehicle(v, proConfig));

        // Group vehicles by display_group if they have one, or display_name otherwise
        const vehicleGroups = new Map<string, {
          members: TransformedVehicle[];
          originals: any[];
        }>();

        transformedVehicles.forEach((vehicle: any, index: number) => {
          const originalVehicle = data?.[index];

          // Helper to normalize strings for grouping
          const normalizeKey = (str: string) => (str || '').toLowerCase().replace(/\s+/g, ' ').trim();

          // Key priority: Valid display_group -> display_name (normalized)
          // Ensure we have a valid name to group by, fallback to ID if mostly broken
          const rawName = vehicle.name || `unknown-${vehicle.id}`;
          const key = originalVehicle?.metadata?.display_group || normalizeKey(rawName);

          if (!vehicleGroups.has(key)) {
            vehicleGroups.set(key, { members: [], originals: [] });
          }
          const group = vehicleGroups.get(key)!;
          group.members.push(vehicle);
          group.originals.push(originalVehicle);
        });

        const finalVehicles: TransformedVehicle[] = [];

        vehicleGroups.forEach((group) => {
          if (group.members.length === 1 && !group.originals[0]?.metadata?.display_group) {
            // Single vehicle, no explicit group intent -> Render as is
            finalVehicles.push(group.members[0]);
          } else {
            // Multiple vehicles OR explicit group -> Merge

            // Find the first available member to serve as the "representative"
            // This ensures that when the user books, they are booking an available car ID
            const firstAvailable = group.members.find(m => m.available) || group.members[0];

            // Create a merged vehicle representing the group
            const mergedVehicle: TransformedVehicle = {
              ...firstAvailable, // Use the available one's ID and details (image, name, etc)
              vehicleIds: group.originals.map(v => v.id),
              displayNames: group.originals.map(v => v.display_name),
              plates: group.originals.map(v => v.plate).filter(Boolean),
              // A group is available if ANY member is available
              available: group.members.some(v => v.available)
            };

            finalVehicles.push(mergedVehicle);
          }
        });

        console.log(`Successfully fetched ${finalVehicles.length} vehicles (category: ${category || 'all'})`);

        // Save to cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: finalVehicles,
            timestamp: Date.now()
          }));
        } catch (err) {
          console.warn('Failed to save to cache:', err);
        }

        setVehicles(finalVehicles);
        setError(null);
        setUsingCache(false);
      } catch (err) {
        console.error('Fatal error in fetchVehicles:', {
          error: err,
          errorMessage: (err as Error).message,
          errorName: (err as Error).name,
          category,
          networkOnline: navigator.onLine,
        });

        if (isMounted) {
          setError(err as Error);
          // If we have cache, use it and mark as using cache
          if (hasCache) {
            setUsingCache(true);
            console.log('Using cached vehicles due to fetch error');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
      return () => { isMounted = false; };
    };

    fetchVehicles();
  }, [category]);

  return { vehicles, loading, error, usingCache };
};



