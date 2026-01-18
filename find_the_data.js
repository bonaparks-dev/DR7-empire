import { createClient } from '@supabase/supabase-js';

// Using the provided Anon key. If RLS is set up correctly for 'public' read or if we are lucky, we might see it.
// If not, we really are blocked without the Service Key.
const supabaseUrl = 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findData() {
    console.log("Searching for data for: andrea.caria@dcrsrls.it and desmokelu@gmail.com...");

    // IDs from the user's provided JSON
    const userIds = [
        'e2145a54-a28a-45dd-a7e8-d1706d477dd1', // andrea.caria
        '57dcfa37-4f7d-4119-9fc0-cdf30a873b11'  // desmokelu
    ];

    const { data, error } = await supabase
        .from('customers_extended')
        .select('*')
        .in('user_id', userIds);

    if (error) {
        console.error("Error accessing Supabase:", error.message);
        if (error.message.includes("PGSQL_ERROR")) {
            console.log("NOTE: This likely means Row Level Security (RLS) is blocking access because we are using an Anon key.");
        }
    } else if (!data || data.length === 0) {
        console.log("No records returned. RLS might be hiding them, or they truly don't exist.");
    } else {
        console.log("SUCCESS! Found the following data:");
        console.log(JSON.stringify(data, null, 2));
    }
}

findData();
