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
  try {
    const { data, error } = await supabase
      .from('user_credit_balance')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching credit balance:', error);
      return 0;
    }

    return data?.balance ? parseFloat(data.balance) : 0;
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    return 0;
  }
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
  const { data, error } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_description: description,
    p_reference_id: referenceId || null,
    p_reference_type: referenceType || 'purchase'
  });

  if (error) {
    console.error('Error in addCredits RPC:', error);
    // Fallback: direct insert if RPC fails (e.g. overload ambiguity)
    try {
      const { data: balanceRow } = await supabase
        .from('user_credit_balance')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const currentBalance = balanceRow?.balance ? parseFloat(balanceRow.balance) : 0;
      const newBalance = currentBalance + amount;

      await supabase
        .from('user_credit_balance')
        .upsert({
          user_id: userId,
          balance: newBalance,
          last_updated: new Date().toISOString()
        }, { onConflict: 'user_id' });

      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'credit',
          amount: amount,
          balance_after: newBalance,
          description: description,
          reference_id: referenceId || null,
          reference_type: referenceType || 'purchase'
        });

      console.log(`Credits added via fallback: €${amount} (new balance: €${newBalance})`);
      return { success: true, newBalance };
    } catch (fallbackErr: any) {
      console.error('Fallback credit insert also failed:', fallbackErr);
      return { success: false, newBalance: 0, error: fallbackErr.message };
    }
  }

  const result = data?.[0] || data;
  return {
    success: result?.success ?? false,
    newBalance: result?.new_balance ?? 0,
    error: result?.error_message || undefined
  };
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
