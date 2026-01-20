/**
 * Client-Specific Pricing Rules
 * Handles special pricing logic for VIP clients
 */

import { roundToTwoDecimals, roundToWholeEuros } from './pricing';

export const SPECIAL_CLIENTS = {
    MASSIMO_RUNCHINA: {
        email: 'massimorunchina69@gmail.com',
        config: {
            baseRate: 305,              // Fixed rate: €305 per day for any supercar
            // Simple discount: 10% off starting from day 3 onwards
            discountTiers: [
                { minDays: 3, discount: 0.10 }   // 3+ days: -10%
            ],
            includeUnlimitedKm: true,
            includeKaskoBase: true,
            excludeCarWash: true,
            useCalendarDays: true,
            noCents: true  // Round to whole euros (no cents)
        }
    }
};

/**
 * Check if the current user/form data corresponds to Massimo Runchina
 * Checks by Email OR by Name+Surname
 */
import type { User } from '../types';

/**
 * Check if the current user/form data corresponds to Massimo Runchina
 * Checks by Email OR by Name+Surname (from User object or form data)
 */
export const isMassimoRunchina = (
    data: { email?: string, firstName?: string, lastName?: string } | string | User | null
): boolean => {
    if (!data) return false;

    // Handle legacy string call (just email)
    if (typeof data === 'string') {
        return data.toLowerCase().trim() === SPECIAL_CLIENTS.MASSIMO_RUNCHINA.email;
    }

    // Handle User object
    if ('fullName' in data && 'email' in data) {
        // Check User Email
        if (data.email?.toLowerCase().trim() === SPECIAL_CLIENTS.MASSIMO_RUNCHINA.email) {
            return true;
        }
        // Check User Name
        if (data.fullName) {
            const nameParts = data.fullName.toLowerCase().split(' ');
            // Simple check if it contains both "massimo" and "runchina"
            if (data.fullName.toLowerCase().includes('massimo') && data.fullName.toLowerCase().includes('runchina')) {
                return true;
            }
        }
        // Fallback: check if metadata (if available on User type extensions elsewhere) matches... 
        // But types.ts User doesn't have metadata explicitly typed other than fields.
        return false;
    }

    // Handle Form Data object
    const { email, firstName, lastName } = data as { email?: string, firstName?: string, lastName?: string };

    // Check email
    if (email && email.toLowerCase().trim() === SPECIAL_CLIENTS.MASSIMO_RUNCHINA.email) {
        return true;
    }

    // Check Name + Surname
    if (firstName && lastName) {
        const f = firstName.toLowerCase().trim();
        const l = lastName.toLowerCase().trim();
        if (f === 'massimo' && l === 'runchina') {
            return true;
        }
    }

    return false;
};

/**
 * Calculate special pricing for Massimo Runchina
 */
export interface ClientPricingResult {
    isSpecialClient: boolean;
    dailyRate: number;
    discountAmount: number;
    subtotal: number;
    message?: string;
}

/**
 * Get the appropriate discount percentage for Massimo based on rental duration
 */
const getMassimoDiscount = (days: number): number => {
    const tiers = SPECIAL_CLIENTS.MASSIMO_RUNCHINA.config.discountTiers;
    // Find the first tier where days >= minDays
    const tier = tiers.find(t => days >= t.minDays);
    return tier ? tier.discount : 0; // No discount for 1-2 days, 10% for 3+ days
};

export const calculateClientPricing = (
    email: string | undefined,
    days: number,
    currentSubtotal: number, // Subtotal BEFORE special client logic (but includes extras if we want to discount them, or we can recalculate)
    otherFees: number // Fees that might not be discounted or need to be added back
): ClientPricingResult => {

    if (!isMassimoRunchina(email)) {
        return {
            isSpecialClient: false,
            dailyRate: 0,
            discountAmount: 0,
            subtotal: currentSubtotal
        };
    }

    const { baseRate, noCents } = SPECIAL_CLIENTS.MASSIMO_RUNCHINA.config;
    const discountPercent = getMassimoDiscount(days);

    // Step 1: Calculate base rental cost (€339 × days)
    const baseRentalCost = baseRate * days;

    // Step 2: Apply tiered discount
    const totalDiscount = roundToTwoDecimals(baseRentalCost * discountPercent);
    const rentalAfterDiscount = roundToTwoDecimals(baseRentalCost - totalDiscount);

    // Step 3: Add other fees to get subtotal
    let newSubtotal = roundToTwoDecimals(rentalAfterDiscount + otherFees);

    // Step 4: Round to whole euros if noCents is enabled
    if (noCents) {
        newSubtotal = roundToWholeEuros(newSubtotal);
    }

    // Calculate effective daily rate after discount
    const effectiveDailyRate = roundToTwoDecimals(rentalAfterDiscount / days);

    const discountLabel = Math.round(discountPercent * 100);

    return {
        isSpecialClient: true,
        dailyRate: effectiveDailyRate,
        discountAmount: totalDiscount,
        subtotal: newSubtotal,
        message: `Sconto cliente speciale ${discountLabel}% applicato`
    };
};
