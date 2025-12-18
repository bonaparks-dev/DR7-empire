/**
 * Client-Specific Pricing Rules
 * Handles special pricing logic for VIP clients
 */

export const SPECIAL_CLIENTS = {
    MASSIMO_RUNCHINA: {
        email: 'massimorunchina69@gmail.com',
        config: {
            baseRate: 339,              // Base rate before any discounts
            baseDiscount: 0.10,         // Always applied: €339 - 10% = €305/day
            discountThresholdDays: 3,   // Additional discount for 3+ days
            additionalDiscount: 0.10,   // Additional 10% off total for 3+ days
            includeUnlimitedKm: true,
            includeKaskoBase: true,
            excludeCarWash: true,
            useCalendarDays: true
        }
    }
};

/**
 * Check if the current user/form data corresponds to Massimo Runchina
 */
export const isMassimoRunchina = (email?: string): boolean => {
    if (!email) return false;
    return email.toLowerCase().trim() === SPECIAL_CLIENTS.MASSIMO_RUNCHINA.email;
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

    const { baseRate, baseDiscount, discountThresholdDays, additionalDiscount } = SPECIAL_CLIENTS.MASSIMO_RUNCHINA.config;

    // Step 1: Calculate base rental cost (€339 × days)
    const baseRentalCost = baseRate * days;

    // Step 2: Apply first discount (always applied): -10% on rental
    const firstDiscount = baseRentalCost * baseDiscount;
    const rentalAfterFirstDiscount = baseRentalCost - firstDiscount;

    // Step 3: Add other fees to get subtotal
    let newSubtotal = rentalAfterFirstDiscount + otherFees;
    let totalDiscount = firstDiscount;

    // Step 4: Apply additional discount for 3+ days (10% off entire subtotal)
    if (days >= discountThresholdDays) {
        const secondDiscount = newSubtotal * additionalDiscount;
        newSubtotal -= secondDiscount;
        totalDiscount += secondDiscount;
    }

    // Calculate effective daily rate after first discount
    const effectiveDailyRate = rentalAfterFirstDiscount / days;

    return {
        isSpecialClient: true,
        dailyRate: effectiveDailyRate, // €305/day (after first discount)
        discountAmount: totalDiscount,
        subtotal: newSubtotal,
        message: days >= discountThresholdDays ? 'Sconto cliente speciale 20% applicato (10% + 10%)' : 'Sconto cliente speciale 10% applicato'
    };
};
