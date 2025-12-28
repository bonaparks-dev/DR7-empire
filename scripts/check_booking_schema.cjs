try {
    // Try loading from project root
    require('dotenv').config();
} catch (e) {
    // If dotnev fails, it might be fine if vars are in environment, continue
}

const { createClient } = require('@supabase/supabase-js');

// Fallbacks if not set in environment or .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials. Ensure .env is loaded or VITE_SUPABASE_URL/ANON_KEY are set.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking bookings table schema...');
    const { data, error } = await supabase.from('bookings').select('*').limit(1);
    if (error) {
        console.error('Error fetching row:', error);
    } else if (data && data.length > 0) {
        console.log('Columns found in a row:', Object.keys(data[0]));
    } else {
        // If no data, trying to insert/upsert a dummy check or select columns specifically
        console.log('No rows found. Probing specific columns...');
        const potentialColumns = ['vehicle_id', 'vehicleId', 'plate', 'targa', 'item_id', 'itemId'];

        for (const col of potentialColumns) {
            const { error } = await supabase.from('bookings').select(col).limit(1);
            // If error is "column does not exist", we know it's missing.
            // If error is empty (just no rows), the column exists.
            if (error && error.message.includes('does not exist')) {
                console.log(`Column '${col}': MISSING (${error.message})`);
            } else {
                console.log(`Column '${col}': EXISTS (or at least valid in select)`);
            }
        }
    }
}

checkSchema();
