require('dotenv').config();

// Update the .env file with LinkedIn credentials for testing
const LINKEDIN_EMAIL = process.env.LINKEDIN_EMAIL || '';
const LINKEDIN_PASSWORD = process.env.LINKEDIN_PASSWORD || '';
const API_KEY = process.env.API_KEY || 'test-api-key-1234';

// Test profile URLs
const TEST_PROFILES = [
  'https://www.linkedin.com/in/williamhgates/',
  'https://www.linkedin.com/in/satyanadella/'
];

// Import the profile service
const profileService = require('../services/profileService');

// Function to test profile extraction
async function testProfileExtraction() {
  console.log('Starting LinkedIn profile extraction test...');
  console.log(`LinkedIn credentials available: ${Boolean(LINKEDIN_EMAIL && LINKEDIN_PASSWORD)}`);
  
  try {
    // Test with the first profile
    console.log(`Testing extraction for profile: ${TEST_PROFILES[0]}`);
    const profileData = await profileService.extractProfileData(TEST_PROFILES[0]);
    
    console.log('Profile extraction successful!');
    console.log('Profile data:');
    console.log(JSON.stringify(profileData, null, 2));
    
    // If company data is available, test company extraction
    if (profileData.company && profileData.company !== 'Construction Company') {
      console.log(`Testing company extraction for: ${profileData.company}`);
      const companyData = await profileService.getCompanyFromProfile(profileData);
      
      console.log('Company extraction successful!');
      console.log('Company data:');
      console.log(JSON.stringify(companyData, null, 2));
    }
    
    return {
      success: true,
      profileData,
      message: 'Profile extraction test completed successfully'
    };
  } catch (error) {
    console.error('Profile extraction test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Profile extraction test failed'
    };
  }
}

// Run the test
testProfileExtraction()
  .then(result => {
    console.log(`Test completed with status: ${result.success ? 'SUCCESS' : 'FAILURE'}`);
    console.log(result.message);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
  });
