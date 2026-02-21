/**
 * Client-Specific Pricing Rules
 * Handles special pricing logic for VIP clients
 */

import { roundToTwoDecimals, roundToWholeEuros } from './pricing';

export const SPECIAL_CLIENTS = {
    MASSIMO_RUNCHINA: {
        email: 'massimorunchina69@gmail.com',
        config: {
            baseRate: 339,              // Fixed rate: €339 per day for any supercar
            // Tiered discounts based on rental duration (ONLY with active membership)
            discountTiers: [
                { minDays: 7, discount: 0.20 },  // 7+ days: -20%
                { minDays: 4, discount: 0.15 },  // 4-6 days: -15%
                { minDays: 3, discount: 0.10 }   // 3 days: -10%
            ],
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
            baseRate: 305,              // Fixed rate: €305 per day for any supercar
            // Tiered discounts based on rental duration (ONLY with active membership)
            discountTiers: [
                { minDays: 7, discount: 0.20 },  // 7+ days: -20%
                { minDays: 4, discount: 0.15 },  // 4-6 days: -15%
                { minDays: 3, discount: 0.10 }   // 3 days: -10%
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
 * Check if the current user/form data corresponds to any special VIP client
 * Checks by Email OR by Name+Surname (from User object or form data)
 */
export const isSpecialClient = (
    data: { email?: string, firstName?: string, lastName?: string } | string | User | null
): boolean => {
    if (!data) return false;

    // Handle legacy string call (just email)
    if (typeof data === 'string') {
        const emailLower = data.toLowerCase().trim();
        return emailLower === SPECIAL_CLIENTS.MASSIMO_RUNCHINA.email ||
            emailLower === SPECIAL_CLIENTS.JEANNE_GIRAUD.email;
    }

    // Handle User object
    if ('fullName' in data && 'email' in data) {
        // Check User Email against all VIP clients
        const emailLower = data.email?.toLowerCase().trim();
        if (emailLower === SPECIAL_CLIENTS.MASSIMO_RUNCHINA.email ||
            emailLower === SPECIAL_CLIENTS.JEANNE_GIRAUD.email) {
            return true;
        }
        // Check User Name for Massimo
        if (data.fullName) {
            if (data.fullName.toLowerCase().includes('massimo') && data.fullName.toLowerCase().includes('runchina')) {
                return true;
            }
            // Check User Name for Jeanne
            if (data.fullName.toLowerCase().includes('jeanne') && data.fullName.toLowerCase().includes('giraud')) {
                return true;
            }
        }
        return false;
    }

    // Handle Form Data object
    const { email, firstName, lastName } = data as { email?: string, firstName?: string, lastName?: string };

    // Check email against all VIP clients
    if (email) {
        const emailLower = email.toLowerCase().trim();
        if (emailLower === SPECIAL_CLIENTS.MASSIMO_RUNCHINA.email ||
            emailLower === SPECIAL_CLIENTS.JEANNE_GIRAUD.email) {
            return true;
        }
    }

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
 * Check if a user has an active, paid membership (not expired)
 */
const hasActiveMembership = (user: User | null): boolean => {
    if (!user?.membership?.tierId) return false;
    if (user.membership.subscriptionStatus !== 'active') return false;
    if (user.membership.renewalDate) {
        const renewalDate = new Date(user.membership.renewalDate);
        if (renewalDate < new Date()) return false;
    }
    return true;
};

/**
 * Get the appropriate discount percentage for a special client based on rental duration.
 * Discount tiers ONLY apply if the client has an active membership.
 */
const getClientDiscount = (days: number, clientConfig: typeof SPECIAL_CLIENTS.MASSIMO_RUNCHINA.config, user: User | null): number => {
    if (!hasActiveMembership(user)) return 0; // No discount without active membership
    const tier = clientConfig.discountTiers.find(t => days >= t.minDays);
    return tier ? tier.discount : 0;
};

export const calculateClientPricing = (
    email: string | undefined,
    days: number,
    currentSubtotal: number,
    otherFees: number,
    user?: User | null // Pass user to check membership status for discount eligibility
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
    const discountPercent = getClientDiscount(days, SPECIAL_CLIENTS.MASSIMO_RUNCHINA.config, user ?? null);

    // Step 1: Calculate base rental cost (€339 × days)
    const baseRentalCost = baseRate * days;

    // Step 2: Apply tiered discount (only if membership active)
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
        message: discountPercent > 0
            ? `Sconto cliente speciale ${discountLabel}% applicato`
            : undefined
    };
};
