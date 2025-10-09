import type { Handler } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

/**
 * Creates a Stripe Identity Verification Session
 *
 * POST /.netlify/functions/create-identity-verification
 * Body: { userId: string, email: string }
 *
 * Returns: { clientSecret: string, verificationSessionId: string }
 */
const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { userId, email } = JSON.parse(event.body || '{}');

    if (!userId || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userId and email are required' }),
      };
    }

    // Create Stripe Identity Verification Session
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        user_id: userId,
        user_email: email,
      },
      options: {
        document: {
          // Allowed document types
          allowed_types: ['driving_license', 'passport', 'id_card'],
          // Require matching selfie
          require_matching_selfie: true,
        },
      },
      // Return URL after verification
      return_url: `${process.env.URL || 'https://dr7empire.com'}/account/documents`,
    });

    console.log('[Stripe Identity] Created verification session:', verificationSession.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: verificationSession.client_secret,
        verificationSessionId: verificationSession.id,
      }),
    };
  } catch (error: any) {
    console.error('[Stripe Identity] Error creating verification session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create verification session',
        message: error.message,
      }),
    };
  }
};

export { handler };
