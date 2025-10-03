import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET || '';

/**
 * Stripe Identity Webhook Handler
 *
 * Receives events from Stripe Identity and updates user verification status
 */
const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature'];

  if (!sig) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No signature provided' }),
    };
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body || '',
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error('[Identity Webhook] Signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` }),
    };
  }

  try {
    switch (stripeEvent.type) {
      case 'identity.verification_session.verified': {
        const session = stripeEvent.data.object as Stripe.Identity.VerificationSession;
        console.log('[Identity Webhook] Verification successful:', session.id);

        // Get user ID from metadata
        const userId = session.metadata?.user_id;

        if (!userId) {
          console.error('[Identity Webhook] No user_id in metadata');
          break;
        }

        // Update user verification status in Supabase
        const { error } = await supabase
          .from('users')
          .update({
            verification: {
              idStatus: 'verified',
              stripeVerificationSessionId: session.id,
              verifiedAt: new Date().toISOString(),
            },
          })
          .eq('id', userId);

        if (error) {
          console.error('[Identity Webhook] Failed to update user:', error);
        } else {
          console.log('[Identity Webhook] User verification updated:', userId);
        }

        break;
      }

      case 'identity.verification_session.requires_input': {
        const session = stripeEvent.data.object as Stripe.Identity.VerificationSession;
        console.log('[Identity Webhook] Verification requires input:', session.id);

        const userId = session.metadata?.user_id;
        if (!userId) break;

        // Update status to pending (user needs to provide more info)
        await supabase
          .from('users')
          .update({
            verification: {
              idStatus: 'pending',
              stripeVerificationSessionId: session.id,
            },
          })
          .eq('id', userId);

        break;
      }

      case 'identity.verification_session.canceled': {
        const session = stripeEvent.data.object as Stripe.Identity.VerificationSession;
        console.log('[Identity Webhook] Verification canceled:', session.id);

        const userId = session.metadata?.user_id;
        if (!userId) break;

        // Reset to unverified
        await supabase
          .from('users')
          .update({
            verification: {
              idStatus: 'unverified',
              stripeVerificationSessionId: session.id,
            },
          })
          .eq('id', userId);

        break;
      }

      default:
        console.log(`[Identity Webhook] Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error: any) {
    console.error('[Identity Webhook] Error processing event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
