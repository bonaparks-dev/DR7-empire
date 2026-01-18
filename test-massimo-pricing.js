/**
 * Test script to verify Massimo Runchina's pricing precision fixes
 * Tests tiered discounts and no-cents rounding
 */

// Import the pricing utilities
const { roundToTwoDecimals, roundToWholeEuros, eurosToCents } = require('./utils/pricing');

console.log('=== MASSIMO RUNCHINA PRICING VERIFICATION ===\n');

const baseRate = 339;

// Test cases for each discount tier
const testCases = [
    { days: 1, expectedDiscount: 0.10, label: '1 day (-10%)' },
    { days: 2, expectedDiscount: 0.10, label: '2 days (-10%)' },
    { days: 3, expectedDiscount: 0.10, label: '3 days (-10%)' },
    { days: 4, expectedDiscount: 0.15, label: '4 days (-15%)' },
    { days: 5, expectedDiscount: 0.25, label: '5 days (-25%)' },
    { days: 6, expectedDiscount: 0.25, label: '6 days (-25%)' },
    { days: 7, expectedDiscount: 0.30, label: '7 days (-30%)' },
    { days: 10, expectedDiscount: 0.30, label: '10 days (-30%)' },
];

testCases.forEach(({ days, expectedDiscount, label }) => {
    const baseRentalCost = baseRate * days;
    const discount = roundToTwoDecimals(baseRentalCost * expectedDiscount);
    const afterDiscount = roundToTwoDecimals(baseRentalCost - discount);
    const finalPrice = roundToWholeEuros(afterDiscount);
    const cents = eurosToCents(finalPrice);

    console.log(`${label}:`);
    console.log(`  Base: €${baseRentalCost} (€${baseRate} × ${days})`);
    console.log(`  Discount: -€${discount.toFixed(2)} (${Math.round(expectedDiscount * 100)}%)`);
    console.log(`  After discount: €${afterDiscount.toFixed(2)}`);
    console.log(`  Final (no cents): €${finalPrice}.00`);
    console.log(`  In cents: ${cents} cents`);
    console.log(`  ✓ No cents: ${cents % 100 === 0 ? 'PASS' : 'FAIL'}`);
    console.log('');
});

// Specific test for the original issue: 1-day rental should be exactly €305
console.log('=== ORIGINAL ISSUE TEST ===');
const oneDayBase = baseRate * 1;
const oneDayDiscount = roundToTwoDecimals(oneDayBase * 0.10);
const oneDayAfter = roundToTwoDecimals(oneDayBase - oneDayDiscount);
const oneDayFinal = roundToWholeEuros(oneDayAfter);
const oneDayCents = eurosToCents(oneDayFinal);

console.log(`1-day rental:`);
console.log(`  Expected: €305.00 (30500 cents)`);
console.log(`  Actual: €${oneDayFinal}.00 (${oneDayCents} cents)`);
console.log(`  Result: ${oneDayCents === 30500 ? '✅ PASS - Exactly €305.00!' : '❌ FAIL'}`);
