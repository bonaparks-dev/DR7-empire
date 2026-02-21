// netlify/functions/validate-discount-code.js

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
 * Validates a discount code and returns its details
 *
 * POST /validate-discount-code
 * Body: {
 *   code: "DR7-XXXX-XXXX",
 *   serviceType?: "noleggio" | "lavaggio" | "supercar" | "utilitaria",
 *   orderTotal?: number (in cents)
 * }
 *
 * Returns:
 * - 200: Discount code is valid and active
 * - 404: Discount code not found
 * - 400: Discount code expired, deactivated, or invalid for this context
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
    const serviceType = body.serviceType || body.service_type;
    const orderTotal = body.orderTotal || body.order_total;

    if (!code) {
      return createResponse(400, {
        error: 'Missing discount code',
        message: 'Inserisci un codice sconto'
      });
    }

    // Normalize code (uppercase, remove spaces)
    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');

    // Query discount code from database
    const { data: discountCode, error: queryError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (queryError) {
      console.error('[ValidateDiscountCode] Database error:', queryError);
      return createResponse(500, {
        error: 'Database error',
        message: 'Errore durante la validazione del codice'
      });
    }

    if (!discountCode) {
      return createResponse(404, {
        error: 'Codice non trovato',
        message: 'Questo codice sconto non esiste'
      });
    }

    // Check if expired by date
    const now = new Date();
    const validUntil = new Date(discountCode.valid_until);
    const validFrom = new Date(discountCode.valid_from);

    if (validUntil < now) {
      return createResponse(400, {
        error: 'Codice scaduto',
        message: `Questo codice è scaduto il ${validUntil.toLocaleDateString('it-IT')}`,
        discountCode: {
          code: discountCode.code,
          status: 'expired',
          valid_until: discountCode.valid_until
        }
      });
    }

    if (validFrom > now) {
      return createResponse(400, {
        error: 'Codice non ancora valido',
        message: `Questo codice sarà valido dal ${validFrom.toLocaleDateString('it-IT')}`,
        discountCode: {
          code: discountCode.code,
          status: 'not_yet_valid',
          valid_from: discountCode.valid_from
        }
      });
    }

    // Check status
    if (discountCode.status !== 'active') {
      let message = 'Questo codice non è attivo';
      if (discountCode.status === 'deactivated') {
        message = 'Questo codice è stato disattivato';
      } else if (discountCode.status === 'expired') {
        message = 'Questo codice è scaduto';
      }

      return createResponse(400, {
        error: `Codice ${discountCode.status}`,
        message,
        discountCode: {
          code: discountCode.code,
          status: discountCode.status
        }
      });
    }

    // Check if single-use and already used
    if (discountCode.single_use) {
      const { count, error: usageError } = await supabase
        .from('discount_code_usages')
        .select('*', { count: 'exact', head: true })
        .eq('discount_code_id', discountCode.id);

      if (usageError) {
        console.error('[ValidateDiscountCode] Usage check error:', usageError);
      } else if (count > 0) {
        return createResponse(400, {
          error: 'Codice già utilizzato',
          message: 'Questo codice è già stato utilizzato',
          discountCode: {
            code: discountCode.code,
            status: 'already_used'
          }
        });
      }
    }

    // Check service scope if serviceType provided
    if (serviceType && discountCode.scope && Array.isArray(discountCode.scope)) {
      const scope = discountCode.scope;
      const normalizedServiceType = serviceType.toLowerCase().replace(/\s+/g, '_');

      // Rental service hierarchy: 'noleggio' is parent of 'supercar' and 'utilitarie'
      const isRentalService = ['noleggio', 'supercar', 'utilitarie', 'urban-cars', 'corporate-fleet'].includes(normalizedServiceType);
      const isCarWashService = normalizedServiceType.includes('lavag') || normalizedServiceType === 'car_wash' || normalizedServiceType === 'car-wash';

      // Check if scope includes 'tutti' or 'tutti_i_servizi' or the specific service
      const isValidScope = scope.some(s => {
        const normalizedScope = s.toLowerCase().replace(/\s+/g, '_');
        return normalizedScope === 'tutti' ||
               normalizedScope === 'tutti_i_servizi' ||
               normalizedScope === normalizedServiceType ||
               // 'noleggio' scope covers ALL rental types (supercar, utilitarie, etc.)
               (isRentalService && normalizedScope === 'noleggio') ||
               // Specific rental type matches
               (normalizedServiceType.includes('supercar') && normalizedScope === 'supercar') ||
               (normalizedServiceType.includes('utilitari') && normalizedScope === 'utilitarie') ||
               // Car wash matching
               (isCarWashService && normalizedScope === 'lavaggi') ||
               (normalizedServiceType.includes('lavag') && normalizedScope === 'lavaggi');
      });

      if (!isValidScope) {
        return createResponse(400, {
          error: 'Codice non valido per questo servizio',
          message: `Questo codice è valido solo per: ${scope.join(', ')}`,
          discountCode: {
            code: discountCode.code,
            scope: discountCode.scope
          }
        });
      }
    }

    // Check minimum spend if required
    if (discountCode.minimum_spend && orderTotal) {
      const minimumSpendCents = Math.round(discountCode.minimum_spend * 100);
      if (orderTotal < minimumSpendCents) {
        return createResponse(400, {
          error: 'Spesa minima non raggiunta',
          message: `Questo codice richiede una spesa minima di €${discountCode.minimum_spend.toFixed(2)}`,
          discountCode: {
            code: discountCode.code,
            minimum_spend: discountCode.minimum_spend
          }
        });
      }
    }

    // Calculate discount value
    let discountValue = 0;
    let discountDescription = '';

    if (discountCode.value_type === 'fixed') {
      discountValue = Math.round(discountCode.value_amount * 100); // Convert to cents
      discountDescription = `€${discountCode.value_amount.toFixed(2)}`;
    } else if (discountCode.value_type === 'percentage') {
      discountValue = discountCode.value_amount; // percentage value
      discountDescription = `${discountCode.value_amount}%`;
    }

    // Discount code is valid!
    return createResponse(200, {
      valid: true,
      message: 'Codice sconto valido',
      discountCode: {
        id: discountCode.id,
        code: discountCode.code,
        code_type: discountCode.code_type,
        value_type: discountCode.value_type,
        value_amount: discountCode.value_amount,
        discount_value: discountValue,
        discount_description: discountDescription,
        scope: discountCode.scope,
        minimum_spend: discountCode.minimum_spend,
        valid_from: discountCode.valid_from,
        valid_until: discountCode.valid_until,
        single_use: discountCode.single_use,
        message: discountCode.message,
        usage_conditions: discountCode.usage_conditions,
        // Birthday code fields
        customer_email: discountCode.customer_email || null,
        customer_phone: discountCode.customer_phone || null,
        rental_credit: discountCode.rental_credit || null,
        rental_used: discountCode.rental_used || false,
        car_wash_discount: discountCode.car_wash_discount || null,
        car_wash_used: discountCode.car_wash_used || false
      }
    });

  } catch (error) {
    console.error('[ValidateDiscountCode] Error:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: error.message
    });
  }
};
