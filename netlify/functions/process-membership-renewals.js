const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

/**
 * Daily scheduled function (cron: 0 6 * * *)
 * Finds memberships due for renewal and charges via Nexi MIT
 */
exports.handler = async (event) => {
  console.log('Starting membership renewal processing...');

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const nexiApiKey = process.env.NEXI_API_KEY;
  const nexiEnvironment = process.env.NEXI_ENVIRONMENT || 'production';
  const baseUrl = nexiEnvironment === 'production'
    ? 'https://xpay.nexigroup.com/api/phoenix-0.0/psp/api/v1'
    : 'https://xpaysandbox.nexigroup.com/api/phoenix-0.0/psp/api/v1';
  const siteUrl = process.env.URL || 'https://dr7empire.com';

  if (!nexiApiKey) {
    console.error('NEXI_API_KEY not configured');
    return { statusCode: 500, body: 'Missing Nexi API key' };
  }

  // Find memberships due for renewal
  const { data: dueMemberships, error: queryErr } = await supabase
    .from('membership_purchases')
    .select('*')
    .lte('renewal_date', new Date().toISOString())
    .eq('payment_status', 'succeeded')
    .eq('subscription_status', 'active')
    .not('nexi_contract_id', 'is', null);

  if (queryErr) {
    console.error('Error querying due memberships:', queryErr);
    return { statusCode: 500, body: 'Query error' };
  }

  console.log(`Found ${dueMemberships?.length || 0} memberships due for renewal`);

  const results = { renewed: 0, failed: 0, errors: [] };

  for (const membership of (dueMemberships || [])) {
    try {
      console.log(`Processing renewal for membership ${membership.id} (user: ${membership.user_id})`);

      // Generate order ID for this renewal
      const timestamp = Date.now().toString().substring(5);
      const random = Math.floor(100 + Math.random() * 900).toString();
      const renewalOrderId = `REN${timestamp}${random}`;

      const correlationId = crypto.randomBytes(16).toString('hex')
        .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

      // Call Nexi MIT endpoint
      const mitBody = {
        order: {
          orderId: renewalOrderId,
          amount: Math.round(membership.price * 100).toString(),
          currency: membership.currency || 'EUR',
          customerId: membership.user_id,
          description: `Rinnovo Membership ${membership.tier_name}`,
        },
        card: {
          contractId: membership.nexi_contract_id,
        },
        recurrence: {
          action: 'SUBSEQUENT_MIT',
          contractId: membership.nexi_contract_id,
          contractType: 'MIT_SCHEDULED',
        },
      };

      const mitResponse = await fetch(`${baseUrl}/orders/mit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': nexiApiKey,
          'Correlation-Id': correlationId,
        },
        body: JSON.stringify(mitBody),
      });

      let mitData;
      try {
        mitData = await mitResponse.json();
      } catch (parseErr) {
        mitData = { error: 'Non-JSON response from Nexi' };
      }

      if (mitResponse.ok) {
        // Success: extend renewal_date, preserving the day-of-month
        const prev = new Date(membership.renewal_date);
        const newRenewalDate = new Date(prev);
        if (membership.billing_cycle === 'monthly') {
          // Advance to same day next month (clamped to last day if needed)
          const targetMonth = prev.getMonth() + 1;
          newRenewalDate.setMonth(targetMonth);
          // If day overflowed (e.g. Jan 31 → Mar 3), clamp to last day of target month
          if (newRenewalDate.getMonth() !== (targetMonth % 12)) {
            newRenewalDate.setDate(0); // last day of previous month = target month
          }
        } else {
          newRenewalDate.setFullYear(prev.getFullYear() + 1);
        }

        await supabase
          .from('membership_purchases')
          .update({
            renewal_date: newRenewalDate.toISOString(),
            nexi_order_id: renewalOrderId,
          })
          .eq('id', membership.id);

        // Update user metadata with new renewal date
        await supabase.auth.admin.updateUserById(membership.user_id, {
          user_metadata: {
            membership: {
              tierId: membership.tier_id,
              billingCycle: membership.billing_cycle,
              renewalDate: newRenewalDate.toISOString(),
              isRecurring: true,
              subscriptionStatus: 'active',
            },
          },
        });

        console.log(`Renewed membership ${membership.id}, next renewal: ${newRenewalDate.toISOString()}`);
        results.renewed++;
      } else {
        // Failed: mark as renewal_failed
        console.error(`MIT charge failed for membership ${membership.id}:`, mitData);

        await supabase
          .from('membership_purchases')
          .update({ subscription_status: 'renewal_failed' })
          .eq('id', membership.id);

        // Update user metadata
        await supabase.auth.admin.updateUserById(membership.user_id, {
          user_metadata: {
            membership: {
              tierId: membership.tier_id,
              billingCycle: membership.billing_cycle,
              renewalDate: membership.renewal_date,
              isRecurring: true,
              subscriptionStatus: 'renewal_failed',
            },
          },
        });

        // Send WhatsApp alert to admin
        const alertMsg = `Rinnovo Membership FALLITO!\n\n` +
          `User: ${membership.user_id}\n` +
          `Tier: ${membership.tier_name}\n` +
          `Prezzo: EUR ${membership.price}\n` +
          `Errore: ${JSON.stringify(mitData.errors || mitData)}`;

        try {
          await fetch(`${siteUrl}/.netlify/functions/send-whatsapp-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: alertMsg, type: 'renewal_failed' }),
          });
        } catch (whatsErr) {
          console.error('WhatsApp alert failed:', whatsErr);
        }

        results.failed++;
        results.errors.push({ membershipId: membership.id, error: mitData });
      }
    } catch (err) {
      console.error(`Error processing membership ${membership.id}:`, err);
      results.failed++;
      results.errors.push({ membershipId: membership.id, error: err.message });
    }
  }

  console.log('Renewal processing complete:', results);
  return {
    statusCode: 200,
    body: JSON.stringify(results),
  };
};
