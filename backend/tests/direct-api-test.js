/**
 * Direct API Test
 * 
 * This script directly tests the OpenAI and Claude APIs without using
 * environment variables. You'll be prompted to enter your API keys directly.
 */

const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
 * Helper function to prompt for user input
 */
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

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
  console.log(`${colors.magenta}=== Direct API Test ====${colors.reset}`);
  console.log('This script bypasses environment variables and tests APIs directly.\n');
  
  // Test OpenAI
  const openaiKey = await askQuestion(`Enter your OpenAI API key (starts with "sk-"): `);
  const openaiResult = await testOpenAI(openaiKey);
  
  console.log('\n'); // Add spacing between tests
  
  // Test Claude
  const claudeKey = await askQuestion(`Enter your Claude (Anthropic) API key (starts with "sk-ant-"): `);
  const claudeResult = await testClaude(claudeKey);
  
  console.log('\n'); // Add spacing before summary
  
  // Print summary
  console.log(`${colors.magenta}=== Test Summary ====${colors.reset}`);
  console.log(`OpenAI API: ${openaiResult ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  console.log(`Claude API: ${claudeResult ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  
  // Provide advice on environment setup
  if (openaiResult || claudeResult) {
    console.log(`\n${colors.green}At least one API test passed! Now let's set up your .env file.${colors.reset}`);
    console.log(`${colors.cyan}Add these lines to your .env file: ${colors.reset}`);
    
    if (openaiResult) {
      console.log(`OPENAI_API_KEY=${openaiKey}`);
      console.log(`OPENAI_MODEL=gpt-4o-mini`);
    }
    
    if (claudeResult) {
      console.log(`ANTHROPIC_API_KEY=${claudeKey}`);
      console.log(`ANTHROPIC_MODEL=claude-3-haiku-20240307`);
    }
    
    // Check if they want to automatically update their .env file
    const updateEnv = await askQuestion(`\nWould you like me to update your .env file with these values? (y/n): `);
    
    if (updateEnv.toLowerCase() === 'y') {
      const fs = require('fs');
      const path = require('path');
      const ENV_PATH = path.join(__dirname, '..', '.env');
      
      try {
        // Read existing content or create empty file
        let envContent = '';
        try {
          envContent = fs.readFileSync(ENV_PATH, 'utf8');
        } catch (err) {
          // File doesn't exist, start with empty content
        }
        
        // Update or add OpenAI key
        if (openaiResult) {
          const openaiKeyRegex = /^OPENAI_API_KEY=.*/m;
          const openaiModelRegex = /^OPENAI_MODEL=.*/m;
          
          if (openaiKeyRegex.test(envContent)) {
            envContent = envContent.replace(openaiKeyRegex, `OPENAI_API_KEY=${openaiKey}`);
          } else {
            envContent += `\nOPENAI_API_KEY=${openaiKey}`;
          }
          
          if (openaiModelRegex.test(envContent)) {
            envContent = envContent.replace(openaiModelRegex, `OPENAI_MODEL=gpt-4o-mini`);
          } else {
            envContent += `\nOPENAI_MODEL=gpt-4o-mini`;
          }
        }
        
        // Update or add Claude key
        if (claudeResult) {
          const claudeKeyRegex = /^ANTHROPIC_API_KEY=.*/m;
          const claudeModelRegex = /^ANTHROPIC_MODEL=.*/m;
          
          if (claudeKeyRegex.test(envContent)) {
            envContent = envContent.replace(claudeKeyRegex, `ANTHROPIC_API_KEY=${claudeKey}`);
          } else {
            envContent += `\nANTHROPIC_API_KEY=${claudeKey}`;
          }
          
          if (claudeModelRegex.test(envContent)) {
            envContent = envContent.replace(claudeModelRegex, `ANTHROPIC_MODEL=claude-3-haiku-20240307`);
          } else {
            envContent += `\nANTHROPIC_MODEL=claude-3-haiku-20240307`;
          }
        }
        
        // Make sure file has reasonable formatting
        envContent = envContent.replace(/\n\n+/g, '\n\n');
        if (!envContent.endsWith('\n')) {
          envContent += '\n';
        }
        
        // Write back to .env
        fs.writeFileSync(ENV_PATH, envContent);
        console.log(`${colors.green}.env file updated successfully!${colors.reset}`);
      } catch (error) {
        console.log(`${colors.red}Error updating .env file: ${error.message}${colors.reset}`);
        console.log(`${colors.yellow}Please add the variables manually to your .env file.${colors.reset}`);
      }
    }
  } else {
    console.log(`\n${colors.red}Both API tests failed. Please check your API keys and try again.${colors.reset}`);
  }
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Unexpected error: ${error}${colors.reset}`);
  rl.close();
});