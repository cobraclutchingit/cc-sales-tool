/**
 * Test script for the profileService.js functionality
 * Tests LinkedIn profile data extraction and company information retrieval
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import the profile service
const profileService = require('../services/profileService');

// Update the .env file with LinkedIn credentials for testing
const LINKEDIN_EMAIL = process.env.LINKEDIN_EMAIL || '';
const LINKEDIN_PASSWORD = process.env.LINKEDIN_PASSWORD || '';

// Test profile URLs - specific target profile for our needs
const TEST_PROFILES = [
  'https://www.linkedin.com/in/michael-schueler-42679513/', // Michael Schueler at Tri Pointe Homes
  'https://www.linkedin.com/in/williamhgates/',             // Bill Gates (fallback test)
  'https://www.linkedin.com/in/satyanadella/'               // Satya Nadella (another fallback)
];

/**
 * Function to test profile extraction with quality assessment
 */
async function testProfileExtraction() {
  console.log('=== LinkedIn Profile Extraction Test ===');
  console.log(`LinkedIn credentials available: ${Boolean(LINKEDIN_EMAIL && LINKEDIN_PASSWORD)}`);
  
  // Check for existing session cookies
  const cookiesPath = path.join(process.cwd(), 'linkedin_cookies.json');
  const hasCookies = fs.existsSync(cookiesPath);
  console.log(`Session cookies file ${hasCookies ? 'found' : 'not found'}`);
  
  try {
    // Test with the target profile (Michael Schueler)
    const targetProfile = TEST_PROFILES[0];
    console.log(`\nTesting extraction for target profile: ${targetProfile}`);
    console.log('This may take a minute...');
    
    // Extract profile data
    const startTime = Date.now();
    const profileData = await profileService.extractProfileData(targetProfile);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (profileData) {
      console.log(`\n✅ Profile data extracted in ${duration} seconds!`);
      
      // Log basic profile information
      console.log('\nBasic Profile Information:');
      console.log(`- Name: ${profileData.name}`);
      console.log(`- Title: ${profileData.title}`);
      console.log(`- Company: ${profileData.company}`);
      console.log(`- Location: ${profileData.location}`);
      
      // Check data quality
      const dataQualityScore = assessDataQuality(profileData);
      console.log(`\nData Quality Score: ${dataQualityScore}/10`);
      
      // Check for expected values for Michael Schueler
      console.log('\nData Validation for Michael Schueler:');
      if (profileData.name.toLowerCase().includes('michael') && 
          profileData.name.toLowerCase().includes('schueler')) {
        console.log('✅ Name matches expected pattern');
      } else {
        console.log('❌ Name does not match expected value "Michael Schueler"');
      }
      
      if (profileData.title.toLowerCase().includes('vp') || 
          profileData.title.toLowerCase().includes('vice president')) {
        console.log('✅ Title contains expected VP role');
      } else {
        console.log('❌ Title does not contain expected VP role');
      }
      
      if (profileData.company.toLowerCase().includes('tri pointe') || 
          profileData.company.toLowerCase().includes('tripointe')) {
        console.log('✅ Company contains expected "Tri Pointe Homes"');
      } else {
        console.log('❌ Company does not contain expected "Tri Pointe Homes"');
      }
      
      // Save output for reference
      const outputPath = path.join(process.cwd(), 'profile_extraction_result.json');
      fs.writeFileSync(outputPath, JSON.stringify(profileData, null, 2));
      console.log(`\nFull results saved to: ${outputPath}`);
      
      // If data quality is good, test company extraction
      if (dataQualityScore >= 5) {
        await testCompanyExtraction(profileData);
      } else {
        console.warn('⚠️ Data quality is below threshold, skipping company extraction test');
      }
      
      return {
        success: true,
        profileData,
        dataQualityScore,
        message: 'Profile extraction test completed successfully'
      };
    } else {
      console.error('❌ Failed to extract profile data');
      return {
        success: false,
        error: 'No profile data returned',
        message: 'Profile extraction test failed'
      };
    }
  } catch (error) {
    console.error('❌ Profile extraction test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Profile extraction test failed'
    };
  }
}

/**
 * Test company information extraction from profile
 * @param {Object} profileData - LinkedIn profile data
 */
async function testCompanyExtraction(profileData) {
  console.log('\n=== Company Information Extraction Test ===');
  
  try {
    console.log(`Testing company extraction for: ${profileData.company}`);
    
    // Extract company information
    const startTime = Date.now();
    const companyData = await profileService.getCompanyFromProfile(profileData);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (companyData) {
      console.log(`\n✅ Company data extracted in ${duration} seconds!`);
      
      // Log basic company information
      console.log('\nBasic Company Information:');
      console.log(`- Name: ${companyData.name}`);
      console.log(`- Industry: ${companyData.industry}`);
      console.log(`- Size: ${companyData.size}`);
      console.log(`- Location: ${companyData.location}`);
      console.log(`- Specialties: ${companyData.specialties.join(', ')}`);
      
      // Save output for reference
      const outputPath = path.join(process.cwd(), 'company_extraction_result.json');
      fs.writeFileSync(outputPath, JSON.stringify(companyData, null, 2));
      console.log(`\nFull results saved to: ${outputPath}`);
      
      return {
        success: true,
        companyData,
        message: 'Company extraction test completed successfully'
      };
    } else {
      console.error('❌ Failed to extract company data');
      return {
        success: false,
        error: 'No company data returned',
        message: 'Company extraction test failed'
      };
    }
  } catch (error) {
    console.error('❌ Company extraction test failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Company extraction test failed'
    };
  }
}

/**
 * Assess the quality of extracted profile data
 * @param {Object} profileData - LinkedIn profile data
 * @returns {number} - Quality score from 0-10
 */
function assessDataQuality(profileData) {
  let score = 0;
  
  // Check for required fields
  if (profileData.name && profileData.name !== 'Unknown User') score += 2;
  if (profileData.title && profileData.title !== 'Construction Professional') score += 2;
  if (profileData.company && profileData.company !== 'Construction Company') score += 2;
  
  // Check for experience data quality
  if (profileData.experience && profileData.experience.length > 0) {
    // Give points based on the richness of the first experience entry
    const firstExp = profileData.experience[0];
    if (firstExp.title && firstExp.title !== 'Professional') score += 1;
    if (firstExp.company && firstExp.company !== 'Construction Company') score += 1;
    if (firstExp.duration && firstExp.duration !== 'Present') score += 1;
  }
  
  // Check for additional data
  if (profileData.education && profileData.education.length > 0) score += 0.5;
  if (profileData.skills && profileData.skills.length > 0) score += 0.5;
  
  // Check if scraping was flagged as successful
  if (profileData.scrapingSuccess === true) {
    score += 1;
  } else if (profileData.scrapingSuccess === false) {
    score -= 2; // Penalize if scraping was explicitly marked as failed
  }
  
  // Cap score at 10
  return Math.min(Math.max(score, 0), 10);
}

// Run the test
testProfileExtraction()
  .then(result => {
    console.log(`\nTest completed with status: ${result.success ? 'SUCCESS' : 'FAILURE'}`);
    console.log(result.message);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
  });
