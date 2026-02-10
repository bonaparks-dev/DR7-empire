const { createClient } = require('@supabase/supabase-js');

/**
 * Cancel a membership subscription
 * - Verifies user owns the membership
 * - Deactivates the Nexi contract
 * - Sets subscription_status to 'cancelled'
 * - Membership remains active until renewal_date
 */
exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify the user from auth token
    const authHeader = event.headers['authorization'] || event.headers['Authorization'];
    if (!authHeader) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authorization' }) };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
    }

    const { membershipId } = JSON.parse(event.body);
    if (!membershipId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing membershipId' }) };
    }

    // Fetch the membership and verify ownership
    const { data: membership, error: fetchErr } = await supabase
      .from('membership_purchases')
      .select('*')
      .eq('id', membershipId)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !membership) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Membership not found' }) };
    }

    if (membership.subscription_status === 'cancelled') {
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Already cancelled' }) };
    }

    // Deactivate Nexi contract if it exists
    if (membership.nexi_contract_id) {
      const nexiApiKey = process.env.NEXI_API_KEY;
      const nexiEnvironment = process.env.NEXI_ENVIRONMENT || 'production';
      const baseUrl = nexiEnvironment === 'production'
        ? 'https://xpay.nexigroup.com/api/phoenix-0.0/psp/api/v1'
        : 'https://xpaysandbox.nexigroup.com/api/phoenix-0.0/psp/api/v1';

      if (nexiApiKey) {
        try {
          const deactivateRes = await fetch(
            `${baseUrl}/contracts/${membership.nexi_contract_id}/deactivation`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': nexiApiKey,
              },
            }
          );

          if (!deactivateRes.ok) {
            const errData = await deactivateRes.json().catch(() => ({}));
            console.error('Nexi contract deactivation failed:', errData);
            // Continue anyway — we still cancel on our side
          } else {
            console.log(`Nexi contract ${membership.nexi_contract_id} deactivated`);
          }
        } catch (nexiErr) {
          console.error('Nexi deactivation error:', nexiErr);
        }
      }
    }

    // Update membership status in DB
    const { error: updateErr } = await supabase
      .from('membership_purchases')
      .update({ subscription_status: 'cancelled' })
      .eq('id', membershipId);

    if (updateErr) {
      console.error('Error updating membership:', updateErr);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to cancel' }) };
    }

    // Update user metadata — membership stays active until renewal_date
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        membership: {
          tierId: membership.tier_id,
          billingCycle: membership.billing_cycle,
          renewalDate: membership.renewal_date,
          isRecurring: true,
          subscriptionStatus: 'cancelled',
        },
      },
    });

    console.log(`Membership ${membershipId} cancelled for user ${user.id}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Subscription cancelled. Membership active until ' + membership.renewal_date,
      }),
    };
  } catch (error) {
    console.error('Cancel membership error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
