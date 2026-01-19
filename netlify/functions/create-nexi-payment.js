const crypto = require('crypto');

/**
 * Generate MAC (Message Authentication Code) for Nexi XPay
 */
function generateMAC(params, macKey) {
  // Sort parameters alphabetically
  const sortedKeys = Object.keys(params).sort();

  // Build the string to hash
  let macString = '';
  for (const key of sortedKeys) {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      macString += `${key}=${params[key]}`;
    }
  }

  // Add MAC key at the end
  macString += macKey;

  // Calculate SHA1 hash
  const hash = crypto.createHash('sha1').update(macString, 'utf8').digest('hex');

  return hash;
}

/**
 * Netlify Function to create Nexi XPay payment
 */
exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { amount, currency, description, orderId, customerEmail, customerName } = body;

    // Validate required fields
    if (!amount || !currency || !orderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Get Nexi configuration from environment variables
    const nexiConfig = {
      apiKey: process.env.NEXI_API_KEY,
      macKey: process.env.NEXI_MAC_KEY,
      merchantId: process.env.NEXI_MERCHANT_ID,
      terminalId: process.env.NEXI_TERMINAL_ID,
      accountId: process.env.NEXI_ACCOUNT_ID,
      environment: process.env.NEXI_ENVIRONMENT || 'production',
    };

    // Validate configuration (MAC key is optional)
    if (!nexiConfig.apiKey || !nexiConfig.merchantId) {
      console.error('Missing Nexi configuration:', {
        hasApiKey: !!nexiConfig.apiKey,
        hasMacKey: !!nexiConfig.macKey,
        hasMerchantId: !!nexiConfig.merchantId,
      });
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Nexi configuration error' }),
      };
    }

    // Check if MAC authentication is available
    const useMac = !!nexiConfig.macKey;
    if (!useMac) {
      console.warn('⚠️  Operating without MAC authentication - reduced security');
    }

    // Determine base URL
    const baseUrl =
      nexiConfig.environment === 'production'
        ? 'https://xpay.nexigroup.com'
        : 'https://xpaysandboxdb.nexigroup.com';

    // Get site URL for callbacks
    const siteUrl = process.env.URL || 'https://dr7empire.com';

    // Prepare request parameters for Nexi X-Pay
    const params = {
      alias: 'xpay web', // Alias from Nexi backoffice
      importo: amount.toString(),
      divisa: currency,
      codTrans: orderId,
      descrizione: description || 'Payment',
      mail: customerEmail || '',
      languageId: 'ITA',
      urlpost: `${siteUrl}/.netlify/functions/nexi-callback`,
      url: `${siteUrl}/payment-success`,
      urlback: `${siteUrl}/payment-cancel`,
    };

    // Generate MAC only if key is available
    if (useMac) {
      const mac = generateMAC(params, nexiConfig.macKey);
      params.mac = mac;
      console.log('✅ Using MAC authentication');
    } else {
      console.log('ℹ️  Proceeding without MAC parameter');
    }

    // Create payment with Nexi
    console.log('Creating Nexi payment:', { orderId, amount, currency });

    // For Nexi XPay, we need to redirect directly to the payment page
    // The DispatcherServlet endpoint handles the payment form
    const queryString = new URLSearchParams(params).toString();
    const paymentUrl = `${baseUrl}/ecomm/ecomm/DispatcherServlet?${queryString}`;

    console.log('Payment URL created:', paymentUrl.substring(0, 100) + '...');
    if (useMac) {
      console.log('MAC generated and included in request');
    }

    // Return payment URL to frontend
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        paymentUrl: paymentUrl,
        orderId: orderId,
      }),
    };
  } catch (error) {
    console.error('Nexi payment creation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create payment',
        message: error.message,
      }),
    };
  }
};
