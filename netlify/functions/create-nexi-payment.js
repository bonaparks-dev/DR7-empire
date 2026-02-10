const crypto = require('crypto');

/**
 * Netlify Function to create Nexi XPay payment using API method
 * Uses /orders/hpp endpoint with X-API-KEY authentication
 */
exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://dr7empire.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
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
        headers: corsHeaders,
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
        headers: corsHeaders,
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

    // Generate UUID v4 for Correlation-Id (compatible with older Node versions)
    const correlationId = crypto.randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

    // Sanitize orderId for Nexi (alphanumeric only, 1-50 chars)
    // Nexi requires: only letters and numbers, no special characters
    const sanitizedOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 50);

    if (!sanitizedOrderId || sanitizedOrderId.length === 0) {
      console.error('Invalid orderId after sanitization:', orderId);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Invalid orderId format',
          details: 'OrderId must contain at least one alphanumeric character'
        }),
      };
    }

    console.log('OrderId sanitization:', { original: orderId, sanitized: sanitizedOrderId });

    // Prepare request body for Nexi API
    const requestBody = {
      order: {
        orderId: sanitizedOrderId,
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

    console.log('Creating Nexi payment via API:', { orderId, amount, currency, correlationId });
    console.log('Request headers:', {
      'Content-Type': 'application/json',
      'X-API-KEY': nexiConfig.apiKey.substring(0, 10) + '...',
      'Correlation-Id': correlationId,
    });
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    // Call Nexi API
    const response = await fetch(`${baseUrl}/orders/hpp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': nexiConfig.apiKey,
        'Correlation-Id': correlationId, // Required UUID format
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    console.log('Nexi API response status:', response.status);
    console.log('Nexi API response:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error('Nexi API error:', responseData);
      return {
        statusCode: response.status,
        headers: corsHeaders,
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
      headers: corsHeaders,
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
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to create payment',
        message: error.message,
      }),
    };
  }
};
