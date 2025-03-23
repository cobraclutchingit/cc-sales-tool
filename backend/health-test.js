const axios = require('axios');

async function testHealthEndpoint() {
  try {
    console.log('Testing API Health Endpoint...');
    const response = await axios.get('http://localhost:5007/api/health');
    
    console.log('Health Check Response:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
  } catch (error) {
    console.error('Error in Health Check test:', error.message);
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    }
  }
}

testHealthEndpoint();