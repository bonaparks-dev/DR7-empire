// netlify/functions/redeem-discount-code.js

const { createClient } = require('@supabase/supabase-js');
const { getCorsOrigin } = require('./utils/cors');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Store current request origin for CORS (set per-request in handler)
let _currentOrigin = '';

/**
 * Creates a standard JSON response with CORS headers.
 */
const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': getCorsOrigin(_currentOrigin),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  body: JSON.stringify(body),
});

/**
 * Redeems a discount code by recording its usage
 *
 * POST /redeem-discount-code
 * Body: {
 *   code: "DR7-XXXX-XXXX",
 *   bookingId?: "uuid",
 *   customerId?: "uuid",
 *   customerName?: "string",
 *   serviceType: "noleggio" | "lavaggio" | "supercar" | "utilitaria",
 *   discountApplied: number (in cents),
 *   notes?: "string"
 * }
 *
 * Returns:
 * - 200: Discount code redeemed successfully
 * - 404: Discount code not found
 * - 400: Invalid, expired, or already used
 */
exports.handler = async (event) => {
  _currentOrigin = event.headers['origin'] || '';

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': getCorsOrigin(_currentOrigin),
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return createResponse(405, { error: 'Method Not Allowed' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const code = body.code;
    const bookingId = body.bookingId || body.booking_id;
    const customerId = body.customerId || body.customer_id;
    const customerName = body.customerName || body.customer_name;
    const serviceType = body.serviceType || body.service_type;
    const discountApplied = body.discountApplied || body.discount_applied;
    const notes = body.notes;

    if (!code) {
      return createResponse(400, {
        error: 'Codice mancante',
        message: 'Inserisci un codice sconto'
      });
    }

    if (!serviceType) {
      return createResponse(400, {
        error: 'Tipo servizio mancante',
        message: 'Specifica il tipo di servizio'
      });
    }

    if (!discountApplied || discountApplied <= 0) {
      return createResponse(400, {
        error: 'Importo sconto mancante',
        message: 'Specifica l\'importo dello sconto applicato'
      });
    }

    // Normalize code
    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');

    // Query discount code
    const { data: discountCode, error: queryError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (queryError) {
      console.error('[RedeemDiscountCode] Database error:', queryError);
      return createResponse(500, {
        error: 'Errore database',
        message: 'Errore durante il riscatto del codice'
      });
    }

    if (!discountCode) {
      return createResponse(404, {
        error: 'Codice non trovato',
        message: 'Questo codice sconto non esiste'
      });
    }

    // Validation checks
    const now = new Date();
    const validUntil = new Date(discountCode.valid_until);
    const validFrom = new Date(discountCode.valid_from);

    if (validUntil < now) {
      return createResponse(400, {
        error: 'Codice scaduto',
        message: `Questo codice è scaduto il ${validUntil.toLocaleDateString('it-IT')}`
      });
    }

    if (validFrom > now) {
      return createResponse(400, {
        error: 'Codice non ancora valido',
        message: `Questo codice sarà valido dal ${validFrom.toLocaleDateString('it-IT')}`
      });
    }

    if (discountCode.status !== 'active') {
      return createResponse(400, {
        error: `Codice ${discountCode.status}`,
        message: `Questo codice non può essere utilizzato (stato: ${discountCode.status})`
      });
    }

    // Check if single-use and already used
    if (discountCode.single_use) {
      const { count, error: usageError } = await supabase
        .from('discount_code_usages')
        .select('*', { count: 'exact', head: true })
        .eq('discount_code_id', discountCode.id);

      if (usageError) {
        console.error('[RedeemDiscountCode] Usage check error:', usageError);
      } else if (count > 0) {
        return createResponse(400, {
          error: 'Codice già utilizzato',
          message: 'Questo codice è già stato utilizzato'
        });
      }
    }

    // Record the usage
    const usageData = {
      discount_code_id: discountCode.id,
      customer_id: customerId || null,
      customer_name: customerName || null,
      service_type: serviceType,
      booking_id: bookingId || null,
      discount_applied: discountApplied / 100, // Convert from cents to euros
      notes: notes || null
    };

    const { data: usage, error: insertError } = await supabase
      .from('discount_code_usages')
      .insert(usageData)
      .select()
      .single();

    if (insertError) {
      console.error('[RedeemDiscountCode] Insert usage error:', insertError);
      return createResponse(500, {
        error: 'Errore nel salvataggio',
        message: insertError.message
      });
    }

    // If single-use, update the discount code status to 'deactivated' after use
    if (discountCode.single_use) {
      await supabase
        .from('discount_codes')
        .update({ status: 'deactivated', updated_at: new Date().toISOString() })
        .eq('id', discountCode.id);
    }

    console.log(`[RedeemDiscountCode] Successfully redeemed ${normalizedCode} for ${discountApplied} cents`);

    return createResponse(200, {
      success: true,
      message: 'Codice sconto riscattato con successo',
      redemption: {
        code: discountCode.code,
        discount_applied: discountApplied,
        service_type: serviceType,
        usage_id: usage.id,
        redeemed_at: usage.used_at
      }
    });

  } catch (error) {
    console.error('[RedeemDiscountCode] Error:', error);
    return createResponse(500, {
      error: 'Errore interno',
      message: error.message
    });
  }
};
