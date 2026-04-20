/**
 * Multi-Day Pricing System
 *
 * Centralina Pro is the single source of truth.
 * No hardcoded prices, no hardcoded km tables.
 * If Centralina Pro has no data, price = days × baseDailyRate and km = 0.
 */

export interface MultiDayPriceTable {
    [days: number]: number;
}

// ========================================
// DYNAMIC CONFIG TYPES
// ========================================

export interface DynamicRentalDayRates {
    exotic: {
        resident: Record<string, number>;
        non_resident?: Record<string, number>;
    };
    urban: { flat: Record<string, number>; extrapolation?: string };
    furgone: { flat: Record<string, number> };
}

// ========================================
// CALCULATION FUNCTIONS
// ========================================

/** Pick the right Centralina Pro table for a vehicle type. */
function pickTable(
    vehicleType: string,
    dynamicRates?: DynamicRentalDayRates | null
): Record<string, number> | null {
    if (!dynamicRates) return null
    if (vehicleType === 'SUPERCAR') return dynamicRates.exotic?.resident ?? null
    if (vehicleType === 'UTILITARIA') return dynamicRates.urban?.flat ?? null
    if (vehicleType === 'FURGONE' || vehicleType === 'V_CLASS') return dynamicRates.furgone?.flat ?? null
    return null
}

/**
 * Look up total for `days` in a Centralina Pro table, extrapolating from
 * day-7 average if the exact day isn't stored. Returns null if nothing usable.
 */
function lookupTable(table: Record<string, number> | null, days: number): number | null {
    if (!table || Object.keys(table).length === 0) return null
    const exact = table[String(days)]
    if (typeof exact === 'number' && exact > 0) return exact

    const numericKeys = Object.keys(table)
        .map(Number)
        .filter((n) => !isNaN(n) && typeof table[String(n)] === 'number' && table[String(n)] > 0)
        .sort((a, b) => a - b)
    if (numericKeys.length === 0) return null

    const maxKey = numericKeys[numericKeys.length - 1]
    const maxVal = table[String(maxKey)]
    if (days > maxKey) {
        const avg = maxVal / maxKey
        return Math.round(maxVal + (days - maxKey) * avg)
    }
    // days < maxKey but not in table: linear interpolation between nearest bookends
    const lower = numericKeys.filter((k) => k < days).pop()
    const upper = numericKeys.find((k) => k > days)
    if (lower !== undefined && upper !== undefined) {
        const vLower = table[String(lower)]
        const vUpper = table[String(upper)]
        return Math.round(vLower + ((days - lower) / (upper - lower)) * (vUpper - vLower))
    }
    return null
}

/**
 * Main multi-day total.
 * Priority: Centralina Pro category table → per-vehicle baseDailyRate × days.
 */
export function calculateMultiDayPrice(
    vehicleType: string,
    days: number,
    baseDailyRate: number,
    _isResident?: boolean,
    dynamicRates?: DynamicRentalDayRates | null
): number {
    if (days <= 0) return 0
    const tableTotal = lookupTable(pickTable(vehicleType, dynamicRates), days)
    if (tableTotal !== null) return tableTotal
    return days * (baseDailyRate || 0)
}

/** Effective daily rate = total / days. */
export function getEffectiveDailyRate(
    vehicleType: string,
    days: number,
    baseDailyRate: number,
    _isResident?: boolean,
    dynamicRates?: DynamicRentalDayRates | null
): number {
    if (days <= 0) return 0
    const totalCost = calculateMultiDayPrice(vehicleType, days, baseDailyRate, undefined, dynamicRates)
    return totalCost / days
}

/**
 * Included km from Centralina Pro km config.
 * Returns 0 if config empty — no hardcoded fallback.
 */
export function calculateIncludedKmFromConfig(
    days: number,
    kmConfig?: { table: Record<string, number>; extra_per_day: number } | null
): number {
    if (days <= 0) return 0
    if (!kmConfig?.table || Object.keys(kmConfig.table).length === 0) return 0

    const table = kmConfig.table
    if (table[String(days)] !== undefined) return table[String(days)]

    const keys = Object.keys(table).map(Number).sort((a, b) => a - b)
    const maxKey = keys[keys.length - 1]
    if (days > maxKey) {
        const maxKm = table[String(maxKey)]
        return maxKm + (days - maxKey) * (kmConfig.extra_per_day ?? 0)
    }
    const lower = keys.filter((k) => k <= days).pop()
    const upper = keys.find((k) => k > days)
    if (lower !== undefined && upper !== undefined) {
        const kmLower = table[String(lower)]
        const kmUpper = table[String(upper)]
        return Math.round(kmLower + ((days - lower) / (upper - lower)) * (kmUpper - kmLower))
    }
    return 0
}
