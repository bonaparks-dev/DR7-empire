/**
 * Netlify Function to create Nexi XPay payment using API method
 * Uses /orders/hpp endpoint with X-API-KEY authentication
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
      environment: process.env.NEXI_ENVIRONMENT || 'production',
    };

    // Validate configuration
    if (!nexiConfig.apiKey) {
      console.error('Missing Nexi API key');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Nexi configuration error' }),
      };
    }

    // Determine base URL
    const baseUrl =
      nexiConfig.environment === 'production'
        ? 'https://xpay.nexigroup.com/api/phoenix-0.0/psp/api/v1'
        : 'https://xpaysandbox.nexigroup.com/api/phoenix-0.0/psp/api/v1';

    // Get site URL for callbacks
    const siteUrl = process.env.URL || 'https://dr7empire.com';

    // Prepare request body for Nexi API
    const requestBody = {
      order: {
        orderId: orderId,
        amount: amount.toString(),
        currency: currency,
        customerId: customerEmail || 'guest',
        description: description || 'Payment',
      },
      paymentSession: {
        actionType: 'PAY',
        amount: amount.toString(),
        language: 'ITA',
        resultUrl: `${siteUrl}/payment-success`,
        cancelUrl: `${siteUrl}/payment-cancel`,
        notificationUrl: `${siteUrl}/.netlify/functions/nexi-callback`,
      },
    };

    console.log('Creating Nexi payment via API:', { orderId, amount, currency });

    // Call Nexi API
    const response = await fetch(`${baseUrl}/orders/hpp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': nexiConfig.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Nexi API error:', responseData);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: 'Failed to create payment',
          details: responseData,
        }),
      };
    }

    console.log('Payment created successfully:', responseData);

    // Return payment URL to frontend
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        paymentUrl: responseData.hostedPage,
        orderId: orderId,
        sessionId: responseData.sessionId,
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
