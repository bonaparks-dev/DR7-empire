// netlify/functions/redeem-gift-card.js

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
 * Redeems a gift card by applying it to a booking
 *
 * POST /redeem-gift-card
 * Body: {
 *   code: "GIFT-XXXXXXXX",
 *   bookingId: "uuid",
 *   amountToUse: 2500 (optional, defaults to full value)
 * }
 *
 * Returns:
 * - 200: Gift card redeemed successfully
 * - 404: Gift card not found
 * - 400: Invalid or already redeemed
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
    const { code, bookingId, amountToUse } = JSON.parse(event.body || '{}');

    if (!code) {
      return createResponse(400, {
        error: 'Missing gift card code',
        message: 'Please provide a gift card code'
      });
    }

    if (!bookingId) {
      return createResponse(400, {
        error: 'Missing booking ID',
        message: 'Please provide a booking ID for redemption'
      });
    }

    // Normalize code
    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');

    // Query gift card
    const { data: giftCard, error: queryError } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (queryError) {
      console.error('[RedeemGiftCard] Database error:', queryError);
      return createResponse(500, {
        error: 'Database error',
        message: 'Failed to redeem gift card'
      });
    }

    if (!giftCard) {
      return createResponse(404, {
        error: 'Gift card not found',
        message: 'This gift card code does not exist'
      });
    }

    // Validation checks
    const now = new Date();
    const expiryDate = new Date(giftCard.expires_at);

    if (expiryDate < now) {
      return createResponse(400, {
        error: 'Gift card expired',
        message: `This gift card expired on ${expiryDate.toLocaleDateString('it-IT')}`
      });
    }

    if (giftCard.status !== 'active') {
      return createResponse(400, {
        error: `Gift card ${giftCard.status}`,
        message: `This gift card cannot be redeemed (status: ${giftCard.status})`
      });
    }

    if (giftCard.remaining_value <= 0) {
      return createResponse(400, {
        error: 'No remaining value',
        message: 'This gift card has been fully used'
      });
    }

    // Calculate redemption amount
    const redemptionAmount = amountToUse
      ? Math.min(amountToUse, giftCard.remaining_value)
      : giftCard.remaining_value;

    const newRemainingValue = giftCard.remaining_value - redemptionAmount;
    const newStatus = newRemainingValue === 0 ? 'redeemed' : 'active';

    // Update gift card
    const updateData = {
      remaining_value: newRemainingValue,
      status: newStatus,
    };

    // If fully redeemed, set redemption details
    if (newStatus === 'redeemed') {
      updateData.redeemed_at = new Date().toISOString();
      updateData.redeemed_in_booking_id = bookingId;
    }

    const { data: updatedGiftCard, error: updateError } = await supabase
      .from('gift_cards')
      .update(updateData)
      .eq('id', giftCard.id)
      .select()
      .single();

    if (updateError) {
      console.error('[RedeemGiftCard] Update error:', updateError);
      return createResponse(500, {
        error: 'Failed to redeem gift card',
        message: updateError.message
      });
    }

    console.log(`[RedeemGiftCard] Successfully redeemed ${redemptionAmount} cents from ${normalizedCode}`);

    return createResponse(200, {
      success: true,
      message: 'Gift card redeemed successfully',
      redemption: {
        code: updatedGiftCard.code,
        amount_redeemed: redemptionAmount,
        remaining_value: updatedGiftCard.remaining_value,
        status: updatedGiftCard.status,
        redeemed_at: updatedGiftCard.redeemed_at,
        booking_id: bookingId
      }
    });

  } catch (error) {
    console.error('[RedeemGiftCard] Error:', error);
    return createResponse(500, {
      error: 'Internal server error',
      message: error.message
    });
  }
};
