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
}

// Helper function to get vehicle image based on name
const getVehicleImage = (name: string): string => {
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
  if (lowerName.includes('208')) return '/208.jpeg';
  if (lowerName.includes('clio') && lowerName.includes('arancio')) return '/clio4a.jpeg';

  // Default image
  return '/default-car.jpeg';
};

// Helper function to get vehicle specs based on name
const getVehicleSpecs = (name: string) => {
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

  // Use metadata.image if available, otherwise fallback to getVehicleImage
  const vehicleImage = vehicle.metadata?.image || getVehicleImage(vehicle.display_name);

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
    specs: specsArray
  };
};

export const useVehicles = (category?: 'exotic' | 'urban' | 'aziendali') => {
  const [vehicles, setVehicles] = useState<TransformedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);

        let query = supabase
          .from('vehicles')
          .select('*')
          .neq('status', 'retired')
          .order('display_name');

        // Filter by category if specified
        if (category) {
          query = query.eq('category', category);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Transform vehicles to expected format
        const transformedVehicles = (data || []).map(transformVehicle);

        // Group vehicles by display_group if they have one in metadata
        const groupedVehicles: TransformedVehicle[] = [];
        const processedGroups = new Set<string>();
        const ungroupedVehicles: TransformedVehicle[] = [];

        transformedVehicles.forEach((vehicle, index) => {
          const originalVehicle = data?.[index];
          const displayGroup = originalVehicle?.metadata?.display_group;

          if (displayGroup && !processedGroups.has(displayGroup)) {
            // Find all vehicles in this group
            const groupMembers = transformedVehicles.filter((v, i) => {
              return data?.[i]?.metadata?.display_group === displayGroup;
            });

            // Get original vehicle data for all group members
            const groupOriginalVehicles = (data || []).filter(v => v.metadata?.display_group === displayGroup);

            // Create a merged vehicle representing the group
            // Use the first vehicle's data but track all vehicle IDs
            const mergedVehicle: TransformedVehicle = {
              ...groupMembers[0],
              vehicleIds: groupOriginalVehicles.map(v => v.id),
              displayNames: groupOriginalVehicles.map(v => v.display_name),
              // A group is available if ANY member is available
              available: groupMembers.some(v => v.available)
            };

            groupedVehicles.push(mergedVehicle);
            processedGroups.add(displayGroup);
          } else if (!displayGroup) {
            // Vehicle is not part of a group
            ungroupedVehicles.push(vehicle);
          }
          // Skip vehicles that are part of an already processed group
        });

        // Combine grouped and ungrouped vehicles
        const finalVehicles = [...groupedVehicles, ...ungroupedVehicles];

        setVehicles(finalVehicles);
        setError(null);
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [category]);

  return { vehicles, loading, error };
};
