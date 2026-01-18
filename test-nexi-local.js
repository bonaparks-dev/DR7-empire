/**
 * Local Nexi Payment Test
 * Tests if the MAC Key and credentials work with the new merchant account
 */

import crypto from 'crypto';

// New production credentials
const nexiConfig = {
    apiKey: '9f46149d-a616-4cfa-b92a-4d3b85a4c2a7',
    macKey: 'O1c57OA4aH7o434dH79KCK7IFoh7g0KZ869K1OMt',
    merchantId: '025153685',
    terminalId: '75703919',
    accountId: '26569079',
    environment: 'production',
};

// Generate MAC signature
function generateMAC(params, macKey) {
    const sortedKeys = Object.keys(params).sort();
    let macString = '';

    for (const key of sortedKeys) {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            macString += `${key}=${params[key]}`;
        }
    }

    macString += macKey;
    return crypto.createHash('sha1').update(macString, 'utf8').digest('hex');
}

// Test payment parameters
const testAmount = 100; // €1.00 in cents
const orderId = `TEST-${Date.now()}`;

const params = {
    alias: `payment_${nexiConfig.merchantId}`,
    importo: testAmount.toString(),
    divisa: 'EUR',
    codTrans: orderId,
    descrizione: 'Test Payment - DR7 Empire',
    mail: 'test@dr7empire.com',
    languageId: 'ITA',
    urlpost: 'https://dr7empire.com/.netlify/functions/nexi-callback',
    url: 'https://dr7empire.com/payment-success',
    urlback: 'https://dr7empire.com/payment-cancel',
};

console.log('\n🧪 Testing Nexi Configuration\n');
console.log('='.repeat(70));

console.log('\n📋 Credentials:');
console.log(`   Merchant ID: ${nexiConfig.merchantId}`);
console.log(`   Terminal ID: ${nexiConfig.terminalId}`);
console.log(`   Account ID:  ${nexiConfig.accountId}`);
console.log(`   API Key:     ${nexiConfig.apiKey.substring(0, 20)}...`);
console.log(`   MAC Key:     ${nexiConfig.macKey.substring(0, 20)}...`);
console.log(`   Environment: ${nexiConfig.environment}`);

console.log('\n💳 Test Payment:');
console.log(`   Amount:      €${(testAmount / 100).toFixed(2)}`);
console.log(`   Order ID:    ${orderId}`);
console.log(`   Alias:       payment_${nexiConfig.merchantId}`);

console.log('\n🔐 Generating MAC Signature...');
const mac = generateMAC(params, nexiConfig.macKey);
params.mac = mac;

console.log(`   MAC:         ${mac}`);

const baseUrl = nexiConfig.environment === 'production'
    ? 'https://xpay.nexigroup.com'
    : 'https://xpaysandboxdb.nexigroup.com';

const queryString = new URLSearchParams(params).toString();
const paymentUrl = `${baseUrl}/ecomm/ecomm/DispatcherServlet?${queryString}`;

console.log('\n🌐 Payment URL Generated:');
console.log(`   ${paymentUrl.substring(0, 100)}...`);
console.log(`   (Full URL is ${paymentUrl.length} characters)`);

console.log('\n' + '='.repeat(70));
console.log('\n✅ Configuration Test Complete!\n');

console.log('📝 Next Steps:\n');
console.log('1. Copy the payment URL above');
console.log('2. Open it in your browser');
console.log('3. Check the result:\n');

console.log('   ✅ SUCCESS: If you see Nexi payment page with:');
console.log('      - Merchant ID: 025153685');
console.log('      - Amount: €1.00');
console.log('      - Payment form ready\n');

console.log('   ❌ FAILURE: If you see:');
console.log('      - "Invalid MAC" error');
console.log('      - Login page');
console.log('      - Authentication error');
console.log('      → MAC Key is different for this merchant\n');

console.log('🔗 Test URL (click or copy):');
console.log(`\n${paymentUrl}\n`);

console.log('⚠️  Note: This is a REAL payment URL in PRODUCTION.');
console.log('    Only proceed if you want to test with a real €1.00 payment.\n');
