/**
 * MOCK LLM API Key Test Script - For Demonstration Purposes Only
 * 
 * This script simulates the test-llm-keys.js functionality without making real API calls.
 * 
 * Usage: node tests/mock-llm-test.js
 */

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.claude') });

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Mock test OpenAI API key
 */
async function testOpenAI() {
  console.log(`${colors.blue}Testing OpenAI API key (MOCK TEST)...${colors.reset}`);
  
  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAPI_KEY;
  if (!apiKey) {
    console.log(`${colors.red}No OpenAI API key found in environment variables.${colors.reset}`);
    console.log(`${colors.yellow}Please add OPENAI_API_KEY to your .env file.${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.cyan}API key found: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 4)}${colors.reset}`);
  
  // Simulate API test with a delay
  console.log(`${colors.yellow}Sending test message to OpenAI...${colors.reset}`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Output simulated response
  const response = "API key is working! This is a mock response.";
  console.log(`${colors.green}OpenAI response: ${response}${colors.reset}`);
  console.log(`${colors.green}API key is working correctly! (SIMULATED)${colors.reset}`);
  return true;
}

/**
 * Mock test Anthropic (Claude) API key
 */
async function testAnthropic() {
  console.log(`${colors.blue}Testing Anthropic (Claude) API key (MOCK TEST)...${colors.reset}`);
  
  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log(`${colors.red}No Anthropic API key found in environment variables.${colors.reset}`);
    console.log(`${colors.yellow}Please add ANTHROPIC_API_KEY to your .env file.${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.cyan}API key found: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 4)}${colors.reset}`);
  
  // Simulate API test with a delay
  console.log(`${colors.yellow}Sending test message to Claude...${colors.reset}`);
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Output simulated response
  const response = "API key is working! This is a mock response from Claude.";
  console.log(`${colors.green}Claude response: ${response}${colors.reset}`);
  console.log(`${colors.green}API key is working correctly! (SIMULATED)${colors.reset}`);
  return true;
}

/**
 * Main function to run all tests
 */
async function runTests() {
  console.log(`${colors.magenta}=== MOCK LLM API Key Test (Demonstration) ====${colors.reset}`);
  console.log(`This is a SIMULATED demonstration of the API key testing functionality.\n`);
  
  // Test OpenAI
  const openaiResult = await testOpenAI();
  
  console.log('\n'); // Add spacing between tests
  
  // Test Anthropic (Claude)
  const anthropicResult = await testAnthropic();
  
  console.log('\n'); // Add spacing before summary
  
  // Print summary
  console.log(`${colors.magenta}=== Test Summary (MOCK) ====${colors.reset}`);
  console.log(`OpenAI API: ${openaiResult ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  console.log(`Anthropic API: ${anthropicResult ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  
  if (!openaiResult && !anthropicResult) {
    console.log(`\n${colors.red}Both API tests failed. Please check your API keys and try again.${colors.reset}`);
    console.log(`${colors.yellow}At least one working API key is required for the LLM integration to function.${colors.reset}`);
  } else if (!openaiResult || !anthropicResult) {
    console.log(`\n${colors.yellow}One API test failed. The system will work with one LLM, but having both is recommended.${colors.reset}`);
  } else {
    console.log(`\n${colors.green}All tests passed! Your API keys are configured correctly.${colors.reset}`);
    console.log(`${colors.cyan}IMPORTANT: This was a mock test for demonstration purposes only. In a real environment, you would use real API keys.${colors.reset}`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Unexpected error running tests: ${error}${colors.reset}`);
});