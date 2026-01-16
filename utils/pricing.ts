/**
 * Precision-safe monetary calculation utilities
 * Prevents floating-point precision errors in currency calculations
 */

/**
 * Round a number to exactly 2 decimal places (for currency)
 * Prevents floating-point precision errors like 305.09999... becoming 305.10
 * 
 * @param value - The number to round
 * @returns Number rounded to 2 decimal places
 * 
 * @example
 * roundToTwoDecimals(305.09999) // Returns 305.10
 * roundToTwoDecimals(339 * 0.9) // Returns 305.10 (exact)
 */
export const roundToTwoDecimals = (value: number): number => {
    return Math.round(value * 100) / 100;
};

/**
 * Round to whole euros (no cents)
 * Used for special client pricing where cents are not allowed
 * 
 * @param value - The number to round
 * @returns Number rounded to nearest whole euro
 * 
 * @example
 * roundToWholeEuros(305.49) // Returns 305
 * roundToWholeEuros(305.50) // Returns 306
 */
export const roundToWholeEuros = (value: number): number => {
    return Math.round(value);
};

/**
 * Convert euros to cents with exact precision
 * Always returns an integer representing cents
 * 
 * @param euros - Amount in euros (can have floating-point errors)
 * @returns Exact amount in cents (integer)
 * 
 * @example
 * eurosToCents(305.00) // Returns 30500
 * eurosToCents(305.09999) // Returns 30510
 * eurosToCents(roundToTwoDecimals(339 * 0.9)) // Returns 30500 (exact)
 */
export const eurosToCents = (euros: number): number => {
    return Math.round(roundToTwoDecimals(euros) * 100);
};

/**
 * Calculate percentage discount with exact precision
 * 
 * @param amount - Base amount
 * @param discountPercent - Discount percentage (0.10 for 10%)
 * @returns Exact discount amount rounded to 2 decimals
 * 
 * @example
 * calculateDiscount(339, 0.10) // Returns 33.90 (exact)
 */
export const calculateDiscount = (amount: number, discountPercent: number): number => {
    return roundToTwoDecimals(amount * discountPercent);
};

/**
 * Apply discount to an amount with exact precision
 * 
 * @param amount - Base amount
 * @param discountPercent - Discount percentage (0.10 for 10%)
 * @returns Amount after discount, rounded to 2 decimals
 * 
 * @example
 * applyDiscount(339, 0.10) // Returns 305.10 (exact)
 */
export const applyDiscount = (amount: number, discountPercent: number): number => {
    const discount = calculateDiscount(amount, discountPercent);
    return roundToTwoDecimals(amount - discount);
};
