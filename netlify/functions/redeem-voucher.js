const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const ADMIN_PIN = process.env.ADMIN_PIN;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' },
    };
  }

  const { code, pin, redeemed_by } = JSON.parse(event.body);

  // 1. Basic validation
  if (!code || !pin || !redeemed_by) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Voucher code, PIN, and redeemed_by are required' }),
    };
  }

  // 2. PIN Authentication
  if (pin !== ADMIN_PIN) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Invalid PIN. Forbidden.' }),
    };
  }

  try {
    // 3. Fetch the voucher
    const { data: voucher, error: fetchError } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .single();

    if (fetchError || !voucher) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Voucher not found' }),
      };
    }

    // 4. Check voucher status
    if (voucher.status !== 'valid') {
      return {
        statusCode: 409, // Conflict
        body: JSON.stringify({ error: `Voucher is not valid. Current status: ${voucher.status}` }),
      };
    }

    // 5. Check expiry
    const now = new Date();
    const expiryDate = new Date(voucher.expiry);
    if (now > expiryDate) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Voucher is expired.' }),
        };
    }

    // 6. Mark as redeemed
    const { data: updatedVoucher, error: updateError } = await supabase
      .from('vouchers')
      .update({
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        redeemed_by: redeemed_by,
      })
      .eq('id', voucher.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Voucher successfully redeemed',
        voucher: {
          code: updatedVoucher.code,
          status: updatedVoucher.status,
          redeemed_at: updatedVoucher.redeemed_at,
        },
      }),
    };
  } catch (error) {
    console.error('Error redeeming voucher:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};