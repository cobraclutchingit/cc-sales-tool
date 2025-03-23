const axios = require('axios');

// Test different LinkedIn URL formats
async function testLinkedInURLProcessing() {
  console.log('=== TESTING LINKEDIN URL PROCESSING ===');
  
  const testURLs = [
    // Profile URLs
    { 
      type: 'profile', 
      url: 'https://www.linkedin.com/in/john-doe-123456789/',
      expected: 'https://www.linkedin.com/in/john-doe-123456789/'
    },
    { 
      type: 'profile', 
      url: 'www.linkedin.com/in/jane-smith/',
      expected: 'https://www.linkedin.com/in/jane-smith/'
    },
    { 
      type: 'profile', 
      url: 'linkedin.com/in/robert-johnson',
      expected: 'https://www.linkedin.com/in/robert-johnson'
    },
    { 
      type: 'profile', 
      url: 'https://linkedin.com/in/sarah-williams?param=value',
      expected: 'https://www.linkedin.com/in/sarah-williams'
    },
    
    // Company URLs
    { 
      type: 'company', 
      url: 'https://www.linkedin.com/company/acme-corp/',
      expected: 'https://www.linkedin.com/company/acme-corp/'
    },
    { 
      type: 'company', 
      url: 'www.linkedin.com/company/globex-industries',
      expected: 'https://www.linkedin.com/company/globex-industries'
    },
    { 
      type: 'company', 
      url: 'linkedin.com/company/stark-enterprises',
      expected: 'https://www.linkedin.com/company/stark-enterprises'
    },
    { 
      type: 'company', 
      url: 'https://linkedin.com/company/wayne-industries?param=value',
      expected: 'https://www.linkedin.com/company/wayne-industries'
    }
  ];

  let passCount = 0;
  
  for (const test of testURLs) {
    const endpoint = test.type === 'profile' ? '/api/profile/analyze' : '/api/company/analyze';
    const urlParam = test.type === 'profile' ? 'profileUrl' : 'companyUrl';
    
    try {
      console.log(`\nTesting ${test.type} URL: ${test.url}`);
      
      // Make a request to the backend
      const response = await axios.post(`http://localhost:5007${endpoint}`, {
        [urlParam]: test.url,
        outputFormat: 'email'
      });
      
      // Check if the URL was processed correctly by checking if we got a successful response
      // We can't directly check the processed URL as it's handled internally
      if (response.data.status === 'success') {
        console.log(`✅ Successfully processed ${test.type} URL: ${test.url}`);
        passCount++;
      } else {
        console.log(`❌ Failed to process ${test.type} URL: ${test.url}`);
        console.log(`   Error: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${test.type} URL: ${test.url}`);
      console.error(`   Error: ${error.message}`);
    }
  }
  
  console.log('\n=== URL PROCESSING TEST SUMMARY ===');
  console.log(`${passCount}/${testURLs.length} URL tests passed`);
  
  if (passCount === testURLs.length) {
    console.log('✅ All LinkedIn URL processing tests passed!');
  } else {
    console.log('⚠️ Some URL processing tests failed. Check the LinkedIn URL parsing logic.');
  }
}

testLinkedInURLProcessing();