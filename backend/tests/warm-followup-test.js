const contentGenerationService = require('../services/contentGenerationService');
require('dotenv').config();

// Test profile data (using Elon Musk as an example)
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

// Test the warm follow-up email function
async function testWarmFollowup() {
  try {
    console.log("Testing warm follow-up email generation...");
    console.log("Profile: ", profileData.name, ", ", profileData.title, " at ", profileData.company);
    console.log("Call details: ", callDetails);
    
    // Generate the warm follow-up email
    const followupEmail = await contentGenerationService.generateWarmFollowup(profileData, callDetails);
    
    // Display the results
    console.log("\n--- WARM FOLLOW-UP EMAIL ---");
    console.log(followupEmail);
    
    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("Error in warm follow-up test:", error);
  }
}

// Run the test
testWarmFollowup();