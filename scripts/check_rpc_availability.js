
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRPC() {
    console.log("Checking if 'book_with_credits' RPC exists and is callable...");

    // We'll try to call it with invalid arguments. 
    // If it exists, it should fail with a parameter error or logic error (caught inside).
    // If it doesn't exist, it will fail with "function not found".

    const { data, error } = await supabase.rpc('book_with_credits', {
        p_user_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID
        p_amount_cents: 100,
        p_vehicle_name: 'Test Vehicle',
        p_booking_payload: {}
    });

    if (error) {
        console.log("RPC returned an error (Result):");
        console.log(JSON.stringify(error, null, 2));

        if (error.message && error.message.includes('function') && error.message.includes('does not exist')) {
            console.error("❌ FAILURE: RPC function 'book_with_credits' DOES NOT EXIST.");
        } else {
            console.log("✅ SUCCESS: RPC exists (returned logic/param error as expected).");
        }
    } else {
        console.log("RPC returned data (unexpected for dummy call, but usually means RPC exists):");
        console.log(data);
        console.log("✅ SUCCESS: RPC exists.");
    }
}

checkRPC();
