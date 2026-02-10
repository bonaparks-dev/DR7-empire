const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

/**
 * Generate MAC to verify callback authenticity
 */
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

/**
 * Nexi XPay Callback Handler
 * Receives payment notifications from Nexi
 */
exports.handler = async (event) => {
  try {
    console.log('Nexi callback received:', event.httpMethod);

    // Parse callback data (Nexi sends POST with form data)
    let params = {};

    if (event.httpMethod === 'POST') {
      // Parse URL-encoded form data
      const body = event.body;
      body.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      });
    } else if (event.httpMethod === 'GET') {
      // Parse query parameters
      params = event.queryStringParameters || {};
    }

    console.log('Callback params:', JSON.stringify(params, null, 2));

    // Extract important fields
    const {
      codTrans,      // Order ID
      esito,         // Result: OK or KO
      importo,       // Amount
      divisa,        // Currency
      data,          // Date
      orario,        // Time
      codAut,        // Authorization code
      mac,           // MAC for verification
      messaggio,     // Error message (if any)
    } = params;

    // Get Nexi configuration
    const macKey = process.env.NEXI_MAC_KEY;

    // Verify MAC - mandatory for security
    if (!macKey) {
      console.error('❌ NEXI_MAC_KEY not configured - rejecting callback');
      return { statusCode: 500, body: 'MAC key not configured' };
    }

    if (!mac) {
      console.error('❌ No MAC provided in callback - rejecting');
      return { statusCode: 400, body: 'Missing MAC' };
    }

    console.log('Verifying MAC...');
    const paramsForMAC = { ...params };
    delete paramsForMAC.mac;

    const calculatedMAC = generateMAC(paramsForMAC, macKey);

    if (calculatedMAC !== mac) {
      console.error('❌ Invalid MAC - possible fraud attempt');
      return { statusCode: 400, body: 'Invalid MAC' };
    }

    console.log('✅ MAC verified successfully');

    // Initialize Supabase — require service role key (never fall back to anon key)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not configured');
      return { statusCode: 500, body: 'Server configuration error' };
    }
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Find booking or credit wallet purchase by order ID
    console.log('Looking for order with codTrans:', codTrans);

    // 1. Try bookings first
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .or(`id.eq.${codTrans},nexi_order_id.eq.${codTrans}`)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching booking:', fetchError);
    }

    if (bookings && bookings.length > 0) {
      const booking = bookings[0];
      console.log('Found booking:', booking.id);

      // Idempotency check: skip if already completed
      if (booking.payment_status === 'completed' || booking.payment_status === 'succeeded' || booking.payment_status === 'paid') {
        console.log('Booking already paid, skipping duplicate callback');
        return { statusCode: 200, body: 'OK' };
      }

      const updateData = {
        payment_status: esito === 'OK' ? 'succeeded' : 'failed',
        nexi_payment_id: codTrans,
        nexi_authorization_code: codAut || null,
        payment_completed_at: esito === 'OK' ? new Date().toISOString() : null
      };

      if (esito === 'OK') {
        updateData.status = 'confirmed';
      } else {
        updateData.nexi_error_message = messaggio || 'Payment failed';
        updateData.status = 'cancelled';
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);

      if (updateError) {
        console.error('Error updating booking:', updateError);
        return { statusCode: 500, body: 'Error updating booking' };
      }

      console.log(`✅ Booking ${booking.id} updated: payment_status=${updateData.payment_status}`);
      return { statusCode: 200, body: 'OK' };
    }

    // 2. Try credit_wallet_purchases
    const { data: purchases, error: purchaseError } = await supabase
      .from('credit_wallet_purchases')
      .select('*')
      .eq('nexi_order_id', codTrans)
      .limit(1);

    if (purchaseError) {
      console.error('Error fetching credit wallet purchase:', purchaseError);
    }

    if (purchases && purchases.length > 0) {
      const purchase = purchases[0];
      console.log('Found credit wallet purchase:', purchase.id);

      // Skip if already completed (avoid double-crediting)
      if (purchase.payment_status === 'completed' || purchase.payment_status === 'succeeded' || purchase.payment_status === 'paid') {
        console.log('Purchase already completed, skipping');
        return { statusCode: 200, body: 'OK' };
      }

      if (esito === 'OK') {
        // Atomically update purchase status - only succeeds if not already 'succeeded'
        const { data: updatedPurchase, error: upErr } = await supabase
          .from('credit_wallet_purchases')
          .update({
            payment_status: 'succeeded',
            payment_completed_at: new Date().toISOString()
          })
          .eq('id', purchase.id)
          .neq('payment_status', 'succeeded')
          .select()
          .single();

        // If no row returned, another callback already processed it
        if (!updatedPurchase) {
          console.log('Purchase already processed by another callback, skipping');
          return { statusCode: 200, body: 'OK' };
        }

        if (upErr) {
          console.error('Error updating purchase:', upErr);
          return { statusCode: 500, body: 'Error updating purchase' };
        }

        // Add credits via atomic RPC (prevents race conditions and double-crediting)
        if (purchase.user_id && purchase.received_amount) {
          const { data: rpcResult, error: rpcError } = await supabase.rpc('add_credits', {
            p_user_id: purchase.user_id,
            p_amount: purchase.received_amount,
            p_description: `Ricarica ${purchase.package_name} - Bonus ${purchase.bonus_percentage}%`,
            p_reference_id: purchase.id,
            p_reference_type: 'wallet_purchase'
          });

          if (rpcError) {
            console.error('❌ Error adding credits via RPC:', rpcError);
          } else {
            const result = rpcResult?.[0] || rpcResult;
            console.log(`✅ Credits added via RPC: €${purchase.received_amount} to user ${purchase.user_id} (new balance: €${result?.new_balance})`);
          }
        }
      } else {
        // Payment failed
        await supabase
          .from('credit_wallet_purchases')
          .update({
            payment_status: 'failed',
            payment_error_message: messaggio || 'Payment failed'
          })
          .eq('id', purchase.id);

        console.log(`❌ Credit wallet purchase ${purchase.id} payment failed`);
      }

      return { statusCode: 200, body: 'OK' };
    }

    // 3. Try membership_purchases
    const { data: memberships, error: membershipError } = await supabase
      .from('membership_purchases')
      .select('*')
      .eq('nexi_order_id', codTrans)
      .limit(1);

    if (!membershipError && memberships && memberships.length > 0) {
      const membership = memberships[0];
      console.log('Found membership purchase:', membership.id);

      // Idempotency check: skip if already succeeded
      if (membership.payment_status === 'succeeded') {
        console.log('Membership already succeeded, skipping duplicate callback');
        return { statusCode: 200, body: 'OK' };
      }

      if (esito === 'OK') {
        // Extract contractId from callback params (Nexi returns it after CONTRACT_CREATION)
        const contractId = params.contractId || params.contract_id || codTrans;

        // Atomically update — only if not already 'succeeded'
        const { data: updated, error: upErr } = await supabase
          .from('membership_purchases')
          .update({
            payment_status: 'succeeded',
            payment_completed_at: new Date().toISOString(),
            nexi_contract_id: contractId,
            subscription_status: 'active',
          })
          .eq('id', membership.id)
          .neq('payment_status', 'succeeded')
          .select()
          .single();

        if (!updated) {
          console.log('Membership already processed by another callback, skipping');
          return { statusCode: 200, body: 'OK' };
        }

        if (upErr) {
          console.error('Error updating membership:', upErr);
          return { statusCode: 500, body: 'Error updating membership' };
        }

        // Activate membership in user metadata (fixes finalizeEnrollment never running)
        if (membership.user_id) {
          const { error: metaErr } = await supabase.auth.admin.updateUserById(
            membership.user_id,
            {
              user_metadata: {
                membership: {
                  tierId: membership.tier_id,
                  billingCycle: membership.billing_cycle,
                  renewalDate: membership.renewal_date,
                  isRecurring: membership.is_recurring || false,
                  subscriptionStatus: 'active',
                },
              },
            }
          );

          if (metaErr) {
            console.error('Error updating user metadata:', metaErr);
            return { statusCode: 500, body: 'Metadata update failed' };
          } else {
            console.log(`✅ User ${membership.user_id} metadata updated with membership`);
          }
        }

        // Send WhatsApp notification to admin
        const whatsappMsg = `Nuova Membership Attivata!\n\n` +
          `Tier: ${membership.tier_name}\n` +
          `Piano: ${membership.billing_cycle}\n` +
          `Prezzo: €${membership.price}\n` +
          `User ID: ${membership.user_id}\n` +
          `Contract ID: ${contractId}\n` +
          `Rinnovo automatico: ${membership.is_recurring ? 'Si' : 'No'}`;

        try {
          await fetch(`${process.env.URL || 'https://dr7empire.com'}/.netlify/functions/send-whatsapp-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: whatsappMsg, type: 'membership_activation' }),
          });
        } catch (whatsErr) {
          console.error('WhatsApp notification failed:', whatsErr);
        }

        console.log(`✅ Membership ${membership.id} activated with contractId: ${contractId}`);
      } else {
        // Payment failed
        await supabase
          .from('membership_purchases')
          .update({
            payment_status: 'failed',
          })
          .eq('id', membership.id);

        console.log(`❌ Membership ${membership.id} payment failed: ${messaggio}`);
      }

      return { statusCode: 200, body: 'OK' };
    }

    console.error('No matching order found for codTrans:', codTrans);
    return { statusCode: 404, body: 'Order not found' };
  } catch (error) {
    console.error('Callback error:', error);
    return {
      statusCode: 500,
      body: 'Internal server error'
    };
  }
};
