/**
 * Two-Agent System Test Script
 * 
 * This script tests the complete workflow of the two-agent system:
 * 1. Fine-tuning agent to create tailored prompts
 * 2. Sales copy agent to generate personalized content
 * 
 * Run with: node tests/two-agent-test.js
 */

const twoAgentService = require('../services/twoAgentService');
const researchService = require('../services/researchService');

// Test LinkedIn profile data
const testProfile = {
  name: "John Smith",
  title: "Safety Director",
  company: "ABC Construction",
  connections: 500,
  location: "Phoenix, AZ",
  about: "Experienced Safety Director with 15+ years in construction safety management.",
  experience: [
    {
      title: "Safety Director",
      company: "ABC Construction",
      duration: "2018 - Present"
    },
    {
      title: "Safety Manager",
      company: "XYZ Builders",
      duration: "2012 - 2018"
    }
  ],
  interests: ["Construction Safety", "OSHA Compliance", "Risk Management"]
};

// Additional context provided by the user
const additionalContext = {
  notes: "Met John at the Construction Safety Conference last month. He mentioned concerns about monitoring multiple job sites simultaneously."
};

// Output types to test
const outputTypes = ["sales_email", "linkedin_message"];

/**
 * Run the full two-agent test
 */
async function runTwoAgentTest() {
  console.log("=== Starting Two-Agent System Test ===");
  
  try {
    // Test research service
    console.log("\n--- Testing Research Service ---");
    const companyInfo = await researchService.researchCompany(testProfile.company);
    console.log(`Company Info:`, JSON.stringify(companyInfo, null, 2));
    
    const roleInfo = await researchService.analyzeRole(testProfile.title);
    console.log(`Role Info:`, JSON.stringify(roleInfo, null, 2));
    
    // Test the fine-tuning agent only
    console.log("\n--- Testing Fine-Tuning Agent ---");
    const fineTuningResult = await twoAgentService.testFineTuningAgent(
      testProfile,
      additionalContext,
      outputTypes[0]
    );
    
    console.log("Fine-Tuning Output:");
    console.log(fineTuningResult.output);
    
    // Test the sales copy agent only
    console.log("\n--- Testing Sales Copy Agent ---");
    const testPrompt = `Generate a sales email for John Smith, Safety Director at ABC Construction, addressing the pain point of monitoring multiple job sites simultaneously. The message should showcase VigilantEx's "4 Extra Employees" concept, highlight relevant benefits for a safety director, and conclude with a clear call to action. Make it professional, conversational, and under 300 words.`;
    
    const salesCopyResult = await twoAgentService.testSalesCopyAgent(testPrompt);
    console.log("Sales Copy Output:");
    console.log(salesCopyResult);
    
    // Test the complete two-agent system for both output types
    for (const outputType of outputTypes) {
      console.log(`\n--- Testing Complete Two-Agent System (${outputType}) ---`);
      
      const result = await twoAgentService.generatePersonalizedContent(
        testProfile,
        additionalContext,
        outputType
      );
      
      console.log(`Generated ${outputType}:`);
      console.log(result.content);
      console.log("\nMetadata:");
      console.log(JSON.stringify(result.metadata, null, 2));
    }
    
    console.log("\n=== Two-Agent System Test Completed Successfully ===");
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

// Run the test
runTwoAgentTest();