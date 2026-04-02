/**
 * Multi-Day Pricing System
 *
 * Implements progressive discounts for longer rental periods.
 * Prices are driven by admin Centralina config (rental_day_rates).
 * Hardcoded tables below are FALLBACK defaults only.
 *
 * NOTE: Massimo Runchina has separate pricing logic that takes priority.
 */

export interface MultiDayPriceTable {
    [days: number]: {
        resident: number;
        nonResident: number;
    };
}

// ========================================
// FALLBACK PRICING TABLES (used only when admin config unavailable)
// Source of truth: DR7-empire-admin → src/hooks/rentalConfigDefaults.ts
// ========================================

export const SUPERCAR_PRICES: MultiDayPriceTable = {
    1: { resident: 349, nonResident: 449 },
    2: { resident: 698, nonResident: 898 },
    3: { resident: 980, nonResident: 1289 },
    4: { resident: 1290, nonResident: 1690 },
    5: { resident: 1590, nonResident: 2190 },
    6: { resident: 1990, nonResident: 2590 },
    7: { resident: 2290, nonResident: 2890 },
};

export const UTILITARIA_PRICES: { [days: number]: number } = {
    1: 39,
    2: 78,
    3: 109,
    4: 129,
    5: 149,
    6: 179,
    7: 189,
    30: 689,
};

export const V_CLASS_PRICES: { [days: number]: number } = {
    1: 239,
    2: 469,
    3: 689,
    4: 889,
    5: 1090,
    6: 1249,
    7: 1390,
};

export const FURGONE_PRICES: { [days: number]: number } = {
    1: 139,
    2: 278,
    3: 389,
    4: 490,
    5: 590,
    6: 649,
    7: 689,
};

// ========================================
// DYNAMIC CONFIG TYPES
// ========================================

export interface DynamicRentalDayRates {
    exotic: {
        resident: Record<string, number>;
        non_resident: Record<string, number>;
    };
    urban: { flat: Record<string, number>; extrapolation?: string };
    furgone: { flat: Record<string, number> };
}

// ========================================
// CALCULATION FUNCTIONS
// ========================================

/**
 * Calculate multi-day price for Supercar vehicles.
 * Uses dynamic rates from admin config when available, falls back to hardcoded table.
 */
export function calculateSupercarMultiDayPrice(
    days: number,
    isResident: boolean,
    dynamicRates?: DynamicRentalDayRates | null
): number {
    const residentRates = dynamicRates?.exotic?.resident
    const nonResidentRates = dynamicRates?.exotic?.non_resident

    const rateTable = isResident
        ? (residentRates && Object.keys(residentRates).length > 0 ? residentRates : null)
        : (nonResidentRates && Object.keys(nonResidentRates).length > 0 ? nonResidentRates : null)

    if (rateTable) {
        // Use dynamic config rates
        if (rateTable[String(days)] !== undefined) {
            return rateTable[String(days)]
        }
        // Extrapolate beyond day 7 using day7_average
        const day7 = rateTable['7']
        if (day7 !== undefined && days > 7) {
            const avgRate = day7 / 7
            return Math.round(day7 + (days - 7) * avgRate)
        }
        // Extrapolate below day 1 (edge case)
        const day1 = rateTable['1']
        if (day1 !== undefined) return days * day1
    }

    // Fallback: hardcoded table
    const table = isResident
        ? Object.fromEntries(Object.entries(SUPERCAR_PRICES).map(([k, v]) => [k, v.resident]))
        : Object.fromEntries(Object.entries(SUPERCAR_PRICES).map(([k, v]) => [k, v.nonResident]))

    if (days >= 1 && days <= 7 && table[days] !== undefined) {
        return table[days]
    }
    if (days > 7) {
        const day7Price = table[7]
        const day7AvgRate = day7Price / 7
        return Math.round(day7Price + (days - 7) * day7AvgRate)
    }
    const oneDayRate = table[1]
    return days * oneDayRate
}

/**
 * Calculate multi-day price for Utilitaria vehicles.
 * Uses dynamic rates from admin config when available.
 */
export function calculateUtilitariaMultiDayPrice(
    days: number,
    dynamicRates?: DynamicRentalDayRates | null
): number {
    const flatRates = dynamicRates?.urban?.flat

    if (flatRates && Object.keys(flatRates).length > 0) {
        if (flatRates[String(days)] !== undefined) return flatRates[String(days)]

        if (days > 7 && days <= 30) {
            const day7 = flatRates['7'] ?? UTILITARIA_PRICES[7]
            const day30 = flatRates['30'] ?? UTILITARIA_PRICES[30]
            const dailyRate = (day30 - day7) / (30 - 7)
            return Math.round(day7 + (days - 7) * dailyRate)
        }
        if (days > 30) {
            const day30 = flatRates['30'] ?? UTILITARIA_PRICES[30]
            const dailyRate = day30 / 30
            return Math.round(day30 + (days - 30) * dailyRate)
        }
        const day1 = flatRates['1'] ?? UTILITARIA_PRICES[1]
        return days * day1
    }

    // Fallback: hardcoded table
    if (days >= 1 && days <= 7 && UTILITARIA_PRICES[days]) return UTILITARIA_PRICES[days]
    if (days > 7 && days <= 30) {
        const day7Price = UTILITARIA_PRICES[7]
        const day30Price = UTILITARIA_PRICES[30]
        const dailyRate = (day30Price - day7Price) / (30 - 7)
        return Math.round(day7Price + (days - 7) * dailyRate)
    }
    if (days > 30) {
        const day30Price = UTILITARIA_PRICES[30]
        const dailyRate = day30Price / 30
        return Math.round(day30Price + (days - 30) * dailyRate)
    }
    return days * UTILITARIA_PRICES[1]
}

