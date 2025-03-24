const axios = require('axios');

// Test Profile Analysis
async function testProfileAnalysis() {
  try {
    console.log('Testing Profile Analysis API...');
    const response = await axios.post('http://localhost:5007/api/profile/analyze', {
      profileUrl: 'https://www.linkedin.com/in/satyanadella/',
      outputFormat: 'email'
    });
    
    console.log('Profile Analysis Response:');
    console.log('Status:', response.status);
    console.log('Profile Name:', response.data.data.profileData.name);
    console.log('Profile Title:', response.data.data.profileData.title);
    console.log('Profile Company:', response.data.data.profileData.company);
    console.log('Generated Content Length:', response.data.data.content.length);
    console.log('First 200 chars of content:', response.data.data.content.substring(0, 200));
    console.log('\n');
  } catch (error) {
    console.error('Error in Profile Analysis test:', error.message);
    if (error.response) {
      console.error('Error Response:', error.response.data);
    }
  }
}

// Test Company Analysis
async function testCompanyAnalysis() {
  try {
    console.log('Testing Company Analysis API...');
    const response = await axios.post('http://localhost:5007/api/company/analyze', {
      companyUrl: 'https://www.linkedin.com/company/microsoft/',
      outputFormat: 'email'
    });
    
    console.log('Company Analysis Response:');
    console.log('Status:', response.status);
    console.log('Company Name:', response.data.data.companyData.name);
    console.log('Company Industry:', response.data.data.companyData.industry);
    console.log('Decision Makers Count:', response.data.data.decisionMakers.length);
    console.log('Generated Content Length:', response.data.data.content.length);
    console.log('First 200 chars of content:', response.data.data.content.substring(0, 200));
    console.log('\n');
  } catch (error) {
    console.error('Error in Company Analysis test:', error.message);
    if (error.response) {
      console.error('Error Response:', error.response.data);
    }
  }
}

// Test Message Analysis
async function testMessageAnalysis() {
  try {
    console.log('Testing Message Analysis API...');
    const response = await axios.post('http://localhost:5007/api/message/analyze', {
      clientMessage: 'Hi, I\'m interested in learning more about your surveillance system. I\'m particularly concerned about the cost and how it might improve safety at our construction sites. Can you give me more information about pricing and implementation?',
      outputFormat: 'email'
    });
    
    console.log('Message Analysis Response:');
    console.log('Status:', response.status);
    console.log('Sentiment:', response.data.data.messageAnalysis.sentiment);
    console.log('Topics:', response.data.data.messageAnalysis.topics);
    console.log('Questions:', response.data.data.messageAnalysis.questions);
    console.log('Generated Response Length:', response.data.data.responseContent.length);
    console.log('First 200 chars of response:', response.data.data.responseContent.substring(0, 200));
  } catch (error) {
    console.error('Error in Message Analysis test:', error.message);
    if (error.response) {
      console.error('Error Response:', error.response.data);
    }
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('Starting API Tests\n');
    await testProfileAnalysis();
    await testCompanyAnalysis();
    await testMessageAnalysis();
    console.log('All tests completed');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests();