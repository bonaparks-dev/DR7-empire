// 🚨 CRITICAL VALIDATION - Run in browser console

console.log('🚨 DR7 Empire Validation Script');

// Test 1: Check Supabase Connection
async function testSupabaseConnection() {
  try {
    const response = await fetch('/.netlify/functions/getVehicles');
    const data = await response.json();
    console.log('✅ Supabase Connection:', response.ok ? 'SUCCESS' : 'FAILED', data?.length || 0, 'vehicles');
    return response.ok;
  } catch (error) {
    console.error('❌ Supabase Connection ERROR:', error);
    return false;
  }
}

// Test 2: Check Urban Cars Loading
async function testUrbanCars() {
  try {
    const response = await fetch('/.netlify/functions/getVehicles?category=urban');
    const data = await response.json();
    console.log('✅ Urban Cars:', response.ok ? 'SUCCESS' : 'FAILED', data?.length || 0, 'vehicles');
    return response.ok && data?.length > 0;
  } catch (error) {
    console.error('❌ Urban Cars ERROR:', error);
    return false;
  }
}

// Test 3: Check Safari Booking Modal
function testSafariBooking() {
  const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
  if (isSafari) {
    console.log('🔍 Safari detected - Testing modal compatibility');
    const modal = document.querySelector('[class*="fixed inset-0"]');
    if (modal) {
      const styles = getComputedStyle(modal);
      console.log('✅ Safari Modal Styles:', {
        background: styles.background,
        backdropFilter: styles.backdropFilter,
        zIndex: styles.zIndex
      });
    }
  }
  return true;
}

// Run all tests
async function runValidation() {
  console.log('🏁 Starting validation tests...');
  
  const results = {
    supabase: await testSupabaseConnection(),
    urbanCars: await testUrbanCars(),
    safari: testSafariBooking()
  };
  
  const allPassed = Object.values(results).every(Boolean);
  
  console.log('📊 VALIDATION RESULTS:', results);
  console.log(allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED');
  
  return results;
}

// Auto-run validation
runValidation();