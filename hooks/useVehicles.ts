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
  price_resident_daily: number | null;
  price_nonresident_daily: number | null;
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
  priceResidentDaily?: number;
  priceNonresidentDaily?: number;
  specs: Array<{
    label: { en: string; it: string };
    value: string;
    icon: any;
  }>;
  vehicleIds?: string[]; // For grouped vehicles, stores all actual vehicle IDs
  displayNames?: string[]; // For grouped vehicles, stores all actual vehicle display names
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
  if (lowerName.includes('gle')) return '/mercedes-gle.jpeg';
  if (lowerName.includes('m4')) return '/bmw-m4.jpeg';
  if (lowerName.includes('ducato')) return '/ducato.jpeg';
  if (lowerName.includes('vito') || lowerName.includes('v class')) return '/vito.jpeg';
  if (lowerName.includes('208')) return '/208.jpeg';
  // Clio images temporarily using default until clio4a.jpeg and clio4b.jpeg are added
  if (lowerName.includes('clio') && (lowerName.includes('arancio') || lowerName.includes('orange'))) return '/default-car.jpeg';
  if (lowerName.includes('clio') && (lowerName.includes('blu') || lowerName.includes('blue'))) return '/default-car.jpeg';
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

// Transform database vehicle to expected format
const transformVehicle = (vehicle: Vehicle): TransformedVehicle => {
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
    pricePerDay: vehicle.daily_rate ? {
      usd: Math.round(vehicle.daily_rate * EUR_TO_USD_RATE),
      eur: vehicle.daily_rate,
      crypto: 0
    } : undefined,
    priceResidentDaily: vehicle.price_resident_daily ?? undefined,
    priceNonresidentDaily: vehicle.price_nonresident_daily ?? undefined,
    specs: specsArray
  };
};


const CACHE_KEY_PREFIX = 'dr7_vehicles_cache_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

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
            console.log(`📦 Loaded ${data.length} vehicles from cache (age: ${Math.round(age / 1000 / 60)}min)`);
            setVehicles(data);
            return true;
          }
        }
      } catch (err) {
        console.warn('⚠️ Failed to load from cache:', err);
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

      // Helper: Fetch with timeout and retry
      const fetchWithRetry = async (attemptNumber = 0): Promise<any> => {
        const maxAttempts = 3;
        const timeout = 10000; // 10 seconds
        const backoffDelay = attemptNumber * 1000; // 0ms, 1000ms, 2000ms

        // Wait for backoff delay before retry
        if (backoffDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }

        try {
          // Create timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout after 10s')), timeout);
          });

          // Call Netlify Function instead of direct Supabase REST
          const url = category
            ? `/.netlify/functions/getVehicles?category=${category}`
            : '/.netlify/functions/getVehicles';

          // Race between fetch and timeout
          const fetchPromise = fetch(url).then(async (response) => {
            if (!response.ok) {
              const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
              throw new Error(errorBody.error || `HTTP ${response.status}`);
            }
            const data = await response.json();
            return { data, error: null };
          });

          const { data, error: fetchError } = await Promise.race([
            fetchPromise,
            timeoutPromise
          ]) as any;

          if (fetchError) {
            // Enhanced error logging with full diagnostics
            const browserInfo = getBrowserInfo();
            const requestUrl = `https://ahpmzjgkfxrrgxyirasa.supabase.co/rest/v1/vehicles?select=*&status=neq.retired&order=display_name.asc${category ? `&category=eq.${category}` : ''}`;

            console.error('❌ Error fetching vehicles (detailed diagnostics):', {
              // Request info
              requestUrl,
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
              console.warn(`⚠️ Retrying fetch (attempt ${attemptNumber + 2}/${maxAttempts})...`);
              return fetchWithRetry(attemptNumber + 1);
            }

            throw fetchError;
          }

          return data;
        } catch (err: any) {
          // Handle timeout or network errors
          const browserInfo = getBrowserInfo();
          const requestUrl = `https://ahpmzjgkfxrrgxyirasa.supabase.co/rest/v1/vehicles?select=*&status=neq.retired&order=display_name.asc${category ? `&category=eq.${category}` : ''}`;

          console.error('❌ Fatal error in fetchVehicles (detailed diagnostics):', {
            // Request info
            requestUrl,
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
            console.warn(`⚠️ Retrying fetch after error (attempt ${attemptNumber + 2}/${maxAttempts})...`);
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
        const transformedVehicles = (data || []).map(transformVehicle);

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
              // A group is available if ANY member is available
              available: group.members.some(v => v.available)
            };

            finalVehicles.push(mergedVehicle);
          }
        });

        console.log(`✅ Successfully fetched ${finalVehicles.length} vehicles (category: ${category || 'all'})`);

        // Save to cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: finalVehicles,
            timestamp: Date.now()
          }));
        } catch (err) {
          console.warn('⚠️ Failed to save to cache:', err);
        }

        setVehicles(finalVehicles);
        setError(null);
        setUsingCache(false);
      } catch (err) {
        console.error('❌ Fatal error in fetchVehicles:', {
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
            console.log('📦 Using cached vehicles due to fetch error');
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



