/**
 * Gift Card Utility Functions
 *
 * Handles gift card code generation, validation, and redemption logic
 * for the commercial operation system.
 */

/**
 * Generates a random 8-character alphanumeric code (uppercase)
 * Format: GIFT-XXXXXXXX
 */
export function generateGiftCardCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars (I, O, 0, 1)
  let code = '';

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  return `GIFT-${code}`;
}

/**
 * Creates a unique gift card code by checking against existing codes
 * Retries up to 10 times if collision occurs
 */
export async function createUniqueGiftCardCode(
  supabase: any,
  maxAttempts: number = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateGiftCardCode();

    // Check if code already exists
    const { data, error } = await supabase
      .from('gift_cards')
      .select('code')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('[GiftCard] Error checking code uniqueness:', error);
      continue;
    }

    // Code is unique if no existing card found
    if (!data) {
      return code;
    }
  }

  throw new Error('Failed to generate unique gift card code after maximum attempts');
}

/**
 * Validates a gift card code format
 */
export function isValidGiftCardFormat(code: string): boolean {
  // Format: GIFT-XXXXXXXX (12 chars total)
  const pattern = /^GIFT-[A-Z2-9]{8}$/;
  return pattern.test(code);
}

/**
 * Calculates expiration date (24 months from issue date)
 */
export function calculateGiftCardExpiry(issueDate: Date = new Date()): Date {
  const expiryDate = new Date(issueDate);
  expiryDate.setMonth(expiryDate.getMonth() + 24);
  return expiryDate;
}

/**
 * Checks if a gift card is currently valid for redemption
 */
export function isGiftCardRedeemable(giftCard: {
  status: string;
  expires_at: string;
  remaining_value: number;
}): { valid: boolean; reason?: string } {
  // Check status
  if (giftCard.status !== 'active') {
    return { valid: false, reason: 'gift_card_not_active' };
  }

  // Check expiration
  const now = new Date();
  const expiryDate = new Date(giftCard.expires_at);
  if (expiryDate < now) {
    return { valid: false, reason: 'gift_card_expired' };
  }

  // Check remaining value
  if (giftCard.remaining_value <= 0) {
    return { valid: false, reason: 'gift_card_no_value' };
  }

  return { valid: true };
}

/**
 * Formats gift card code for display (adds hyphens)
 * Example: GIFTABCD1234 -> GIFT-ABCD-1234
 */
export function formatGiftCardCode(code: string): string {
  if (!code) return '';

  // Remove any existing hyphens
  const cleanCode = code.replace(/-/g, '');

  // If it starts with GIFT, format as GIFT-XXXXXXXX
  if (cleanCode.startsWith('GIFT')) {
    return `${cleanCode.slice(0, 4)}-${cleanCode.slice(4)}`;
  }

  return code;
}

/**
 * Normalizes gift card code input (removes spaces, converts to uppercase)
 */
export function normalizeGiftCardCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Gift card value in cents (€25)
 */
export const GIFT_CARD_VALUE = 2500;

/**
 * Gift card validity period in months
 */
export const GIFT_CARD_VALIDITY_MONTHS = 24;

/**
 * Minimum purchase amount to receive gift card (1 ticket = €20)
 */
export const MIN_PURCHASE_FOR_GIFT_CARD = 2000;

/**
 * Gift card activation date
 */
export const GIFT_CARD_START_DATE = new Date('2025-12-26T00:00:00Z');

/**
 * Checks if gift card system is active
 */
export function isGiftCardSystemActive(): boolean {
  const now = new Date();
  return now >= GIFT_CARD_START_DATE;
}

/**
 * Checks if a purchase qualifies for a gift card
 * Must be at least 1 ticket (€20) and system must be active
 */
export function qualifiesForGiftCard(
  ticketQuantity: number,
  purchaseDate: Date = new Date()
): boolean {
  // Must be at least 1 ticket
  if (ticketQuantity < 1) return false;

  // System must be active
  if (purchaseDate < GIFT_CARD_START_DATE) return false;

  return true;
}
