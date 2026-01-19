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

    // Find booking by order ID
    // The orderId in Nexi is the sanitized booking ID or custom order ID
    console.log('Looking for booking with orderId:', codTrans);

    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .or(`id.eq.${codTrans},nexi_order_id.eq.${codTrans}`)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching booking:', fetchError);
      return {
        statusCode: 500,
        body: 'Error fetching booking'
      };
    }

    if (!bookings || bookings.length === 0) {
      console.error('Booking not found for orderId:', codTrans);
      return {
        statusCode: 404,
        body: 'Booking not found'
      };
    }

    const booking = bookings[0];
    console.log('Found booking:', booking.id);

    // Update booking based on payment result
    const updateData = {
      payment_status: esito === 'OK' ? 'completed' : 'failed',
      nexi_transaction_id: codTrans,
      nexi_authorization_code: codAut || null,
      payment_completed_at: esito === 'OK' ? new Date().toISOString() : null
    };

    if (esito !== 'OK') {
      updateData.payment_error_message = messaggio || 'Payment failed';
      updateData.status = 'cancelled'; // Cancel booking if payment failed
    }

    console.log('Updating booking with:', updateData);

    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', booking.id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return {
        statusCode: 500,
        body: 'Error updating booking'
      };
    }

    console.log(`✅ Booking ${booking.id} updated: payment_status=${updateData.payment_status}`);

    // Return success response to Nexi
    return {
      statusCode: 200,
      body: 'OK'
    };
  } catch (error) {
    console.error('Callback error:', error);
    return {
      statusCode: 500,
      body: 'Internal server error'
    };
  }
};
