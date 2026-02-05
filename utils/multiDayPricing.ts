/**
 * Multi-Day Pricing System
 * 
 * Implements progressive discounts for longer rental periods.
 * Longer rentals = better value per day.
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
// SUPERCAR PRICING TABLES
// ========================================
// All Supercars use the same pricing structure:
// - Porsche Cayenne Coupé S 2025
// - Mercedes C63 SE Performance 2024
// - Audi RS3 New Model 2025
// - BMW M4 Competition 2024

export const SUPERCAR_PRICES: MultiDayPriceTable = {
    1: { resident: 349, nonResident: 449 },
    2: { resident: 698, nonResident: 898 }, // 2x daily rate (no discount for 2 days)
    3: { resident: 980, nonResident: 1289 },
    4: { resident: 1290, nonResident: 1690 },
    5: { resident: 1590, nonResident: 2190 },
    6: { resident: 1990, nonResident: 2590 },
    7: { resident: 2290, nonResident: 2890 },
};

// ========================================
// UTILITARIA PRICING TABLE
// ========================================
// Fixed pricing (same for residents and non-residents)

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

// ========================================
// V_CLASS (MERCEDES VITO) PRICING TABLE
// ========================================

export const V_CLASS_PRICES: { [days: number]: number } = {
    1: 239,
    2: 469,
    3: 689,
    4: 889,
    5: 1090,
    6: 1249,
    7: 1390,
};

// ========================================
// FURGONE (FIAT DUCATO) PRICING TABLE
// ========================================

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
// CALCULATION FUNCTIONS
// ========================================

/**
 * Calculate multi-day price for Supercar vehicles
 * @param days - Number of rental days
 * @param isResident - Whether user is a Cagliari/Sud Sardegna resident
 * @returns Total rental cost with multi-day pricing applied
 */
export function calculateSupercarMultiDayPrice(days: number, isResident: boolean): number {
    // For 1-7 days, use the exact price table
    if (days >= 1 && days <= 7 && SUPERCAR_PRICES[days]) {
        return isResident ? SUPERCAR_PRICES[days].resident : SUPERCAR_PRICES[days].nonResident;
    }

    // For 8+ days, calculate based on day 7 average rate
    if (days > 7) {
        const day7Price = isResident ? SUPERCAR_PRICES[7].resident : SUPERCAR_PRICES[7].nonResident;
        const day7AvgRate = day7Price / 7;
        return day7Price + (days - 7) * day7AvgRate;
    }

    // Fallback: use 1-day rate
    const oneDayRate = isResident ? SUPERCAR_PRICES[1].resident : SUPERCAR_PRICES[1].nonResident;
    return days * oneDayRate;
}

/**
 * Calculate multi-day price for Utilitaria vehicles
 * @param days - Number of rental days
 * @returns Total rental cost with multi-day pricing applied
 */
export function calculateUtilitariaMultiDayPrice(days: number): number {
    // For 1-7 days, use the exact price table
    if (days >= 1 && days <= 7 && UTILITARIA_PRICES[days]) {
        return UTILITARIA_PRICES[days];
    }

    // For 8-30 days, interpolate between 7-day and 30-day prices
    if (days > 7 && days <= 30) {
        const day7Price = UTILITARIA_PRICES[7];
        const day30Price = UTILITARIA_PRICES[30];
        const dailyRate = (day30Price - day7Price) / (30 - 7);
        return Math.round(day7Price + (days - 7) * dailyRate);
    }

    // For 31+ days, use 30-day price + daily rate for extra days
    if (days > 30) {
        const day30Price = UTILITARIA_PRICES[30];
        const dailyRate = day30Price / 30;
        return Math.round(day30Price + (days - 30) * dailyRate);
    }

    // Fallback: use 1-day rate
    return days * UTILITARIA_PRICES[1];
}

/**
 * Calculate multi-day price for V_CLASS (Mercedes Vito) vehicles
 * @param days - Number of rental days
 * @returns Total rental cost with multi-day pricing applied
 */
export function calculateVClassMultiDayPrice(days: number): number {
    if (days >= 1 && days <= 7 && V_CLASS_PRICES[days]) {
        return V_CLASS_PRICES[days];
    }

    // For 8+ days, use day 7 average rate for extra days
    if (days > 7) {
        const day7Price = V_CLASS_PRICES[7];
        const day7AvgRate = day7Price / 7;
        return Math.round(day7Price + (days - 7) * day7AvgRate);
    }

    return days * V_CLASS_PRICES[1];
}

/**
 * Calculate multi-day price for FURGONE (Fiat Ducato) vehicles
 * @param days - Number of rental days
 * @returns Total rental cost with multi-day pricing applied
 */
export function calculateFurgoneMultiDayPrice(days: number): number {
    if (days >= 1 && days <= 7 && FURGONE_PRICES[days]) {
        return FURGONE_PRICES[days];
    }

    // For 8+ days, use day 7 average rate for extra days
    if (days > 7) {
        const day7Price = FURGONE_PRICES[7];
        const day7AvgRate = day7Price / 7;
        return Math.round(day7Price + (days - 7) * day7AvgRate);
    }

    return days * FURGONE_PRICES[1];
}

/**
 * Main function to calculate multi-day rental cost
 * @param vehicleType - Vehicle type (SUPERCAR, UTILITARIA, etc.)
 * @param days - Number of rental days
 * @param baseDailyRate - Base daily rate (for vehicles without multi-day pricing)
 * @param isResident - Whether user is a resident (for dual pricing)
 * @returns Total rental cost with multi-day pricing applied
 */
export function calculateMultiDayPrice(
    vehicleType: string,
    days: number,
    baseDailyRate: number,
    isResident: boolean = false
): number {
    switch (vehicleType) {
        case 'SUPERCAR':
            return calculateSupercarMultiDayPrice(days, isResident);

        case 'UTILITARIA':
            return calculateUtilitariaMultiDayPrice(days);

        case 'V_CLASS':
            return calculateVClassMultiDayPrice(days);

        case 'FURGONE':
            return calculateFurgoneMultiDayPrice(days);

        default:
            return days * baseDailyRate;
    }
}

/**
 * Get the effective daily rate for display purposes
 * @param vehicleType - Vehicle type
 * @param days - Number of rental days
 * @param baseDailyRate - Base daily rate
 * @param isResident - Whether user is a resident
 * @returns Average daily rate
 */
export function getEffectiveDailyRate(
    vehicleType: string,
    days: number,
    baseDailyRate: number,
    isResident: boolean = false
): number {
    const totalCost = calculateMultiDayPrice(vehicleType, days, baseDailyRate, isResident);
    return totalCost / days;
}
