/**
 * Client-Specific Pricing Rules
 * Handles special pricing logic for VIP clients
 */

export const SPECIAL_CLIENTS = {
    MASSIMO_RUNCHINA: {
        email: 'massimorunchina69@gmail.com',
        config: {
            dailyRate: 305,
            discountThresholdDays: 2,
            discountPercentage: 0.10,
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

    const { dailyRate, discountThresholdDays, discountPercentage } = SPECIAL_CLIENTS.MASSIMO_RUNCHINA.config;

    // Calculate new base rental cost
    const specialRentalCost = dailyRate * days;

    // Recalculate subtotal using special rate + other fees (like car wash, pickup fees, etc.)
    // Note: We need to know what "currentSubtotal" includes. 
    // Usually: Rental + Insurance + Extras + Fees.
    // For Massimo: Rental is fixed, Insurance (Kasko Base) is 0, Unlimited Km is 0.
    // So we really just need to know the 'other fees' (extras + pickup/dropoff + young driver + car wash)

    let newSubtotal = specialRentalCost + otherFees;
    let discount = 0;

    if (days >= discountThresholdDays) {
        discount = newSubtotal * discountPercentage;
        newSubtotal -= discount;
    }

    return {
        isSpecialClient: true,
        dailyRate: dailyRate,
        discountAmount: discount,
        subtotal: newSubtotal,
        message: days >= discountThresholdDays ? 'Sconto cliente speciale 10% applicato' : 'Tariffa fissa cliente speciale'
    };
};
