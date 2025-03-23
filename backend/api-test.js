const axios = require('axios');

const API_URL = 'http://localhost:5007/api';

// Test the health endpoint
async function testHealth() {
  try {
    console.log('Testing API health endpoint...');
    const response = await axios.get(`${API_URL}/health`);
    console.log('Health Check Response:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    return true;
  } catch (error) {
    console.error('Error in Health Check test:', error.message);
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    }
    return false;
  }
}

// Test the profile analysis endpoint
async function testProfileAnalysis() {
  try {
    console.log('\nTesting Profile Analysis API with a valid LinkedIn URL...');
    
    const testUrl = 'https://www.linkedin.com/in/satyanadella/';
    console.log(`Using test URL: ${testUrl}`);
    
    const response = await axios.post(`${API_URL}/profile/analyze`, {
      profileUrl: testUrl,
      outputFormat: 'email'
    });
    
    console.log('Profile Analysis Response:');
    console.log('Status:', response.status);
    console.log('Response status:', response.data.status);
    
    if (response.data.data && response.data.data.profileData) {
      console.log('Profile Name:', response.data.data.profileData.name);
      console.log('Profile Title:', response.data.data.profileData.title);
      console.log('Content Length:', response.data.data.content ? response.data.data.content.length : 'No content');
    } else {
      console.log('Unexpected response structure:', JSON.stringify(response.data, null, 2));
    }
    
    return true;
  } catch (error) {
    console.error('Error in Profile Analysis test:', error.message);
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Server might be down or unreachable.');
    } else {
      console.error('Error setting up request:', error.message);
    }
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('=== API TEST SCRIPT ===');
  
  const healthCheck = await testHealth();
  if (!healthCheck) {
    console.error('Health check failed. Stopping tests.');
    return;
  }
  
  await testProfileAnalysis();
  
  console.log('\n=== TESTS COMPLETE ===');
}

runTests();