require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCredit() {
    const email = 'dubai.rent7.0srl@gmail.com';
    const amountToAdd = 2000;

    console.log(`Looking up user: ${email}...`);

    // 1. Get User ID by Email (using RPC or admin listUsers if needed, but simple query on auth.users is blocked for service role usually via client, need admin auth API)
    // Actually, service role CAN access auth.users via admin api.

    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error(`User with email ${email} not found.`);
        return;
    }

    console.log(`Found user ID: ${user.id}`);

    // 2. Get Current Balance
    const { data: balanceData, error: balanceError } = await supabase
        .from('user_credit_balance')
        .select('balance')
        .eq('user_id', user.id)
        .single();

    if (balanceError && balanceError.code !== 'PGRST116') { // PGRST116 is "Row not found" (0 balance)
        console.error('Error fetching balance:', balanceError);
        return;
    }

    const currentBalance = balanceData ? balanceData.balance : 0;
    const newBalance = currentBalance + amountToAdd;

    console.log(`Current Balance: €${currentBalance}`);
    console.log(`Adding: €${amountToAdd}`);
    console.log(`New Balance: €${newBalance}`);

    // 3. Update Balance
    const { error: updateError } = await supabase
        .from('user_credit_balance')
        .upsert({
            user_id: user.id,
            balance: newBalance,
            last_updated: new Date().toISOString()
        });

    if (updateError) {
        console.error('Error updating balance:', updateError);
        return;
    }

    // 4. Log Transaction
    const { error: txError } = await supabase
        .from('credit_transactions')
        .insert({
            user_id: user.id,
            transaction_type: 'credit',
            amount: amountToAdd,
            balance_after: newBalance,
            description: `Manual Credit Addition (Node Script)`,
            created_at: new Date().toISOString()
        });

    if (txError) {
        console.warn('Warning: Balance updated but transaction log failed:', txError);
    }

    console.log('SUCCESS! Credit added successfully.');
}

addCredit();
