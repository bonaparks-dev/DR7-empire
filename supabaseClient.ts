import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdreHJyZ3h5aXJhc2EiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyNzc4ODM4MywiZXhwIjoyMDQzMzY0MzgzfQ.hQhVhgSA6ZxR1rKMQGWo2EQxON1wHBl9r7q7YyZvTr8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);