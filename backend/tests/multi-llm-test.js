/**
 * Multi-LLM Test
 * 
 * This script tests the enhanced content generation service that uses
 * multiple LLM providers (Claude and OpenAI) with intelligent routing.
 */

const enhancedContentService = require('../services/enhancedContentGenerationService');
const originalContentService = require('../services/contentGenerationService');
require('dotenv').config();

// Test profile data
const profileData = {
  name: 'Elon Musk',
  title: 'Project Director',
  company: 'SpaceX Construction Division',
  location: 'Austin, Texas',
  experience: [
    { title: 'Project Director', company: 'SpaceX Construction Division', duration: '2020 - Present' },
    { title: 'Construction Executive', company: 'Tesla Gigafactory', duration: '2016 - 2020' }
  ],
  interests: ['Advanced Construction Methods', 'Project Efficiency', 'Safety Innovations', 'Sustainable Building'],
  skills: ['Project Management', 'Construction Oversight', 'Safety Standards', 'Team Leadership', 'Innovation'],
  education: [
    { school: 'University of Pennsylvania', degree: 'B.S. in Economics and Physics', years: '1992 - 1997' }
  ]
};

// Call details for the warm follow-up
const callDetails = {
  duration: '25 minutes',
  topics: ['surveillance system capabilities', 'implementation process', 'cost structure', 'ROI calculation'],
  concerns: 'ROI and implementation timeline for multiple construction sites',
  nextSteps: 'product demonstration scheduled for next Tuesday at 2:00 PM',
  demoDate: 'Tuesday, March 25th at 2:00 PM'
};

// Sample client message for analysis
const clientMessage = `
Hello, I saw your VigilantEx system at a trade show last week and I'm interested in learning more. 
We have 3 active construction sites in the Phoenix area, and theft has been a major issue for us.
Can you tell me more about your pricing and how quickly the system can be implemented? 
Also, I'm wondering about the ROI - how much time would it take to recoup the investment through reduced losses?
`;

// Company data for company content generation
const companyData = {
  name: 'Acme Construction',
  industry: 'Commercial Construction',
  size: 'Medium (100-250 employees)',
  location: 'Phoenix, Arizona',
  specialties: ['Commercial Projects', 'Project Management', 'Safety Compliance', 'Sustainable Construction']
};

// Test all services
async function runTests() {
  try {
    console.log("=== TESTING MULTI-LLM CONTENT GENERATION ===");
    console.log("This test compares the enhanced service using Claude/OpenAI with the original service.\n");
    
    // Test 1: Generate warm follow-up email
    console.log("\n=== TEST 1: WARM FOLLOW-UP EMAIL ===");
    console.log("Profile: ", profileData.name, ", ", profileData.title, " at ", profileData.company);
    console.log("Call details: ", callDetails.topics.join(', '), ", concerns: ", callDetails.concerns);
    
    console.log("\nGenerating with Enhanced Service (Claude/OpenAI):");
    const enhancedFollowup = await enhancedContentService.generateWarmFollowup(profileData, callDetails);
    console.log("\n--- ENHANCED WARM FOLLOW-UP EMAIL ---");
    console.log(enhancedFollowup.substring(0, 500) + '...');
    
    console.log("\nGenerating with Original Service (OpenAI):");
    const originalFollowup = await originalContentService.generateWarmFollowup(profileData, callDetails);
    console.log("\n--- ORIGINAL WARM FOLLOW-UP EMAIL ---");
    console.log(originalFollowup.substring(0, 500) + '...');
    
    // Test 2: Generate profile content
    console.log("\n=== TEST 2: PROFILE CONTENT ===");
    console.log("Profile: ", profileData.name, ", ", profileData.title, " at ", profileData.company);
    
    console.log("\nGenerating with Enhanced Service (Claude/OpenAI):");
    const enhancedProfileContent = await enhancedContentService.generateProfileContent(profileData, 'email');
    console.log("\n--- ENHANCED PROFILE CONTENT ---");
    console.log(enhancedProfileContent.substring(0, 500) + '...');
    
    console.log("\nGenerating with Original Service (OpenAI):");
    const originalProfileContent = await originalContentService.generateProfileContent(profileData, 'email');
    console.log("\n--- ORIGINAL PROFILE CONTENT ---");
    console.log(originalProfileContent.substring(0, 500) + '...');
    
    // Test 3: Message analysis
    console.log("\n=== TEST 3: MESSAGE ANALYSIS ===");
    console.log("Client message: ", clientMessage.substring(0, 100) + '...');
    
    console.log("\nAnalyzing with Enhanced Service (Claude/OpenAI):");
    const enhancedAnalysis = await enhancedContentService.analyzeClientMessage(clientMessage);
    console.log("\n--- ENHANCED MESSAGE ANALYSIS ---");
    console.log(JSON.stringify(enhancedAnalysis, null, 2));
    
    console.log("\nAnalyzing with Original Service (OpenAI):");
    const originalAnalysis = await originalContentService.analyzeClientMessage(clientMessage);
    console.log("\n--- ORIGINAL MESSAGE ANALYSIS ---");
    console.log(JSON.stringify(originalAnalysis, null, 2));
    
    // Test 4: Message response
    console.log("\n=== TEST 4: MESSAGE RESPONSE ===");
    
    console.log("\nGenerating with Enhanced Service (Claude/OpenAI):");
    const enhancedResponse = await enhancedContentService.generateMessageResponse(
      clientMessage, 
      enhancedAnalysis, 
      'email'
    );
    console.log("\n--- ENHANCED MESSAGE RESPONSE ---");
    console.log(enhancedResponse.substring(0, 500) + '...');
    
    console.log("\nGenerating with Original Service (OpenAI):");
    const originalResponse = await originalContentService.generateMessageResponse(
      clientMessage, 
      originalAnalysis, 
      'email'
    );
    console.log("\n--- ORIGINAL MESSAGE RESPONSE ---");
    console.log(originalResponse.substring(0, 500) + '...');
    
    // Test 5: Company content
    console.log("\n=== TEST 5: COMPANY CONTENT ===");
    console.log("Company: ", companyData.name, ", Industry: ", companyData.industry);
    
    console.log("\nGenerating with Enhanced Service (Claude/OpenAI):");
    const enhancedCompanyContent = await enhancedContentService.generateCompanyContent(
      companyData, 
      [], 
      'email'
    );
    console.log("\n--- ENHANCED COMPANY CONTENT ---");
    console.log(enhancedCompanyContent.substring(0, 500) + '...');
    
    console.log("\nGenerating with Original Service (OpenAI):");
    const originalCompanyContent = await originalContentService.generateCompanyContent(
      companyData, 
      [], 
      'email'
    );
    console.log("\n--- ORIGINAL COMPANY CONTENT ---");
    console.log(originalCompanyContent.substring(0, 500) + '...');
    
    console.log("\n=== TESTS COMPLETED SUCCESSFULLY ===");
  } catch (error) {
    console.error("Error running tests:", error);
  }
}

// Run the test
runTests();