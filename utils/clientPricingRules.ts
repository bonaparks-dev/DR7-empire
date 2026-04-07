/**
 * Client-Specific Pricing Rules
 * Handles special pricing logic for VIP clients
 */

/**
 * Per-vehicle fixed pricing for Massimo Runchina
 * Keys match vehicle names (lowercase substring match)
 * Each entry: { 1: price, 2: price, 3: price, perDay: price for 4+ days }
 */
export const RUNCHINA_VEHICLE_PRICES: Record<string, { 1: number; 2: number; 3: number; perDay: number }> = {
    // RS3
    rs3:       { 1: 319, 2: 629, 3: 899, perDay: 289 },
    // M3, M4, Macan, C63
    m3:        { 1: 339, 2: 649, 3: 929, perDay: 299 },
    m4:        { 1: 339, 2: 649, 3: 929, perDay: 299 },
    macan:     { 1: 339, 2: 649, 3: 929, perDay: 299 },
    c63:       { 1: 339, 2: 649, 3: 929, perDay: 299 },
    // Porsche Turbo S
    'turbo s':  { 1: 649, 2: 1249, 3: 1799, perDay: 589 },
};

/** Look up Runchina fixed price for a vehicle by name */
export function getRunchinaPrice(vehicleName: string, days: number): number {
    const safeDays = Math.max(1, days || 1);
    const name = vehicleName.toLowerCase();
    const sortedKeys = Object.keys(RUNCHINA_VEHICLE_PRICES).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        if (name.includes(key)) {
            const prices = RUNCHINA_VEHICLE_PRICES[key];
            if (safeDays <= 3) return prices[safeDays as 1 | 2 | 3];
            return prices[3] + prices.perDay * (safeDays - 3);
        }
    }
    const fallback = RUNCHINA_VEHICLE_PRICES.m3;
    if (safeDays <= 3) return fallback[safeDays as 1 | 2 | 3];
    return fallback[3] + fallback.perDay * (safeDays - 3);
}

export const SPECIAL_CLIENTS = {
    MASSIMO_RUNCHINA: {
        email: 'massimorunchina69@gmail.com',
        config: {
            includeUnlimitedKm: true,
            includeKaskoBase: true,
            excludeCarWash: true,
            useCalendarDays: true,
            noCents: true,  // Round to whole euros (no cents)
            noDeposit: true  // No caution/deposit required
        }
    },
    JEANNE_GIRAUD: {
        email: 'jeannegiraud92@gmail.com',
        config: {
            includeUnlimitedKm: true,
            includeKaskoBase: true,
            excludeCarWash: true,
            useCalendarDays: true,
            noCents: true
        }
    },
    OPHE_DR7: {
        email: 'ophe@dr7.app',
        config: {
            includeUnlimitedKm: true,
            includeKaskoBase: true,
            excludeCarWash: true,
            useCalendarDays: true,
            noCents: true,
            noDeposit: true
        }
    }
};

/**
 * Check if the current user/form data corresponds to Massimo Runchina
 * Checks by Email OR by Name+Surname
 */
import type { User } from '../types';

const VIP_EMAILS = Object.values(SPECIAL_CLIENTS).map(c => c.email);

/**
 * Check if the current user/form data corresponds to any special VIP client
 * Checks by Email OR by Name+Surname (from User object or form data)
 */
export const isSpecialClient = (
    data: { email?: string, firstName?: string, lastName?: string } | string | User | null
): boolean => {
    if (!data) return false;

    // Handle legacy string call (just email)
    if (typeof data === 'string') {
        return VIP_EMAILS.includes(data.toLowerCase().trim());
    }

    // Handle User object
    if ('fullName' in data && 'email' in data) {
        if (data.email && VIP_EMAILS.includes(data.email.toLowerCase().trim())) return true;
        if (data.fullName) {
            const fn = data.fullName.toLowerCase();
            if (fn.includes('massimo') && fn.includes('runchina')) return true;
            if (fn.includes('jeanne') && fn.includes('giraud')) return true;
        }
        return false;
    }

    // Handle Form Data object
    const { email, firstName, lastName } = data as { email?: string, firstName?: string, lastName?: string };

    if (email && VIP_EMAILS.includes(email.toLowerCase().trim())) return true;

    // Check Name + Surname
    if (firstName && lastName) {
        const f = firstName.toLowerCase().trim();
        const l = lastName.toLowerCase().trim();
        if ((f === 'massimo' && l === 'runchina') ||
            (f === 'jeanne' && l === 'giraud')) {
            return true;
        }
    }

    return false;
};

/**
 * Check if the current user/form data corresponds to Massimo Runchina or any VIP client
 * Checks by Email OR by Name+Surname (from User object or form data)
 * @deprecated Use isSpecialClient instead for checking VIP status
 */
export const isMassimoRunchina = (
    data: { email?: string, firstName?: string, lastName?: string } | string | User | null
): boolean => {
    // Now just delegates to the generic special client check
    return isSpecialClient(data);
};

/**
 * Calculate special pricing for Massimo Runchina using per-vehicle multi-day tables.
 */
export interface ClientPricingResult {
    isSpecialClient: boolean;
    totalRentalCost: number;
    message?: string;
}

export const calculateClientPricing = (
    email: string | undefined,
    days: number,
    vehicleName: string,
): ClientPricingResult => {
    if (!isMassimoRunchina(email)) {
        return { isSpecialClient: false, totalRentalCost: 0 };
    }

    const totalRentalCost = getRunchinaPrice(vehicleName, days);
    return {
        isSpecialClient: true,
        totalRentalCost,
        message: 'Tariffa fissa Runchina',
    };
};
