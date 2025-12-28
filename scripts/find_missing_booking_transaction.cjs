require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findTransaction() {
    console.log('Searching for credit transactions related to 2025-12-30...');

    // Search for transactions where description includes the date
    // Description format: Noleggio CAR_NAME - YYYY-MM-DD to YYYY-MM-DD
    const { data, error } = await supabase
        .from('credit_transactions')
        .select('*, user:user_id(email, raw_user_meta_data)')
        .like('description', '%2025-12-30%')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching transactions:', error);
        return;
    }

    if (data.length === 0) {
        console.log('No transactions found matching criteria.');
    } else {
        console.log(`Found ${data.length} transactions:`);
        data.forEach(tx => {
            console.log('------------------------------------------------');
            console.log(`ID: ${tx.id}`);
            console.log(`User Email: ${tx.user?.email}`);
            console.log(`Amount: ${tx.amount}`);
            console.log(`Description: ${tx.description}`);
            console.log(`Created At: ${tx.created_at}`);
            console.log(`User Metadata:`, tx.user?.raw_user_meta_data);
        });
    }
}

findTransaction();
