/**
 * Test Multi-Day Pricing System
 * Run with: node test-multiday-pricing.js
 */

import { calculateMultiDayPrice, SUPERCAR_PRICES, UTILITARIA_PRICES } from './utils/multiDayPricing.js';

console.log('🧪 Testing Multi-Day Pricing System\n');

// Test 1: Supercar Resident Pricing
console.log('=== SUPERCAR (Resident) ===');
console.log('1 day: €' + calculateMultiDayPrice('SUPERCAR', 1, 349, true) + ' (expected: €349)');
console.log('3 days: €' + calculateMultiDayPrice('SUPERCAR', 3, 349, true) + ' (expected: €980)');
console.log('4 days: €' + calculateMultiDayPrice('SUPERCAR', 4, 349, true) + ' (expected: €1,290)');
console.log('5 days: €' + calculateMultiDayPrice('SUPERCAR', 5, 349, true) + ' (expected: €1,590)');
console.log('6 days: €' + calculateMultiDayPrice('SUPERCAR', 6, 349, true) + ' (expected: €1,990)');
console.log('7 days: €' + calculateMultiDayPrice('SUPERCAR', 7, 349, true) + ' (expected: €2,290)');

// Test 2: Supercar Non-Resident Pricing
console.log('\n=== SUPERCAR (Non-Resident) ===');
console.log('1 day: €' + calculateMultiDayPrice('SUPERCAR', 1, 449, false) + ' (expected: €449)');
console.log('3 days: €' + calculateMultiDayPrice('SUPERCAR', 3, 449, false) + ' (expected: €1,289)');
console.log('4 days: €' + calculateMultiDayPrice('SUPERCAR', 4, 449, false) + ' (expected: €1,690)');
console.log('5 days: €' + calculateMultiDayPrice('SUPERCAR', 5, 449, false) + ' (expected: €2,190)');
console.log('6 days: €' + calculateMultiDayPrice('SUPERCAR', 6, 449, false) + ' (expected: €2,590)');
console.log('7 days: €' + calculateMultiDayPrice('SUPERCAR', 7, 449, false) + ' (expected: €2,890)');

// Test 3: Utilitaria Pricing (same for all)
console.log('\n=== UTILITARIA ===');
console.log('1 day: €' + calculateMultiDayPrice('UTILITARIA', 1, 39, false) + ' (expected: €39)');
console.log('2 days: €' + calculateMultiDayPrice('UTILITARIA', 2, 39, false) + ' (expected: €78)');
console.log('3 days: €' + calculateMultiDayPrice('UTILITARIA', 3, 39, false) + ' (expected: €109)');
console.log('4 days: €' + calculateMultiDayPrice('UTILITARIA', 4, 39, false) + ' (expected: €129)');
console.log('5 days: €' + calculateMultiDayPrice('UTILITARIA', 5, 39, false) + ' (expected: €149)');
console.log('6 days: €' + calculateMultiDayPrice('UTILITARIA', 6, 39, false) + ' (expected: €179)');
console.log('7 days: €' + calculateMultiDayPrice('UTILITARIA', 7, 39, false) + ' (expected: €189)');

// Test 4: Verify savings
console.log('\n=== SAVINGS VERIFICATION ===');
const supercar7DaysResident = calculateMultiDayPrice('SUPERCAR', 7, 349, true);
const supercar7DaysSimple = 7 * 349;
const savingsResident = supercar7DaysSimple - supercar7DaysResident;
console.log(`Supercar 7 days (Resident): €${supercar7DaysResident} vs €${supercar7DaysSimple} (simple) = €${savingsResident} saved`);

const utilitaria7Days = calculateMultiDayPrice('UTILITARIA', 7, 39, false);
const utilitaria7DaysSimple = 7 * 39;
const savingsUtilitaria = utilitaria7DaysSimple - utilitaria7Days;
console.log(`Utilitaria 7 days: €${utilitaria7Days} vs €${utilitaria7DaysSimple} (simple) = €${savingsUtilitaria} saved`);

console.log('\n✅ All tests complete!');