/**
 * Calculate multi-day price for V_CLASS (Mercedes Vito) vehicles.
 */
export function calculateVClassMultiDayPrice(days: number): number {
    if (days >= 1 && days <= 7 && V_CLASS_PRICES[days]) return V_CLASS_PRICES[days]
    if (days > 7) {
        const day7Price = V_CLASS_PRICES[7]
        const day7AvgRate = day7Price / 7
        return Math.round(day7Price + (days - 7) * day7AvgRate)
    }
    return days * V_CLASS_PRICES[1]
}

/**
 * Calculate multi-day price for FURGONE (Fiat Ducato) vehicles.
 * Uses dynamic rates when available.
 */
export function calculateFurgoneMultiDayPrice(
    days: number,
    dynamicRates?: DynamicRentalDayRates | null
): number {
    const flatRates = dynamicRates?.furgone?.flat

    if (flatRates && Object.keys(flatRates).length > 0) {
        if (flatRates[String(days)] !== undefined) return flatRates[String(days)]
        if (days > 7) {
            const day7 = flatRates['7'] ?? FURGONE_PRICES[7]
            const avgRate = day7 / 7
            return Math.round(day7 + (days - 7) * avgRate)
        }
        return days * (flatRates['1'] ?? FURGONE_PRICES[1])
    }

    // Fallback
    if (days >= 1 && days <= 7 && FURGONE_PRICES[days]) return FURGONE_PRICES[days]
    if (days > 7) {
        const day7Price = FURGONE_PRICES[7]
        const day7AvgRate = day7Price / 7
        return Math.round(day7Price + (days - 7) * day7AvgRate)
    }
    return days * FURGONE_PRICES[1]
}

/**
 * Main function to calculate multi-day rental cost.
 * Accepts optional dynamic rates from admin Centralina config.
 * Falls back to hardcoded tables if config unavailable.
 */
export function calculateMultiDayPrice(
    vehicleType: string,
    days: number,
    baseDailyRate: number,
    isResident: boolean = false,
    dynamicRates?: DynamicRentalDayRates | null
): number {
    switch (vehicleType) {
        case 'SUPERCAR':
            return calculateSupercarMultiDayPrice(days, isResident, dynamicRates)

        case 'UTILITARIA':
            return calculateUtilitariaMultiDayPrice(days, dynamicRates)

        case 'V_CLASS':
            return calculateVClassMultiDayPrice(days)

        case 'FURGONE':
            return calculateFurgoneMultiDayPrice(days, dynamicRates)

        default:
            return days * baseDailyRate
    }
}

/**
 * Get the effective daily rate for display purposes.
 */
export function getEffectiveDailyRate(
    vehicleType: string,
    days: number,
    baseDailyRate: number,
    isResident: boolean = false,
    dynamicRates?: DynamicRentalDayRates | null
): number {
    const totalCost = calculateMultiDayPrice(vehicleType, days, baseDailyRate, isResident, dynamicRates)
    return totalCost / days
}

/**
 * Calculate included km from admin config table.
 * Falls back to hardcoded progression if config unavailable.
 */
export function calculateIncludedKmFromConfig(
    days: number,
    kmConfig?: { table: Record<string, number>; extra_per_day: number } | null
): number {
    if (days <= 0) return 0

    if (kmConfig?.table && Object.keys(kmConfig.table).length > 0) {
        const table = kmConfig.table
        if (table[String(days)] !== undefined) return table[String(days)]

        // Find highest table entry and extrapolate
        const keys = Object.keys(table).map(Number).sort((a, b) => a - b)
        const maxKey = keys[keys.length - 1]
        if (days > maxKey) {
            const maxKm = table[String(maxKey)]
            return maxKm + (days - maxKey) * (kmConfig.extra_per_day ?? 60)
        }
        // Interpolate between nearest entries
        const lower = keys.filter(k => k <= days).pop()
        const upper = keys.find(k => k > days)
        if (lower !== undefined && upper !== undefined) {
            const kmLower = table[String(lower)]
            const kmUpper = table[String(upper)]
            return Math.round(kmLower + ((days - lower) / (upper - lower)) * (kmUpper - kmLower))
        }
    }

    // Hardcoded fallback (matches rentalConfigDefaults)
    if (days === 1) return 100
    if (days === 2) return 180
    if (days === 3) return 240
    if (days === 4) return 280
    if (days === 5) return 300
    return 300 + (days - 5) * 60
}
