import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    let customerId = body.customerId;
    const { email, name } = body;

    // If no customerId is provided, create a new Stripe Customer
    if (!customerId) {
        if (!email || !name) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Customer ID or email and name are required to create a customer.' }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        const customer = await stripe.customers.create({
            email: email,
            name: name,
        });
        customerId = customer.id;
    }

    // Create a SetupIntent for the customer
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'on_session',
    });

    // Return the client secret and the customer ID
    return {
      statusCode: 200,
      body: JSON.stringify({
          clientSecret: setupIntent.client_secret,
          customerId: customerId
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error: any) {
    console.error('Stripe SetupIntent creation failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};