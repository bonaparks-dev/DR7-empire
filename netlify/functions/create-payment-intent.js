// netlify/functions/create-payment-intent.js

/**
 * Creates a standard JSON response.
 * @param {number} statusCode - The HTTP status code.
 * @param {object} body - The response body.
 * @returns {object} The formatted response object.
 */
const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Adjust for production environments
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return createResponse(405, { error: 'Method Not Allowed' });
  }

  // IMPORTANT: Set this environment variable in your Netlify project settings.
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return createResponse(500, { error: 'Stripe secret key is not configured.' });
  }

  try {
    const { amount, currency } = JSON.parse(event.body);

    if (amount === undefined || !currency) {
      return createResponse(400, { error: 'Amount and currency are required.' });
    }

    // Stripe API expects the amount in the smallest currency unit (e.g., cents).
    const amountInCents = Math.round(amount * 100);

    const params = new URLSearchParams();
    params.append('amount', amountInCents);
    params.append('currency', currency.toLowerCase());
    params.append('automatic_payment_methods[enabled]', 'true');

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const paymentIntent = await response.json();

    if (!response.ok) {
      const errorMessage = paymentIntent.error?.message || 'Failed to create Payment Intent.';
      return createResponse(response.status, { error: errorMessage });
    }

    return createResponse(200, { clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error('Error creating Payment Intent:', error);
    return createResponse(500, { error: 'An internal server error occurred.' });
  }
};
