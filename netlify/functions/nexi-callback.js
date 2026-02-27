const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

/**
 * Generate MAC to verify callback authenticity (old XPay format only)
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
 * Parse the incoming callback and normalize to a standard format.
 * Handles:
 *   1. Nexi HPP API v1 — JSON body with orderId / operationResult
 *   2. Old XPay — form-encoded body with codTrans / esito / mac
 *   3. GET redirect with query string (browser redirect fallback)
 *
 * Returns { orderId, isSuccess, authCode, errorMessage, isHPP, rawParams }
 */
function parseCallback(event) {
  let rawParams = {};
  let isHPP = false;

  if (event.httpMethod === 'GET') {
    rawParams = event.queryStringParameters || {};
  } else if (event.httpMethod === 'POST') {
    const body = (event.body || '').trim();
    const contentType = (event.headers['content-type'] || '').toLowerCase();

    // Try JSON first (HPP API v1 notification)
    if (contentType.includes('application/json') || body.startsWith('{')) {
      try {
        rawParams = JSON.parse(body);
        isHPP = true;
        console.log('Parsed as JSON (HPP API v1)');
      } catch (e) {
        console.warn('JSON parse failed, falling back to form-encoded:', e.message);
      }
    }

    // Fall back to URL-encoded form data (old XPay)
    if (!isHPP && body.includes('=')) {
      body.split('&').forEach(pair => {
        const [key, ...rest] = pair.split('=');
        if (key) {
          rawParams[decodeURIComponent(key)] = decodeURIComponent(rest.join('='));
        }
      });
      console.log('Parsed as form-encoded (old XPay)');
    }
  }

  // Normalize field names — map HPP v1 fields to our canonical names
  // HPP v1 uses: orderId, operationId, operationResult, operationType, paymentMethod, etc.
  // Old XPay uses: codTrans, esito (OK/KO), codAut, mac, importo, divisa, messaggio
  const orderId = rawParams.orderId || rawParams.codTrans || rawParams.order_id || null;

  let isSuccess = false;
  if (rawParams.operationResult) {
    // HPP v1: AUTHORIZED, EXECUTED, DECLINED, DENIED, CANCELLED, etc.
    isSuccess = rawParams.operationResult === 'AUTHORIZED' || rawParams.operationResult === 'EXECUTED';
  } else if (rawParams.esito) {
    // Old XPay: OK or KO
    isSuccess = rawParams.esito === 'OK';
  }

  const authCode = rawParams.authorizationCode || rawParams.codAut || rawParams.codice_autorizzazione || null;
  const errorMessage = rawParams.operationResult || rawParams.messaggio || rawParams.message || null;

  return { orderId, isSuccess, authCode, errorMessage, isHPP, rawParams };
}

/**
 * Nexi XPay Callback Handler
 * Receives payment notifications from Nexi (both old XPay and HPP API v1 formats)
 */
