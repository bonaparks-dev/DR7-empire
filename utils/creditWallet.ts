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
      .single();

    if (error) {
      // If user doesn't have a balance record yet, return 0
      if (error.code === 'PGRST116') {
        return 0;
      }
      throw error;
    }

    return data?.balance || 0;
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
 * Deduct credits from user's balance
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string,
  serviceType?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    // Get current balance
    const currentBalance = await getUserCreditBalance(userId);

    // Check if user has enough balance
    if (currentBalance < amount) {
      return {
        success: false,
        newBalance: currentBalance,
        error: 'Credito insufficiente'
      };
    }

    const newBalance = currentBalance - amount;

    // Update balance
    const { error: balanceError } = await supabase
      .from('user_credit_balance')
      .update({
        balance: newBalance,
        last_updated: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (balanceError) throw balanceError;

    // Record transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'debit',
        amount: amount,
        balance_after: newBalance,
        description: description,
        reference_id: referenceId,
        service_type: serviceType,
        created_at: new Date().toISOString()
      });

    if (transactionError) throw transactionError;

    return { success: true, newBalance };
  } catch (error: any) {
    console.error('Error deducting credits:', error);
    return { success: false, newBalance: 0, error: error.message };
  }
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
