// 🚨 QUICK FIX SCRIPT - DR7 EMPIRE
// Exécuter ce script pour tester la connexion Supabase

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU';

console.log('🧪 TESTING DR7 EMPIRE SUPABASE CONNECTION...\n');

async function testConnection() {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
        console.log('✅ Supabase client created successfully');
        
        // Test 1: Basic connection
        console.log('\n📡 Test 1: Basic Connection Test');
        const { data: pingData, error: pingError } = await supabase
            .from('vehicles')
            .select('count', { count: 'exact', head: true });
        
        if (pingError) {
            console.error('❌ Connection failed:', pingError);
            return false;
        }
        console.log(`✅ Connected! Total vehicles: ${pingData?.length || 'Unknown'}`);

        // Test 2: Fetch urban cars (Chrome issue)
        console.log('\n🚗 Test 2: Urban Cars (Chrome Issue)');
        const { data: urbanCars, error: urbanError } = await supabase
            .from('vehicles')
            .select('id, display_name, category, status')
            .eq('category', 'urban')
            .neq('status', 'retired');
            
        if (urbanError) {
            console.error('❌ Urban cars fetch failed:', urbanError);
            console.log('   → This explains why Chrome shows no urban cars!');
        } else {
            console.log(`✅ Urban cars found: ${urbanCars.length}`);
            urbanCars.forEach(car => {
                console.log(`   - ${car.display_name} (${car.status})`);
            });
        }

        // Test 3: Fetch all vehicles (Safari booking issue)  
        console.log('\n🏎️ Test 3: All Vehicles (Safari Booking)');
        const { data: allCars, error: allError } = await supabase
            .from('vehicles')
            .select('id, display_name, category, status')
            .neq('status', 'retired')
            .limit(5);
            
        if (allError) {
            console.error('❌ All vehicles fetch failed:', allError);
            console.log('   → This explains Safari black page on booking!');
        } else {
            console.log(`✅ Sample vehicles found: ${allCars.length}`);
            allCars.forEach(car => {
                console.log(`   - ${car.display_name} (${car.category})`);
            });
        }

        // Test 4: Check RLS Policies
        console.log('\n🔒 Test 4: RLS Policies Check');
        try {
            const { data: policies, error: policyError } = await supabase.rpc('get_vehicle_policies');
            if (policyError) {
                console.log('⚠️ Cannot check RLS policies directly (expected)');
                console.log('   → Manual check required in Supabase Dashboard');
            }
        } catch (e) {
            console.log('⚠️ RLS policy check requires manual verification');
        }

        return true;
    } catch (error) {
        console.error('💥 Fatal error:', error);
        return false;
    }
}

console.log('='.repeat(60));
console.log('🚨 DR7 EMPIRE - CRITICAL DIAGNOSIS COMPLETE');
console.log('='.repeat(60));

testConnection().then(success => {
    if (success) {
        console.log('\n✅ SUPABASE CONNECTION: OK');
        console.log('   → Issue might be in Netlify Environment Variables');
        console.log('   → Check: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify');
    } else {
        console.log('\n❌ SUPABASE CONNECTION: FAILED');
        console.log('   → Database might be down or RLS policies blocking access');
        console.log('   → Check Supabase Dashboard immediately');
    }
    
    console.log('\n📋 NEXT ACTIONS:');
    console.log('1. Run this test in browser console');  
    console.log('2. Fix Netlify environment variables');
    console.log('3. Check RLS policies in Supabase SQL Editor');
    console.log('4. Redeploy the site');
});