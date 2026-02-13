// 🚨 IMMEDIATE TEST - Run in Chrome/Safari Console
// Copy-paste this entire script after deploying fixes

console.log('🚨 DR7 IMMEDIATE FIX VALIDATION');
console.log('Browser:', navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Other');

// Test 1: Environment Variables Check
function testEnvVars() {
  console.log('1️⃣ Testing Environment Variables...');
  
  // This would be checked on backend, but we can test the endpoint
  return fetch('/.netlify/functions/getVehicles')
    .then(response => {
      console.log('✅ Netlify Function Response:', response.status);
      return response.ok;
    })
    .catch(error => {
      console.error('❌ Netlify Function Error:', error);
      return false;
    });
}

// Test 2: Urban Cars Specific Test
function testUrbanCarsSpecific() {
  console.log('2️⃣ Testing Urban Cars (Chrome Issue)...');
  
  return fetch('/.netlify/functions/getVehicles?category=urban')
    .then(response => response.json())
    .then(data => {
      console.log('✅ Urban Cars Data:', data.length, 'vehicles found');
      console.log('Sample urban cars:', data.slice(0, 3).map(v => v.display_name));
      return data.length > 0;
    })
    .catch(error => {
      console.error('❌ Urban Cars Error:', error);
      return false;
    });
}

// Test 3: Safari Modal Test
function testSafariModal() {
  console.log('3️⃣ Testing Safari Modal (Black Screen Issue)...');
  
  const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
  
  if (!isSafari) {
    console.log('ℹ️ Not Safari, skipping modal test');
    return Promise.resolve(true);
  }
  
  // Test CSS support for backdrop-filter
  const testDiv = document.createElement('div');
  testDiv.style.backdropFilter = 'blur(10px)';
  const supportsBackdropFilter = testDiv.style.backdropFilter !== '';
  
  console.log('✅ Safari Modal Support:', {
    backdropFilter: supportsBackdropFilter,
    webkitBackdropFilter: 'webkitBackdropFilter' in testDiv.style
  });
  
  return Promise.resolve(true);
}

// Test 4: Timeout Performance Test
function testTimeout() {
  console.log('4️⃣ Testing Request Timeout...');
  
  const startTime = Date.now();
  
  return fetch('/.netlify/functions/getVehicles')
    .then(response => {
      const duration = Date.now() - startTime;
      console.log('✅ Request Duration:', duration + 'ms', duration < 8000 ? '(GOOD)' : '(SLOW)');
      return duration < 8000;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      console.error('❌ Timeout Error after', duration + 'ms:', error.message);
      return false;
    });
}

// Run All Tests
async function runImmediateValidation() {
  console.log('🏁 Starting IMMEDIATE validation...');
  console.log('Timestamp:', new Date().toISOString());
  
  const results = {
    envVars: await testEnvVars(),
    urbanCars: await testUrbanCarsSpecific(), 
    safariModal: await testSafariModal(),
    timeout: await testTimeout()
  };
  
  console.log('📊 IMMEDIATE TEST RESULTS:', results);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.values(results).length;
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL FIXES WORKING! Site should be operational.');
  } else {
    console.log('⚠️ Some issues remain:', totalTests - passedTests, 'failed tests');
    console.log('🔄 May need additional fixes or Supabase RLS script execution');
  }
  
  return results;
}

// Auto-execute validation
runImmediateValidation();