/**
 * KM Pricing Data for DR7 Empire Car Rentals
 * Fuel penalties and kilometer package costs
 */

export interface VehiclePricingData {
  model: string;
  tank_capacity_liters: number;
  doors: number;
  refill_value_euros: number;
  value_per_door_euros: number;
  overage_cost_per_km_euros: number;
}

export interface KmPackage {
  distance_km: number;
  price_standard?: number;
  price_first_purchase: number;
  price_plus_20_percent_travel: number;
}

export interface UnlimitedKmOption {
  duration: string;
  duration_days?: number;
  price_first_purchase: number;
  price_plus_20_percent_travel: number;
}

export const FUEL_PRICE_REFERENCE = {
  type: "Benzina",
  price_per_liter: 3.00,
  currency: "EUR"
};

export const VEHICLES_PRICING: VehiclePricingData[] = [
  {
    model: "Audi RS3 2024",
    tank_capacity_liters: 55,
    doors: 4,
    refill_value_euros: 165.0,
    value_per_door_euros: 41.25,
    overage_cost_per_km_euros: 1.5
  },
  {
    model: "Mercedes A45 AMG 2024",
    tank_capacity_liters: 51,
    doors: 4,
    refill_value_euros: 153.0,
    value_per_door_euros: 38.25,
    overage_cost_per_km_euros: 1.5
  },
  {
    model: "BMW M3 Competition 2023",
    tank_capacity_liters: 59,
    doors: 4,
    refill_value_euros: 177.0,
    value_per_door_euros: 44.25,
    overage_cost_per_km_euros: 1.5
  },
  {
    model: "Mercedes GLE 53 2023",
    tank_capacity_liters: 85,
    doors: 4,
    refill_value_euros: 255.0,
    value_per_door_euros: 63.75,
    overage_cost_per_km_euros: 1.5
  },
  {
    model: "Mercedes GLE 63 2024",
    tank_capacity_liters: 85,
    doors: 4,
    refill_value_euros: 255.0,
    value_per_door_euros: 63.75,
    overage_cost_per_km_euros: 1.5
  },
  {
    model: "Porsche Macan GTS 2024",
    tank_capacity_liters: 75,
    doors: 8,
    refill_value_euros: 225.0,
    value_per_door_euros: 28.12,
    overage_cost_per_km_euros: 1.5
  },
  {
    model: "Mercedes C63 S Performante",
    tank_capacity_liters: 66,
    doors: 4,
    refill_value_euros: 198.0,
    value_per_door_euros: 49.5,
    overage_cost_per_km_euros: 1.5
  },
  {
    model: "Porsche 2019 (911 Carrera)",
    tank_capacity_liters: 64,
    doors: 10,
    refill_value_euros: 192.0,
    value_per_door_euros: 19.2,
    overage_cost_per_km_euros: 1.5
  }
];

// Standard vehicles (all except Ferrari and Lamborghini)
export const KM_PACKAGES_STANDARD: KmPackage[] = [
  {
    distance_km: 100,
    price_standard: 100,
    price_first_purchase: 100,
    price_plus_20_percent_travel: 120
  },
  {
    distance_km: 200,
    price_standard: 180,
    price_first_purchase: 180,
    price_plus_20_percent_travel: 216
  },
  {
    distance_km: 300,
    price_standard: 250,
    price_first_purchase: 250,
    price_plus_20_percent_travel: 300
  }
];

// Premium vehicles (Ferrari and Lamborghini)
export const KM_PACKAGES_PREMIUM: KmPackage[] = [
  {
    distance_km: 100,
    price_first_purchase: 200,
    price_plus_20_percent_travel: 240
  },
  {
    distance_km: 200,
    price_first_purchase: 360,
    price_plus_20_percent_travel: 432
  },
  {
    distance_km: 300,
    price_first_purchase: 500,
    price_plus_20_percent_travel: 600
  }
];

// Unlimited KM for standard vehicles
export const UNLIMITED_KM_STANDARD: UnlimitedKmOption[] = [
  {
    duration: "1 giorno",
    duration_days: 1,
    price_first_purchase: 300,
    price_plus_20_percent_travel: 360
  },
  {
    duration: "2 giorni",
    duration_days: 2,
    price_first_purchase: 550,
    price_plus_20_percent_travel: 660
  },
  {
    duration: "3 giorni",
    duration_days: 3,
    price_first_purchase: 600,
    price_plus_20_percent_travel: 720
  },
  {
    duration: "Dal 4° giorno in poi (+/gg)",
    duration_days: 4,
    price_first_purchase: 150,
    price_plus_20_percent_travel: 180
  }
];

