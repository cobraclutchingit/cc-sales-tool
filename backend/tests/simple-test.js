const http = require('http');

// Simple GET request to test the health endpoint
const options = {
  hostname: 'localhost',
  port: 5007,
  path: '/api/health',
  method: 'GET'
};

console.log('Sending request to http://localhost:5007/api/health');

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response data:', data);
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
  console.error('Full error:', e);
});

// Send the request
req.end();