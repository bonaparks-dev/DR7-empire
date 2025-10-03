// netlify/functions/validate-gift-card.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Creates a standard JSON response with CORS headers.
 */
const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  body: JSON.stringify(body),
});

/**
 * Validates a gift card code and returns its details
 *
 * POST /validate-gift-card
 * Body: { code: "GIFT-XXXXXXXX" }
 *
 * Returns:
 * - 200: Gift card is valid and active
 * - 404: Gift card not found
 * - 400: Gift card expired, redeemed, or invalid
 */
exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
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
    const { code } = JSON.parse(event.body || '{}');

    if (!code) {
      return createResponse(400, {
        error: 'Missing gift card code',
        message: 'Please provide a gift card code'
      });
    }

    // Normalize code (uppercase, remove spaces)
    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');

    // Validate format: GIFT-XXXXXXXX
    const codePattern = /^GIFT-[A-Z2-9]{8}$/;
    if (!codePattern.test(normalizedCode)) {
      return createResponse(400, {
        error: 'Invalid gift card format',
        message: 'Gift card code must be in format: GIFT-XXXXXXXX'
      });
    }

    // Query gift card from database
    const { data: giftCard, error: queryError } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (queryError) {
      console.error('[ValidateGiftCard] Database error:', queryError);
      return createResponse(500, {
        error: 'Database error',
        message: 'Failed to validate gift card'
      });
    }

    if (!giftCard) {
      return createResponse(404, {
        error: 'Gift card not found',
        message: 'This gift card code does not exist'
      });
    }

    // Check if expired
    const now = new Date();
    const expiryDate = new Date(giftCard.expires_at);
    if (expiryDate < now) {
      return createResponse(400, {
        error: 'Gift card expired',
        message: `This gift card expired on ${expiryDate.toLocaleDateString('it-IT')}`,
        giftCard: {
          code: giftCard.code,
          status: 'expired',
          expires_at: giftCard.expires_at
        }
      });
    }

    // Check status
    if (giftCard.status !== 'active') {
      let message = 'This gift card is not active';
      if (giftCard.status === 'redeemed') {
        message = 'This gift card has already been used';
      } else if (giftCard.status === 'cancelled') {
        message = 'This gift card has been cancelled';
      }

      return createResponse(400, {
        error: `Gift card ${giftCard.status}`,
        message,
        giftCard: {
          code: giftCard.code,
          status: giftCard.status,
          redeemed_at: giftCard.redeemed_at
        }
      });
    }

    // Check remaining value
    if (giftCard.remaining_value <= 0) {
      return createResponse(400, {
        error: 'Gift card has no remaining value',
        message: 'This gift card has been fully used',
        giftCard: {
          code: giftCard.code,
          remaining_value: 0
        }
      });
    }

    // Gift card is valid!
    return createResponse(200, {
      valid: true,
      message: 'Gift card is valid and ready to use',
      giftCard: {
        code: giftCard.code,
        initial_value: giftCard.initial_value,
        remaining_value: giftCard.remaining_value,
        currency: giftCard.currency,
        status: giftCard.status,
        issued_at: giftCard.issued_at,
        expires_at: giftCard.expires_at,
        recipient_email: giftCard.recipient_email
      }
    });

  } catch (error) {
    console.error('[ValidateGiftCard] Error:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: error.message
    });
  }
};
