import { supabase } from '../supabaseClient';

export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  description: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

export interface UserCreditBalance {
  user_id: string;
  balance: number;
  last_updated: string;
}

/**
 * Get user's current credit balance
 */
export async function getUserCreditBalance(userId: string): Promise<number> {
  const fetchBalance = async (retryCount = 0): Promise<number> => {
    try {
      // Get auth token for authenticated request
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Fetch balance via Netlify Function instead of direct Supabase REST
      const response = await fetch(`/.netlify/functions/getCreditBalance?user_id=${userId}`, { headers });

      if (!response.ok) {
        // If error and we haven't retried too many times, retry
        if (retryCount < 2) {
          console.warn(`Got ${response.status} error for balance check, retrying... (${retryCount + 1})`);
          await new Promise(resolve => setTimeout(resolve, 500));
          return fetchBalance(retryCount + 1);
        }

        // After retries, return 0 as fallback
        console.warn('Failed to fetch credit balance after retries, returning 0');
        return 0;
      }

      const data = await response.json();
      return data.balance || 0;
    } catch (error) {
      console.error('Error fetching credit balance:', error);
      return 0;
    }
  };

  return fetchBalance();
}

/**
 * Add credits to user's balance
 */
export async function addCredits(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string,
  referenceType?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    // Get current balance
    const currentBalance = await getUserCreditBalance(userId);
    const newBalance = currentBalance + amount;

    // Update or insert balance
    const { error: balanceError } = await supabase
      .from('user_credit_balance')
      .upsert({
        user_id: userId,
        balance: newBalance,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (balanceError) throw balanceError;

    // Record transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'credit',
        amount: amount,
        balance_after: newBalance,
        description: description,
        reference_id: referenceId,
        reference_type: referenceType,
        created_at: new Date().toISOString()
      });

    if (transactionError) throw transactionError;

    return { success: true, newBalance };
  } catch (error: any) {
    console.error('Error adding credits:', error);
    return { success: false, newBalance: 0, error: error.message };
  }
}

/**
 * Deduct credits from user's balance (atomic via RPC to prevent double-spending)
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string,
  transactionType: string = 'booking_payment'
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_description: description,
    p_reference_id: referenceId || null,
    p_transaction_type: transactionType
  });

  if (error) {
    console.error('Error in deductCredits RPC:', error);
    return { success: false, newBalance: 0, error: error.message };
  }

  const result = data?.[0] || data;
  return {
    success: result?.success ?? false,
    newBalance: result?.new_balance ?? 0,
    error: result?.error_message || undefined
  };
}

/**
 * Get user's credit transaction history
 */
export async function getCreditTransactions(
  userId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching credit transactions:', error);
    return [];
  }
}

/**
 * Check if user has sufficient balance for a purchase
 */
export async function hasSufficientBalance(
  userId: string,
  requiredAmount: number
): Promise<boolean> {
  const balance = await getUserCreditBalance(userId);
  return balance >= requiredAmount;
}