// Unlimited KM for premium vehicles (Ferrari and Lamborghini)
export const UNLIMITED_KM_PREMIUM: UnlimitedKmOption[] = [
  {
    duration: "1 giorno",
    duration_days: 1,
    price_first_purchase: 600,
    price_plus_20_percent_travel: 720
  },
  {
    duration: "2 giorni",
    duration_days: 2,
    price_first_purchase: 1100,
    price_plus_20_percent_travel: 1320
  },
  {
    duration: "3 giorni",
    duration_days: 3,
    price_first_purchase: 1200,
    price_plus_20_percent_travel: 1440
  },
  {
    duration: "Dal 4° giorno in poi (+/gg)",
    duration_days: 4,
    price_first_purchase: 300,
    price_plus_20_percent_travel: 360
  }
];

/**
 * Check if a vehicle is premium (Ferrari or Lamborghini)
 */
export const isPremiumVehicle = (vehicleName: string): boolean => {
  const lowerName = vehicleName.toLowerCase();
  return lowerName.includes('ferrari') || lowerName.includes('lamborghini');
};

/**
 * Check if a vehicle is Ducato (special pricing)
 */
export const isDucatoVehicle = (vehicleName: string): boolean => {
  const lowerName = vehicleName.toLowerCase();
  return lowerName.includes('ducato');
};

/**
 * Get KM packages for a vehicle
 */
export const getKmPackages = (vehicleName: string): KmPackage[] => {
  return isPremiumVehicle(vehicleName) ? KM_PACKAGES_PREMIUM : KM_PACKAGES_STANDARD;
};

/**
 * Get unlimited KM options for a vehicle
 */
export const getUnlimitedKmOptions = (vehicleName: string): UnlimitedKmOption[] => {
  return isPremiumVehicle(vehicleName) ? UNLIMITED_KM_PREMIUM : UNLIMITED_KM_STANDARD;
};

/**
 * Calculate unlimited KM price based on rental duration
 */
export const calculateUnlimitedKmPrice = (
  vehicleName: string,
  rentalDays: number,
  isFirstPurchase: boolean = true
): number => {
  // Special pricing for Ducato: flat €100 for unlimited km
  if (isDucatoVehicle(vehicleName)) {
    return 100;
  }

  const options = getUnlimitedKmOptions(vehicleName);
  const priceKey = isFirstPurchase ? 'price_first_purchase' : 'price_plus_20_percent_travel';

  if (rentalDays <= 0) return 0;

  // Find exact match first
  const exactMatch = options.find(opt => opt.duration_days === rentalDays);
  if (exactMatch) {
    return exactMatch[priceKey];
  }

  // For 1-3 days, use the specific option
  if (rentalDays <= 3) {
    const option = options.find(opt => opt.duration_days === rentalDays);
    return option ? option[priceKey] : 0;
  }

  // For 4+ days: use 3-day price + (days-3) * daily rate
  const threeDayOption = options.find(opt => opt.duration_days === 3);
  const dailyOption = options.find(opt => opt.duration === "Dal 4° giorno in poi (+/gg)");

  if (threeDayOption && dailyOption) {
    return threeDayOption[priceKey] + ((rentalDays - 3) * dailyOption[priceKey]);
  }

  return 0;
};

/**
 * Get vehicle-specific pricing data
 */
export const getVehiclePricingData = (vehicleName: string): VehiclePricingData | undefined => {
  return VEHICLES_PRICING.find(v =>
    vehicleName.toLowerCase().includes(v.model.toLowerCase()) ||
    v.model.toLowerCase().includes(vehicleName.toLowerCase())
  );
};

/**
 * Recommend optimal KM package based on expected distance
 */
export const recommendKmPackage = (expectedKm: number, vehicleName: string, rentalDays: number): {
  type: 'package' | 'unlimited';
  packageKm?: number;
  price: number;
  reason: string;
} => {
  const packages = getKmPackages(vehicleName);
  const isPremium = isPremiumVehicle(vehicleName);

  // Calculate unlimited price
  const unlimitedPrice = calculateUnlimitedKmPrice(vehicleName, rentalDays, true);

  // If expected km is 0 or not specified, recommend smallest package
  if (expectedKm <= 0) {
    return {
      type: 'package',
      packageKm: 100,
      price: packages[0].price_first_purchase,
      reason: 'Pacchetto base consigliato'
    };
  }

  // Find best matching package
  const matchingPackage = packages.find(pkg => pkg.distance_km >= expectedKm);

  if (matchingPackage) {
    // Compare package price with unlimited
    if (unlimitedPrice && matchingPackage.price_first_purchase >= unlimitedPrice * 0.8) {
      return {
        type: 'unlimited',
        price: unlimitedPrice,
        reason: 'Km illimitati - miglior rapporto qualità/prezzo'
      };
    }

    return {
      type: 'package',
      packageKm: matchingPackage.distance_km,
      price: matchingPackage.price_first_purchase,
      reason: `Copre i tuoi ${expectedKm} km previsti`
    };
  }

  // If expected km exceeds max package (300km), recommend unlimited
  return {
    type: 'unlimited',
    price: unlimitedPrice,
    reason: `Km illimitati consigliati per ${expectedKm} km previsti`
  };
};
