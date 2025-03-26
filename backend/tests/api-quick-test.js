/**
 * API Quick Test
 * 
 * This script directly tests the OpenAI and Claude APIs with hard-coded API keys.
 * Replace the API keys with your actual keys before running.
 */

const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

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
 * Test OpenAI API with direct key
 */
async function testOpenAI(apiKey) {
  console.log(`${colors.blue}Testing OpenAI API...${colors.reset}`);
  
  if (!apiKey || apiKey.trim() === '') {
    console.log(`${colors.red}No API key provided.${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.cyan}API key received - testing connection...${colors.reset}`);
  
  try {
    const openai = new OpenAI({ apiKey });
    const model = "gpt-4o-mini";  // Use the mini model to reduce costs
    
    console.log(`${colors.yellow}Sending test message to OpenAI model: ${model}...${colors.reset}`);
    
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: "Say 'API key is working!' in one short sentence." }],
      max_tokens: 20,
      temperature: 0.5,
    });
    const latency = Date.now() - startTime;
    
    const response = completion.choices[0].message.content.trim();
    console.log(`${colors.green}OpenAI response: ${response}${colors.reset}`);
    console.log(`${colors.green}Response time: ${latency}ms${colors.reset}`);
    console.log(`${colors.green}API key is working correctly!${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}Error testing OpenAI API: ${error.message}${colors.reset}`);
    
    // More detailed error analysis
    if (error.message.includes('401')) {
      console.log(`${colors.yellow}This appears to be an authentication error. Your API key may be invalid.${colors.reset}`);
    } else if (error.message.includes('429')) {
      console.log(`${colors.yellow}This appears to be a rate limit error. Your account may have reached its quota.${colors.reset}`);
      console.log(`${colors.yellow}However, the key format seems valid - it's just out of quota.${colors.reset}`);
    } else if (error.message.includes('404')) {
      console.log(`${colors.yellow}Model not found. Try using a different model like "gpt-3.5-turbo".${colors.reset}`);
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.log(`${colors.yellow}Connection issue. Check your internet connection.${colors.reset}`);
    }
    
    return false;
  }
}

/**
 * Test Claude API with direct key
 */
async function testClaude(apiKey) {
  console.log(`${colors.blue}Testing Claude API...${colors.reset}`);
  
  if (!apiKey || apiKey.trim() === '') {
    console.log(`${colors.red}No API key provided.${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.cyan}API key received - testing connection...${colors.reset}`);
  
  try {
    const anthropic = new Anthropic({ apiKey });
    const model = "claude-3-haiku-20240307";  // Use the smaller, faster model
    
    console.log(`${colors.yellow}Sending test message to Claude model: ${model}...${colors.reset}`);
    
    const startTime = Date.now();
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 20,
      messages: [{ role: "user", content: "Say 'API key is working!' in one short sentence." }]
    });
    const latency = Date.now() - startTime;
    
    const response = message.content[0].text;
    console.log(`${colors.green}Claude response: ${response}${colors.reset}`);
    console.log(`${colors.green}Response time: ${latency}ms${colors.reset}`);
    console.log(`${colors.green}API key is working correctly!${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}Error testing Claude API: ${error.message}${colors.reset}`);
    
    // More detailed error analysis
    if (error.message.includes('401')) {
      console.log(`${colors.yellow}This appears to be an authentication error. Your API key may be invalid.${colors.reset}`);
    } else if (error.message.includes('429')) {
      console.log(`${colors.yellow}This appears to be a rate limit error. Your account may have reached its quota.${colors.reset}`);
      console.log(`${colors.yellow}However, the key format seems valid - it's just out of quota.${colors.reset}`);
    } else if (error.message.includes('404') && error.message.includes('model:')) {
      console.log(`${colors.yellow}Model not found. Try using "claude-3-haiku-20240307" instead.${colors.reset}`);
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.log(`${colors.yellow}Connection issue. Check your internet connection.${colors.reset}`);
    }
    
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.magenta}=== API Quick Test ====${colors.reset}`);
  console.log('This script bypasses environment variables and tests APIs directly.\n');
  
  // REPLACE THESE WITH YOUR ACTUAL API KEYS
  const openaiKey = "sk-your-openai-key-here";
  const claudeKey = "sk-ant-your-claude-key-here";
  
  console.log(`${colors.yellow}Note: Edit this file to add your API keys before running.${colors.reset}`);
  
  // Test OpenAI if key is provided
  let openaiResult = false;
  if (openaiKey && !openaiKey.includes("your-openai-key-here")) {
    openaiResult = await testOpenAI(openaiKey);
  } else {
    console.log(`${colors.yellow}Skipping OpenAI test - please edit the script to add your API key.${colors.reset}`);
  }
  
  console.log('\n'); // Add spacing between tests
  
  // Test Claude if key is provided
  let claudeResult = false;
  if (claudeKey && !claudeKey.includes("your-claude-key-here")) {
    claudeResult = await testClaude(claudeKey);
  } else {
    console.log(`${colors.yellow}Skipping Claude test - please edit the script to add your API key.${colors.reset}`);
  }
  
  console.log('\n'); // Add spacing before summary
  
  // Print summary
  console.log(`${colors.magenta}=== Test Summary ====${colors.reset}`);
  console.log(`OpenAI API: ${openaiResult ? colors.green + 'PASSED' : colors.yellow + 'SKIPPED'}${colors.reset}`);
  console.log(`Claude API: ${claudeResult ? colors.green + 'PASSED' : colors.yellow + 'SKIPPED'}${colors.reset}`);
  
  console.log(`\n${colors.cyan}To use these services in your app:${colors.reset}`);
  console.log(`1. Add your API keys to your .env file:`);
  
  if (openaiResult) {
    console.log(`   OPENAI_API_KEY=${openaiKey}`);
    console.log(`   OPENAI_MODEL=gpt-4o-mini`);
  } else {
    console.log(`   OPENAI_API_KEY=your_key_here`);
    console.log(`   OPENAI_MODEL=gpt-4o-mini`);
  }
  
  if (claudeResult) {
    console.log(`   ANTHROPIC_API_KEY=${claudeKey}`);
    console.log(`   ANTHROPIC_MODEL=claude-3-haiku-20240307`);
  } else {
    console.log(`   ANTHROPIC_API_KEY=your_key_here`);
    console.log(`   ANTHROPIC_MODEL=claude-3-haiku-20240307`);
  }
  
  console.log(`\n2. Run your app with these environment variables set`);
  console.log(`3. Check logs for any errors or warnings during initialization`);
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Unexpected error: ${error}${colors.reset}`);
});