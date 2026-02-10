const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  try {
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = stripeEvent.data.object;

        // Handle car wash booking payments (BACKUP NOTIFICATION SYSTEM)
        if (paymentIntent.metadata.bookingType === 'car_wash') {
          console.log('[CarWash] Car wash payment detected, processing backup notifications...');

          try {
            // Find the booking by stripe_payment_intent_id
            const { data: booking, error: fetchError } = await supabase
              .from('bookings')
              .select('*')
              .eq('stripe_payment_intent_id', paymentIntent.id)
              .eq('service_type', 'car_wash')
              .single();

            if (fetchError || !booking) {
              console.error('[CarWash] Could not find booking for payment intent:', paymentIntent.id, fetchError);
            } else {
              console.log('[CarWash] Found booking:', booking.id);

              // Send confirmation email (this is the backup in case frontend call failed)
              try {
                console.log('[CarWash] Sending confirmation email via webhook backup...');
                const emailResponse = await fetch(`${process.env.URL}/.netlify/functions/send-booking-confirmation`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ booking })
                });

                if (emailResponse.ok) {
                  console.log('[CarWash] Confirmation email sent successfully via webhook');
                } else {
                  const errorText = await emailResponse.text();
                  console.error('[CarWash] Email sending failed:', emailResponse.status, errorText);
                }
              } catch (emailError) {
                console.error('[CarWash] Error sending confirmation email:', emailError);
              }

              // Send WhatsApp notification
              try {
                console.log('[CarWash] Sending WhatsApp notification via webhook backup...');
                await fetch(`${process.env.URL}/.netlify/functions/send-whatsapp-notification`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ booking })
                });
                console.log('[CarWash] WhatsApp notification sent successfully via webhook');
              } catch (whatsappError) {
                console.error('[CarWash] Error sending WhatsApp notification:', whatsappError);
              }
            }
          } catch (error) {
            console.error('[CarWash] Error processing car wash booking webhook:', error);
          }
        }

        break;
      }

      default:
        console.log(`Unhandled event type ${stripeEvent.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
