
const supabaseUrl = 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU';

async function checkRPC() {
    console.log("Checking if 'book_with_credits' RPC exists via REST API...");

    const url = `${supabaseUrl}/rest/v1/rpc/book_with_credits`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            },
            // Sending invalid params to trigger a specific error if function exists
            body: JSON.stringify({
                p_user_id: '00000000-0000-0000-0000-000000000000',
                p_amount_cents: 100,
                p_vehicle_name: 'Test Vehicle',
                p_booking_payload: {}
            })
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text}`);

        if (response.status === 404) {
            console.error("❌ FAILURE: RPC function 'book_with_credits' NOT FOUND (404).");
        } else if (response.status === 500 || response.status === 400) {
            if (text.includes("function") && text.includes("does not exist")) {
                console.error("❌ FAILURE: RPC function does not exist (according to error message).");
            } else {
                console.log("✅ SUCCESS: RPC exists (returned logic/param error as expected).");
            }
        } else if (response.status === 200) {
            console.log("✅ SUCCESS: RPC exists and returned success (unexpected for dummy data but confirms existence).");
        } else {
            console.log(`⚠️ Unknown status: ${response.status}. Check response details.`);
        }

    } catch (err) {
        console.error("Error making request:", err);
    }
}

checkRPC();
