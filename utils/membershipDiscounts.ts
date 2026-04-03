import { User } from '../types';

// DR7 Club — single tier, reward-based (not discount-based)
// Legacy tier IDs kept for backwards compatibility with existing members
// DR7 Club: NO price discount — members get 3% cashback as wallet credit instead
// Cashback is granted on payment confirmation (nexi-callback + wallet path)
export const MEMBERSHIP_DISCOUNTS = {
    dr7club: 0,     // DR7 Club uses wallet reward, not direct discounts
    argento: 0,  // 0% discount — 3% cashback only
    oro: 0,      // 0% discount — 3% cashback only
    platino: 0   // 0% discount — 3% cashback only
} as const;

// All services eligible for DR7 Club members
export const SERVICE_ELIGIBILITY = {
    dr7club: ['car_rental', 'car_wash', 'car_wash_premium', 'mechanical', 'luxury_wash', 'yacht', 'villa', 'helicopter'],
    argento: ['car_rental', 'car_wash_premium'],
    oro: ['car_rental', 'yacht', 'villa', 'helicopter', 'car_wash', 'mechanical'],
    platino: ['car_rental', 'yacht', 'villa', 'helicopter', 'car_wash', 'mechanical', 'luxury_wash']
} as const;

/**
 * Check if a user's membership is currently active (paid + not expired)
 */
function isMembershipActive(user: User | null): boolean {
    if (!user?.membership?.tierId) return false;
    if (user.membership.subscriptionStatus !== 'active') return false;

    // Check renewal date hasn't passed
    if (user.membership.renewalDate) {
        const renewalDate = new Date(user.membership.renewalDate);
        if (renewalDate < new Date()) return false;
    }

    return true;
}

/**
 * Get the discount percentage for a user's membership tier
 */
export function getMembershipDiscount(user: User | null): number {
    if (!isMembershipActive(user)) return 0;

    const tierId = user!.membership!.tierId.toLowerCase();
    return MEMBERSHIP_DISCOUNTS[tierId as keyof typeof MEMBERSHIP_DISCOUNTS] || 0;
}

/**
 * Check if a service is eligible for discount based on membership tier
 */
export function isServiceEligible(user: User | null, serviceType: string): boolean {
    if (!isMembershipActive(user)) return false;

    const tierId = user!.membership!.tierId.toLowerCase();
    const eligibleServices = SERVICE_ELIGIBILITY[tierId as keyof typeof SERVICE_ELIGIBILITY];

    return eligibleServices?.includes(serviceType) || false;
}

/**
 * Calculate discounted price
 */
export function calculateDiscountedPrice(
    originalPrice: number,
    user: User | null,
    serviceType: string
): {
    originalPrice: number;
    discountPercentage: number;
    discountAmount: number;
    finalPrice: number;
    hasDiscount: boolean;
} {
    const hasDiscount = isServiceEligible(user, serviceType);
    const discountPercentage = hasDiscount ? getMembershipDiscount(user) : 0;
    const discountAmount = originalPrice * discountPercentage;
    const finalPrice = originalPrice - discountAmount;

    return {
        originalPrice,
        discountPercentage,
        discountAmount,
        finalPrice,
        hasDiscount
    };
}

/**
 * Get membership tier display name
 */
export function getMembershipTierName(user: User | null): string | null {
    if (!user?.membership?.tierId) return null;

    const tierId = user.membership.tierId.toLowerCase();
    const tierNames: Record<string, string> = {
        dr7club: 'DR7 Club',
        argento: 'Argento',
        oro: 'Oro',
        platino: 'Platino'
    };

    return tierNames[tierId] || null;
}
