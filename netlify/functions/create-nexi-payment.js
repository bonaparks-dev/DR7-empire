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
      alias: process.env.NEXI_ALIAS,
      macKey: process.env.NEXI_MAC_KEY,
      merchantId: process.env.NEXI_MERCHANT_ID,
      environment: process.env.NEXI_ENVIRONMENT || 'sandbox',
      apiKey:
        process.env.NEXI_ENVIRONMENT === 'production'
          ? process.env.NEXI_API_KEY_PRODUCTION
          : process.env.NEXI_API_KEY_SANDBOX,
    };

    // Validate configuration
    if (!nexiConfig.alias || !nexiConfig.macKey || !nexiConfig.apiKey) {
      console.error('Missing Nexi configuration');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Nexi configuration error' }),
      };
    }

    // Determine base URL
    const baseUrl =
      nexiConfig.environment === 'production'
        ? 'https://xpay.nexigroup.com'
        : 'https://xpaysandboxdb.nexigroup.com';

    // Get site URL for callbacks
    const siteUrl = process.env.URL || 'https://dr7empire.com';

    // Prepare request parameters
    const params = {
      alias: nexiConfig.alias,
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

    // Generate MAC
    const mac = generateMAC(params, nexiConfig.macKey);
    params.mac = mac;

    // Create payment with Nexi
    console.log('Creating Nexi payment:', { orderId, amount, currency });

    // For Nexi XPay, we need to redirect directly to the payment page
    // The DispatcherServlet endpoint handles the payment form
    const queryString = new URLSearchParams(params).toString();
    const paymentUrl = `${baseUrl}/ecomm/ecomm/DispatcherServlet?${queryString}`;

    console.log('Payment URL created:', paymentUrl.substring(0, 100) + '...');
    console.log('MAC generated:', mac);

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
