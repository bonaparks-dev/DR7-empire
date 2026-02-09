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

    // Verify MAC only if configured
    if (macKey && mac) {
      console.log('Verifying MAC...');
      const paramsForMAC = { ...params };
      delete paramsForMAC.mac; // Remove MAC from params before verification

      const calculatedMAC = generateMAC(paramsForMAC, macKey);

      if (calculatedMAC !== mac) {
        console.error('❌ Invalid MAC - possible fraud attempt');
        console.error('Expected:', calculatedMAC);
        console.error('Received:', mac);
        return {
          statusCode: 400,
          body: 'Invalid MAC',
        };
      }

      console.log('✅ MAC verified successfully');
    } else if (!macKey) {
      console.warn('⚠️  Operating without MAC verification - reduced security');
      console.warn('⚠️  Accepting callback based on HTTPS only');
    } else {
      console.warn('⚠️  No MAC provided in callback');
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
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

      const updateData = {
        payment_status: esito === 'OK' ? 'completed' : 'failed',
        nexi_transaction_id: codTrans,
        nexi_authorization_code: codAut || null,
        payment_completed_at: esito === 'OK' ? new Date().toISOString() : null
      };

      if (esito !== 'OK') {
        updateData.payment_error_message = messaggio || 'Payment failed';
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
      if (purchase.payment_status === 'completed') {
        console.log('Purchase already completed, skipping');
        return { statusCode: 200, body: 'OK' };
      }

      if (esito === 'OK') {
        // Update purchase status
        const { error: updateError } = await supabase
          .from('credit_wallet_purchases')
          .update({
            payment_status: 'completed',
            payment_completed_at: new Date().toISOString()
          })
          .eq('id', purchase.id);

        if (updateError) {
          console.error('Error updating purchase:', updateError);
          return { statusCode: 500, body: 'Error updating purchase' };
        }

        // Add credits to user's wallet
        if (purchase.user_id && purchase.received_amount) {
          // Get current balance
          const { data: balanceRow } = await supabase
            .from('user_credit_balance')
            .select('balance')
            .eq('user_id', purchase.user_id)
            .single();

          const currentBalance = balanceRow?.balance || 0;
          const newBalance = currentBalance + purchase.received_amount;

          // Upsert balance
          await supabase
            .from('user_credit_balance')
            .upsert({
              user_id: purchase.user_id,
              balance: newBalance,
              last_updated: new Date().toISOString()
            }, { onConflict: 'user_id' });

          // Record credit transaction
          await supabase
            .from('credit_transactions')
            .insert({
              user_id: purchase.user_id,
              transaction_type: 'credit',
              amount: purchase.received_amount,
              balance_after: newBalance,
              description: `Ricarica ${purchase.package_name} - Bonus ${purchase.bonus_percentage}%`,
              reference_id: purchase.id,
              reference_type: 'wallet_purchase',
              created_at: new Date().toISOString()
            });

          console.log(`✅ Credits added: €${purchase.received_amount} to user ${purchase.user_id} (new balance: €${newBalance})`);
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

      await supabase
        .from('membership_purchases')
        .update({
          payment_status: esito === 'OK' ? 'completed' : 'failed',
          payment_completed_at: esito === 'OK' ? new Date().toISOString() : null
        })
        .eq('id', membership.id);

      console.log(`✅ Membership ${membership.id} updated: ${esito}`);
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
