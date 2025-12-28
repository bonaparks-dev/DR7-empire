const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findTransaction() {
    console.log('Searching for credit transactions containing "C 63"...');

    const { data, error } = await supabase
        .from('credit_transactions')
        .select('*, user:user_id(email, raw_user_meta_data)')
        .ilike('description', '%C 63%') // Case insensitive
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} transactions.`);
    data.forEach(tx => {
        console.log(`\n--- Transaction ${tx.id} ---`);
        console.log(`User: ${tx.user?.email}`);
        console.log(`Time: ${tx.created_at}`);
        console.log(`Amount: ${tx.amount}`);
        console.log(`Desc: ${tx.description}`);
    });
}

findTransaction();