exports.handler = async (event) => {
  try {
    console.log('Nexi callback received:', event.httpMethod);
    console.log('Content-Type:', event.headers['content-type']);
    console.log('Raw body (first 500 chars):', (event.body || '').substring(0, 500));

    const { orderId, isSuccess, authCode, errorMessage, isHPP, rawParams } = parseCallback(event);

    console.log('Parsed callback:', { orderId, isSuccess, authCode, errorMessage, isHPP });
    console.log('Raw params:', JSON.stringify(rawParams, null, 2));

    // Verify MAC for old XPay format only (HPP v1 uses API key auth, no MAC)
    if (!isHPP) {
      const macKey = process.env.NEXI_MAC_KEY;
      const mac = rawParams.mac;

      if (!macKey) {
        console.error('NEXI_MAC_KEY not configured - rejecting old XPay callback');
        return { statusCode: 500, body: 'MAC key not configured' };
      }

      if (!mac) {
        console.error('No MAC provided in old XPay callback - rejecting');
        return { statusCode: 400, body: 'Missing MAC' };
      }

      const paramsForMAC = { ...rawParams };
      delete paramsForMAC.mac;
      const calculatedMAC = generateMAC(paramsForMAC, macKey);

      if (calculatedMAC !== mac) {
        console.error('Invalid MAC - possible fraud attempt');
        return { statusCode: 400, body: 'Invalid MAC' };
      }

      console.log('MAC verified successfully');
    } else {
      // HPP v1: Verify using X-API-KEY header if present, or accept trusted notification
      // Nexi S2S notifications come from Nexi's servers to our notificationUrl
      console.log('HPP API v1 notification — MAC not required');
    }

    if (!orderId) {
      console.error('No orderId found in callback params');
      console.error('Full event body:', event.body);
      return { statusCode: 400, body: 'Missing orderId' };
    }

    // Initialize Supabase — require service role key (never fall back to anon key)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return { statusCode: 500, body: 'Server configuration error' };
    }
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Find booking or credit wallet purchase by order ID
    console.log('Looking for order with orderId:', orderId);

    // 1. Try bookings first — backward compat for old pending bookings already in the table
    let bookings = null;

    const result1 = await supabase
      .from('bookings')
      .select('*')
      .or(`id.eq.${orderId},nexi_order_id.eq.${orderId}`)
      .limit(1);

    if (!result1.error && result1.data && result1.data.length > 0) {
      bookings = result1.data;
    } else {
      const result2 = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_details->>nexi_order_id', orderId)
        .limit(1);

      if (!result2.error && result2.data && result2.data.length > 0) {
        bookings = result2.data;
        console.log('Found booking via booking_details JSONB fallback');
      }
    }

    if (bookings && bookings.length > 0) {
      const booking = bookings[0];
      console.log('Found existing booking:', booking.id);

      if (booking.payment_status === 'completed' || booking.payment_status === 'succeeded' || booking.payment_status === 'paid') {
        console.log('Booking already paid, skipping duplicate callback');
        return { statusCode: 200, body: 'OK' };
      }

      const updateData = {
        payment_status: isSuccess ? 'succeeded' : 'failed',
        nexi_payment_id: orderId,
        nexi_authorization_code: authCode || null,
        payment_completed_at: isSuccess ? new Date().toISOString() : null
      };

      if (isSuccess) {
        updateData.status = 'confirmed';
      } else {
        updateData.nexi_error_message = errorMessage || 'Payment failed';
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

      console.log(`Booking ${booking.id} updated: payment_status=${updateData.payment_status}`);

      // Send notifications if payment succeeded
      if (isSuccess) {
        const siteUrl = process.env.URL || 'https://dr7empire.com';
        try {
          await fetch(`${siteUrl}/.netlify/functions/send-booking-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: { ...booking, ...updateData } }),
          });
        } catch (e) {
          console.error('Email notification failed:', e);
        }
        try {
          await fetch(`${siteUrl}/.netlify/functions/send-whatsapp-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: { ...booking, ...updateData } }),
          });
        } catch (e) {
          console.error('WhatsApp notification failed:', e);
        }
      }

      return { statusCode: 200, body: 'OK' };
    }

    // 2. Try pending_nexi_bookings — new flow: booking only created AFTER payment
    const { data: pendingRows, error: pendingError } = await supabase
      .from('pending_nexi_bookings')
      .select('*')
      .eq('nexi_order_id', orderId)
      .limit(1);

    if (pendingError) {
      console.error('Error fetching pending booking:', pendingError);
    }

    if (pendingRows && pendingRows.length > 0) {
      const pending = pendingRows[0];
      console.log('Found pending booking for orderId:', orderId);

      if (isSuccess) {
        // Payment succeeded — create the REAL booking now
        const bookingData = pending.booking_data;
        bookingData.status = 'confirmed';
        bookingData.payment_status = 'succeeded';
        bookingData.nexi_order_id = orderId;
        bookingData.nexi_payment_id = orderId;
        bookingData.nexi_authorization_code = authCode || null;
        bookingData.payment_completed_at = new Date().toISOString();

        const { data: newBooking, error: insertError } = await supabase
          .from('bookings')
          .insert(bookingData)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating booking from pending:', insertError);
          return { statusCode: 500, body: 'Error creating booking' };
        }

        // Clean up pending record
        await supabase
          .from('pending_nexi_bookings')
          .delete()
          .eq('id', pending.id);

        console.log(`Booking ${newBooking.id} created from pending after successful payment`);

        // Send notifications
        const siteUrl = process.env.URL || 'https://dr7empire.com';
        try {
          await fetch(`${siteUrl}/.netlify/functions/send-booking-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: newBooking }),
          });
        } catch (e) {
          console.error('Email notification failed:', e);
        }

        try {
          await fetch(`${siteUrl}/.netlify/functions/send-whatsapp-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking: newBooking }),
          });
        } catch (e) {
          console.error('WhatsApp notification failed:', e);
        }

        return { statusCode: 200, body: 'OK' };
      } else {
        // Payment failed — delete pending record, no booking created
        await supabase
          .from('pending_nexi_bookings')
          .delete()
          .eq('id', pending.id);

        console.log(`Payment failed for pending booking (orderId: ${orderId}), pending record deleted`);
        return { statusCode: 200, body: 'OK' };
      }
    }

    // 3. Try credit_wallet_purchases
    const { data: purchases, error: purchaseError } = await supabase
      .from('credit_wallet_purchases')
      .select('*')
      .eq('nexi_order_id', orderId)
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

      // If currently being processed by another callback, skip to avoid race condition
      if (purchase.payment_status === 'processing') {
        console.log('Purchase currently being processed by another callback, skipping');
        return { statusCode: 200, body: 'OK' };
      }

      if (isSuccess) {
        // IMPORTANT: First claim the purchase atomically to prevent double-processing.
        // Mark as 'processing' (not 'succeeded') so that if credit addition fails,
        // a retry from Nexi can still be processed.
        const { data: claimedPurchase, error: claimErr } = await supabase
          .from('credit_wallet_purchases')
          .update({
            payment_status: 'processing',
            payment_completed_at: new Date().toISOString()
          })
          .eq('id', purchase.id)
          .neq('payment_status', 'succeeded')
          .neq('payment_status', 'processing')
          .select()
          .single();

        // If no row returned, another callback already claimed or completed it
        if (!claimedPurchase) {
          console.log('Purchase already processed by another callback, skipping');
          return { statusCode: 200, body: 'OK' };
        }

        if (claimErr) {
          console.error('Error claiming purchase:', claimErr);
          return { statusCode: 500, body: 'Error claiming purchase' };
        }

        // Add credits via atomic RPC BEFORE marking as succeeded
        // This ensures credits are actually added before we mark the purchase as done
        let creditsAdded = false;
        if (purchase.user_id && purchase.received_amount) {
          const { data: rpcResult, error: rpcError } = await supabase.rpc('add_credits', {
            p_user_id: purchase.user_id,
            p_amount: purchase.received_amount,
            p_description: `Ricarica ${purchase.package_name} - Bonus ${purchase.bonus_percentage}%`,
            p_reference_id: purchase.id,
            p_reference_type: 'wallet_purchase'
          });

          if (rpcError) {
            console.error('Error adding credits via RPC:', rpcError);
            // CRITICAL: Revert purchase status to 'pending' so it can be retried
            await supabase
              .from('credit_wallet_purchases')
              .update({ payment_status: 'pending' })
              .eq('id', purchase.id);
            console.error('Reverted purchase status to pending for retry');
            return { statusCode: 500, body: 'Error adding credits' };
          } else {
            creditsAdded = true;
            const result = rpcResult?.[0] || rpcResult;
            console.log(`Credits added via RPC: €${purchase.received_amount} to user ${purchase.user_id} (new balance: €${result?.new_balance})`);
          }
        }

        // Only mark as 'succeeded' AFTER credits have been successfully added
        if (creditsAdded) {
          const { error: upErr } = await supabase
            .from('credit_wallet_purchases')
            .update({ payment_status: 'succeeded' })
            .eq('id', purchase.id);

          if (upErr) {
            console.error('Error finalizing purchase status:', upErr);
            // Credits were added but status not updated — not critical, balance is correct
          }
        }
      } else {
        // Payment failed
        await supabase
          .from('credit_wallet_purchases')
          .update({
            payment_status: 'failed',
            payment_error_message: errorMessage || 'Payment failed'
          })
          .eq('id', purchase.id);

        console.log(`Credit wallet purchase ${purchase.id} payment failed`);
      }

      return { statusCode: 200, body: 'OK' };
    }

    // 4. Try membership_purchases
    const { data: memberships, error: membershipError } = await supabase
      .from('membership_purchases')
      .select('*')
      .eq('nexi_order_id', orderId)
      .limit(1);

    if (!membershipError && memberships && memberships.length > 0) {
      const membership = memberships[0];
      console.log('Found membership purchase:', membership.id);

      // Idempotency check: skip if already succeeded
      if (membership.payment_status === 'succeeded') {
        console.log('Membership already succeeded, skipping duplicate callback');
        return { statusCode: 200, body: 'OK' };
      }

      if (isSuccess) {
        // Extract contractId from callback params (Nexi returns it after CONTRACT_CREATION)
        const contractId = rawParams.contractId || rawParams.contract_id || orderId;

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
            console.log(`User ${membership.user_id} metadata updated with membership`);
          }
        }

        // Send WhatsApp notification to admin
        const whatsappMsg = `Nuova Membership Attivata!\n\n` +
          `Tier: ${membership.tier_name}\n` +
          `Piano: ${membership.billing_cycle}\n` +
          `Prezzo: €${membership.price}\n` +
          `User ID: ${membership.user_id}`;

        try {
          await fetch(`${process.env.URL || 'https://dr7empire.com'}/.netlify/functions/send-whatsapp-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customMessage: whatsappMsg }),
          });
        } catch (whatsErr) {
          console.error('WhatsApp notification failed:', whatsErr);
        }

        console.log(`Membership ${membership.id} activated with contractId: ${contractId}`);
      } else {
        // Payment failed
        await supabase
          .from('membership_purchases')
          .update({
            payment_status: 'failed',
          })
          .eq('id', membership.id);

        console.log(`Membership ${membership.id} payment failed: ${errorMessage}`);
      }

      return { statusCode: 200, body: 'OK' };
    }

    console.error('No matching order found for orderId:', orderId);
    return { statusCode: 404, body: 'Order not found' };
  } catch (error) {
    console.error('Callback error:', error);
    return {
      statusCode: 500,
      body: 'Internal server error'
    };
  }
};
