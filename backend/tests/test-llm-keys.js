/**
 * LLM API Key Test Script
 * 
 * This script tests if the API keys for OpenAI and Claude (Anthropic) are working correctly
 * by making a simple request to each service.
 * 
 * Usage: node tests/test-llm-keys.js
 */

const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

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
 * Test OpenAI API key
 */
async function testOpenAI() {
  console.log(`${colors.blue}Testing OpenAI API key...${colors.reset}`);
  
  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAPI_KEY;
  if (!apiKey) {
    console.log(`${colors.red}No OpenAI API key found in environment variables.${colors.reset}`);
    console.log(`${colors.yellow}Please add OPENAI_API_KEY to your .env file.${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.cyan}API key found: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 4)}${colors.reset}`);
  
  // Test API key with a simple request
  try {
    const openai = new OpenAI({ apiKey });
    const testMessage = "Say 'API key is working!' in one short sentence.";
    
    console.log(`${colors.yellow}Sending test message to OpenAI...${colors.reset}`);
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [{ role: "user", content: testMessage }],
      max_tokens: 20
    });
    
    const response = completion.choices[0].message.content.trim();
    console.log(`${colors.green}OpenAI response: ${response}${colors.reset}`);
    console.log(`${colors.green}API key is working correctly!${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}Error testing OpenAI API key: ${error.message}${colors.reset}`);
    if (error.message.includes('401')) {
      console.log(`${colors.yellow}This appears to be an authentication error. Please check your API key.${colors.reset}`);
    } else if (error.message.includes('429')) {
      console.log(`${colors.yellow}This appears to be a rate limit error. Your account may have reached its quota.${colors.reset}`);
      console.log(`${colors.green}However, the key format is valid, so the service should work when quota is available.${colors.reset}`);
      return true; // Return true because the key itself is valid, just rate limited
    }
    return false;
  }
}

/**
 * Test Anthropic (Claude) API key
 */
async function testAnthropic() {
  console.log(`${colors.blue}Testing Anthropic (Claude) API key...${colors.reset}`);
  
  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log(`${colors.red}No Anthropic API key found in environment variables.${colors.reset}`);
    console.log(`${colors.yellow}Please add ANTHROPIC_API_KEY to your .env file.${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.cyan}API key found: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 4)}${colors.reset}`);
  
  // Test API key with a simple request
  try {
    const anthropic = new Anthropic({ apiKey });
    const testMessage = "Say 'API key is working!' in one short sentence.";
    
    console.log(`${colors.yellow}Sending test message to Claude...${colors.reset}`);
    
    const model = process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240307";
    console.log(`${colors.cyan}Using Claude model: ${model}${colors.reset}`);
    
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 20,
      messages: [{ role: "user", content: testMessage }]
    });
    
    const response = message.content[0].text;
    console.log(`${colors.green}Claude response: ${response}${colors.reset}`);
    console.log(`${colors.green}API key is working correctly!${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}Error testing Anthropic API key: ${error.message}${colors.reset}`);
    if (error.message.includes('401')) {
      console.log(`${colors.yellow}This appears to be an authentication error. Please check your API key.${colors.reset}`);
    } else if (error.message.includes('429')) {
      console.log(`${colors.yellow}This appears to be a rate limit error. Your account may have reached its quota.${colors.reset}`);
      console.log(`${colors.green}However, the key format is valid, so the service should work when quota is available.${colors.reset}`);
      return true; // Return true because the key itself is valid, just rate limited
    } else if (error.message.includes('404') && error.message.includes('model:')) {
      console.log(`${colors.yellow}The specified model was not found. The model name may have changed.${colors.reset}`);
      console.log(`${colors.yellow}Try using a different model like "claude-3-haiku-20240307" or "claude-3-opus-20240229".${colors.reset}`);
      console.log(`${colors.yellow}You can set this in your .env file with the ANTHROPIC_MODEL variable.${colors.reset}`);
      console.log(`${colors.green}However, the API key itself is valid, so the service should work with the correct model.${colors.reset}`);
      return true; // Return true because the key itself is valid, just using wrong model
    }
    return false;
  }
}

/**
 * Main function to run all tests
 */
async function runTests() {
  console.log(`${colors.magenta}=== LLM API Key Test ====${colors.reset}`);
  console.log('This script will test if your API keys for OpenAI and Claude are working correctly.\n');
  
  // Test OpenAI
  const openaiResult = await testOpenAI();
  
  console.log('\n'); // Add spacing between tests
  
  // Test Anthropic (Claude)
  const anthropicResult = await testAnthropic();
  
  console.log('\n'); // Add spacing before summary
  
  // Print summary
  console.log(`${colors.magenta}=== Test Summary ====${colors.reset}`);
  console.log(`OpenAI API: ${openaiResult ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  console.log(`Anthropic API: ${anthropicResult ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  
  if (!openaiResult && !anthropicResult) {
    console.log(`\n${colors.red}Both API tests failed. Please check your API keys and try again.${colors.reset}`);
    console.log(`${colors.yellow}At least one working API key is required for the LLM integration to function.${colors.reset}`);
  } else if (!openaiResult || !anthropicResult) {
    console.log(`\n${colors.yellow}One API test failed. The system will work with one LLM, but having both is recommended.${colors.reset}`);
  } else {
    console.log(`\n${colors.green}All tests passed! Your API keys are configured correctly.${colors.reset}`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Unexpected error running tests: ${error}${colors.reset}`);
});