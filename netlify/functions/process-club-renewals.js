const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

/**
 * Scheduled function (cron: */30 * * * *)
 * Processes DR7 Club subscription renewals every 30 minutes.
 * Finds expired subscriptions with a stored Nexi contract and charges via MIT.
 */
exports.handler = async (event) => {
  console.log('Starting DR7 Club renewal processing...');

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

  // Find active subscriptions that have expired and have a contract for renewal
  const { data: dueSubscriptions, error: queryErr } = await supabase
    .from('dr7_club_subscriptions')
    .select('*')
    .eq('status', 'active')
    .lte('expires_at', new Date().toISOString())
    .not('nexi_contract_id', 'is', null);

  if (queryErr) {
    console.error('Error querying due subscriptions:', queryErr);
    return { statusCode: 500, body: 'Query error' };
  }

  console.log(`Found ${dueSubscriptions?.length || 0} DR7 Club subscriptions due for renewal`);

  const results = { renewed: 0, failed: 0, errors: [] };

  for (const sub of (dueSubscriptions || [])) {
    try {
      console.log(`Processing renewal for subscription ${sub.id} (user: ${sub.user_id}, plan: ${sub.plan})`);

      const timestamp = Date.now().toString().substring(5);
      const random = Math.floor(100 + Math.random() * 900).toString();
      const renewalOrderId = `CLUBREN${timestamp}${random}`;

      const correlationId = crypto.randomBytes(16).toString('hex')
        .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

      // Nexi MIT charge
      const mitBody = {
        order: {
          orderId: renewalOrderId,
          amount: Math.round(sub.price * 100).toString(),
          currency: 'EUR',
          customerId: sub.user_id,
          description: `Rinnovo DR7 Club - ${sub.plan === 'monthly' ? 'Mensile' : 'Annuale'}`,
        },
        card: {
          contractId: sub.nexi_contract_id,
        },
        recurrence: {
          action: 'SUBSEQUENT_MIT',
          contractId: sub.nexi_contract_id,
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
        // Success: extend expires_at
        const prev = new Date(sub.expires_at);
        const newExpiry = new Date(prev);
        if (sub.plan === 'monthly') {
          newExpiry.setMonth(prev.getMonth() + 1);
          if (newExpiry.getMonth() !== ((prev.getMonth() + 1) % 12)) {
            newExpiry.setDate(0);
          }
        } else {
          newExpiry.setFullYear(prev.getFullYear() + 1);
        }

        await supabase
          .from('dr7_club_subscriptions')
          .update({
            expires_at: newExpiry.toISOString(),
            nexi_order_id: renewalOrderId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id);

        console.log(`Renewed DR7 Club ${sub.id}, next expiry: ${newExpiry.toISOString()}`);
        results.renewed++;
      } else {
        // Failed
        console.error(`MIT charge failed for DR7 Club ${sub.id}:`, mitData);

        await supabase
          .from('dr7_club_subscriptions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id);

        // Alert admin
        const alertMsg = `Rinnovo DR7 Club FALLITO!\n\nUser: ${sub.user_id}\nPiano: ${sub.plan}\nPrezzo: EUR ${sub.price}\nErrore: ${JSON.stringify(mitData.errors || mitData)}`;
        try {
          await fetch(`${siteUrl}/.netlify/functions/send-whatsapp-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customMessage: alertMsg }),
          });
        } catch (whatsErr) {
          console.error('WhatsApp alert failed:', whatsErr);
        }

        results.failed++;
        results.errors.push({ subscriptionId: sub.id, error: mitData });
      }
    } catch (err) {
      console.error(`Error processing DR7 Club renewal ${sub.id}:`, err);
      results.failed++;
      results.errors.push({ subscriptionId: sub.id, error: err.message });
    }
  }

  console.log('DR7 Club renewal processing complete:', results);
  return {
    statusCode: 200,
    body: JSON.stringify(results),
  };
};
