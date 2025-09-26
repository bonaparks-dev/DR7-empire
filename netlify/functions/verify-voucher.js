const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const hmacSecret = process.env.HMAC_SECRET_KEY;

// Helper to create HMAC hash
const createHmac = (data) => {
  return crypto.createHmac('sha256', hmacSecret).update(JSON.stringify(data)).digest('hex');
};

exports.handler = async (event) => {
  // Allow GET requests with a query parameter
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Allow': 'GET' },
    };
  }

  const { code } = event.queryStringParameters;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Voucher code is required' }),
    };
  }

  try {
    // 1. Fetch voucher from database
    const { data: voucher, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !voucher) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Voucher not found' }),
      };
    }

    // 2. Verify the HMAC hash to ensure data integrity
    const payloadToVerify = {
      code: voucher.code,
      email: voucher.email,
      value: voucher.value_cents,
      paid: voucher.paid_cents,
      valid_from: voucher.valid_from,
      expiry: voucher.expiry,
    };
    const expectedHash = createHmac(payloadToVerify);

    if (expectedHash !== voucher.hmac_hash) {
      // Data tampering detected!
      console.error(`CRITICAL: HMAC mismatch for voucher ${code}.`);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Voucher data is invalid or has been tampered with.',
          status: 'invalid_hash'
        }),
      };
    }

    // 3. Check if voucher is expired
    const now = new Date();
    const expiryDate = new Date(voucher.expiry);
    if (now > expiryDate && voucher.status === 'valid') {
        // Optionally update the status in the DB to 'expired'
        await supabase.from('vouchers').update({ status: 'expired' }).eq('id', voucher.id);
        voucher.status = 'expired';
    }

    // 4. Return relevant voucher details
    return {
      statusCode: 200,
      body: JSON.stringify({
        code: voucher.code,
        status: voucher.status,
        value: voucher.value_cents,
        valid_from: voucher.valid_from,
        expiry: voucher.expiry,
        is_valid: voucher.status === 'valid'
      }),
    };
  } catch (error) {
    console.error('Error verifying voucher:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};