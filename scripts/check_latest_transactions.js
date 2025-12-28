
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransactions() {
    console.log('Checking recent transactions...');

    const { data: transactions, error: txError } = await supabase
        .from('user_credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (txError) {
        console.error('Error fetching transactions:', txError);
        return;
    }

    if (!transactions || transactions.length === 0) {
        console.log('No recent transactions found.');
        return;
    }

    console.log(`Found ${transactions.length} recent transactions.`);

    for (const tx of transactions) {
        console.log(`\nTransaction ID: ${tx.id}`);
        console.log(`User ID: ${tx.user_id}`);
        console.log(`Amount: ${tx.amount}`);
        console.log(`Date: ${tx.created_at}`);
        console.log(`Description: ${tx.description}`);

        // Check for booking linked to this user around this time (+/- 2 minutes)
        const txDate = new Date(tx.created_at);
        const minDate = new Date(txDate.getTime() - 2 * 60000).toISOString();
        const maxDate = new Date(txDate.getTime() + 2 * 60000).toISOString();

        const { data: bookings, error: bError } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', tx.user_id)
            .gt('created_at', minDate)
            .lt('created_at', maxDate);

        if (bError) {
            console.error('Error checking bookings:', bError);
        } else if (bookings && bookings.length > 0) {
            console.log('✅ MATCHING BOOKING FOUND:');
            bookings.forEach(b => {
                console.log(`   - Booking ID: ${b.id}`);
                console.log(`   - Status: ${b.status}`);
                console.log(`   - Vehicle: ${b.vehicle_id}`);
                console.log(`   - Dates: ${b.pickup_date} to ${b.return_date}`);
            });
        } else {
            console.log('❌ NO MATCHING BOOKING FOUND nearby (atomic failure suspected if recent).');

            // Check if there are ANY bookings for this user later than the transaction
            const { data: laterBookings } = await supabase
                .from('bookings')
                .select('id, created_at')
                .eq('user_id', tx.user_id)
                .gt('created_at', tx.created_at)
                .limit(1);

            if (laterBookings && laterBookings.length > 0) {
                console.log(`   (Found a booking created AFTER this transaction at ${laterBookings[0].created_at}, ID: ${laterBookings[0].id})`);
            }
        }
    }
}

checkTransactions();
