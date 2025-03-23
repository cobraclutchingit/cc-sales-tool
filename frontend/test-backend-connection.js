const axios = require('axios');

// Test direct connection to backend
async function testDirectConnection() {
  try {
    console.log('Testing direct connection to backend health endpoint...');
    const response = await axios.get('http://localhost:5007/api/health');
    console.log('✅ Direct connection successful!');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Direct connection failed:', error.message);
    return false;
  }
}

// Test profile analysis endpoint
async function testProfileAnalysis() {
  try {
    console.log('\nTesting profile analysis endpoint...');
    const response = await axios.post('http://localhost:5007/api/profile/analyze', {
      profileUrl: 'https://www.linkedin.com/in/example-profile',
      outputFormat: 'email'
    });
    console.log('✅ Profile analysis successful!');
    console.log('Generated content:', response.data.data.content.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Profile analysis failed:', error.message);
    return false;
  }
}

// Test company analysis endpoint
async function testCompanyAnalysis() {
  try {
    console.log('\nTesting company analysis endpoint...');
    const response = await axios.post('http://localhost:5007/api/company/analyze', {
      companyUrl: 'https://www.linkedin.com/company/example-company',
      outputFormat: 'email'
    });
    console.log('✅ Company analysis successful!');
    console.log('Generated content:', response.data.data.content.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Company analysis failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('=== TESTING BACKEND CONNECTIVITY ===');
  let successCount = 0;
  let totalTests = 3;
  
  if (await testDirectConnection()) successCount++;
  if (await testProfileAnalysis()) successCount++;
  if (await testCompanyAnalysis()) successCount++;
  
  console.log('\n=== TEST SUMMARY ===');
  console.log(`${successCount}/${totalTests} tests passed`);
  
  if (successCount === totalTests) {
    console.log('✅ All backend connectivity tests passed! Frontend should be able to communicate with the backend.');
  } else {
    console.log('⚠️ Some tests failed. There may be connectivity issues between the frontend and backend.');
  }
}

runTests();