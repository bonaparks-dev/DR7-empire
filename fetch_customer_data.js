import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const emails = ['andrea.caria@dcrsrls.it', 'desmokelu@gmail.com'];

    console.log('Checking for customers:', emails);

    const { data, error } = await supabase
        .from('customers_extended')
        .select('*')
        .in('email', emails);

    if (error) {
        console.error('Error fetching data:', error);
    } else {
        console.log('--- FOUND RECORDS ---');
        console.log(JSON.stringify(data, null, 2));
        console.log('---------------------');
    }
}

check();
