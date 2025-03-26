/**
 * Fix common LLM API issues
 * 
 * This script helps troubleshoot and fix common issues with LLM API keys and models.
 * 
 * Usage: node utils/fix-llm-issues.js
 */

const fs = require('fs');
const path = require('path');
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

// Path to .env file
const ENV_PATH = path.join(__dirname, '..', '.env');

/**
 * Helper function to prompt for user input
 */
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Check if .env file exists
 */
function checkEnvFile() {
  if (fs.existsSync(ENV_PATH)) {
    return true;
  }
  
  console.log(`${colors.yellow}No .env file found. Creating a new one.${colors.reset}`);
  try {
    fs.writeFileSync(ENV_PATH, '# Environment Variables\n');
    return true;
  } catch (error) {
    console.error(`${colors.red}Error creating .env file: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Read existing .env file
 */
function readEnvFile() {
  try {
    return fs.readFileSync(ENV_PATH, 'utf8');
  } catch (error) {
    console.error(`${colors.red}Error reading .env file: ${error.message}${colors.reset}`);
    return '';
  }
}

/**
 * Update environment variable in .env file
 */
function updateEnvVar(content, varName, varValue) {
  // Check if the variable already exists
  const regex = new RegExp(`^${varName}=.*`, 'm');
  
  if (regex.test(content)) {
    // Variable exists, update it
    return content.replace(regex, `${varName}=${varValue}`);
  } else {
    // Variable doesn't exist, add it
    return content + `\n${varName}=${varValue}`;
  }
}

/**
 * Write updated content to .env file
 */
function writeEnvFile(content) {
  try {
    fs.writeFileSync(ENV_PATH, content);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error writing to .env file: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Fix OpenAI quota issue
 */
async function fixOpenAIQuota() {
  console.log(`${colors.blue}=== Fixing OpenAI Quota Issues ====${colors.reset}`);
  console.log("If you're seeing a 429 error (quota exceeded), you have a few options:\n");
  
  console.log(`${colors.yellow}1. Check your billing status${colors.reset}`);
  console.log("   - Log in to https://platform.openai.com/account/billing");
  console.log("   - Ensure you have billing information set up");
  console.log("   - Check your usage limits and adjust if needed\n");
  
  console.log(`${colors.yellow}2. Switch to a cheaper/smaller model${colors.reset}`);
  console.log("   - Mini models like gpt-4o-mini, o1-mini or o3-mini use much less quota");
  console.log("   - They offer good performance at lower cost\n");
  
  console.log(`${colors.yellow}3. Use a different OpenAI account${colors.reset}`);
  console.log("   - Create a new account at https://platform.openai.com");
  console.log("   - Get a new API key and update your .env file\n");
  
  console.log(`${colors.yellow}4. Switch to Claude as the primary provider${colors.reset}`);
  console.log("   - This will make the system use Claude for most operations");
  console.log("   - OpenAI will be used only as a fallback\n");
  
  const initialChoice = await askQuestion("What would you like to do? (1 = Change OpenAI model, 2 = Switch to Claude): ");
  
  // Change OpenAI model
  if (initialChoice === '1') {
    console.log(`\n${colors.blue}Available OpenAI models:${colors.reset}`);
    const modelOptions = [
      'gpt-3.5-turbo (legacy, balanced)',
      'gpt-4o (full-size model, best quality)',
      'gpt-4o-mini (smaller, faster, cheaper than 4o)',
      'o1-mini (specialized for reasoning, very fast)',
      'o3-mini (small vision model, fast)'
    ];
    
    modelOptions.forEach((model, index) => {
      console.log(`${colors.cyan}${index + 1}. ${model}${colors.reset}`);
    });
    
    const modelChoice = await askQuestion(`Choose a model (1-5, default: 3): `);
    let modelName = 'gpt-4o-mini'; // Default to gpt-4o-mini
    
    if (modelChoice === '1') {
      modelName = 'gpt-3.5-turbo';
    } else if (modelChoice === '2') {
      modelName = 'gpt-4o';
    } else if (modelChoice === '4') {
      modelName = 'o1-mini';
    } else if (modelChoice === '5') {
      modelName = 'o3-mini';
    }
    
    // Update the .env file with the selected model
    let envContent = readEnvFile();
    
    // Create a .env.old backup
    try {
      fs.writeFileSync(ENV_PATH + '.old', envContent);
      console.log(`${colors.yellow}Created backup of .env at .env.old${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Error creating backup: ${error.message}${colors.reset}`);
    }
    
    envContent = updateEnvVar(envContent, 'OPENAI_MODEL', modelName);
    
    if (writeEnvFile(envContent)) {
      console.log(`${colors.green}OpenAI model updated to: ${modelName}${colors.reset}`);
      console.log(`${colors.yellow}Your .env file has been updated with the new model selection.${colors.reset}`);
    }
  }
  // Switch to Claude
  else if (initialChoice === '2' || initialChoice.toLowerCase() === 'y') {
    // Update the .env file to prioritize Claude
    let envContent = readEnvFile();
    
    // Check if the user has a Claude API key
    const hasAnthropicKey = envContent.includes('ANTHROPIC_API_KEY=');
    
    if (!hasAnthropicKey) {
      console.log(`${colors.yellow}You don't have an Anthropic API key configured.${colors.reset}`);
      const setupKey = await askQuestion("Would you like to set up an Anthropic API key now? (y/n): ");
      
      if (setupKey.toLowerCase() === 'y') {
        const key = await askQuestion("Enter your Anthropic API key: ");
        if (key.trim()) {
          envContent = updateEnvVar(envContent, 'ANTHROPIC_API_KEY', key.trim());
          envContent = updateEnvVar(envContent, 'ANTHROPIC_MODEL', 'claude-3-sonnet-20240307');
          console.log(`${colors.green}Anthropic API key added.${colors.reset}`);
        }
      }
    }
    
    // Create a .env.old backup
    try {
      fs.writeFileSync(ENV_PATH + '.old', envContent);
      console.log(`${colors.yellow}Created backup of .env at .env.old${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Error creating backup: ${error.message}${colors.reset}`);
    }
    
    if (writeEnvFile(envContent)) {
      console.log(`${colors.green}Configuration updated to prioritize Claude.${colors.reset}`);
      console.log(`${colors.yellow}The system will now use Claude as the primary provider when available.${colors.reset}`);
    }
  }
}

/**
 * Fix Claude model issue
 */
async function fixClaudeModel() {
  console.log(`${colors.blue}=== Fixing Claude Model Issues ====${colors.reset}`);
  console.log("If you're seeing a 404 error with Claude models, it means the model name has changed.\n");
  
  console.log(`${colors.yellow}Available Claude models:${colors.reset}`);
  console.log("1. claude-3-sonnet-20240307 (recommended, balanced speed/quality)");
  console.log("2. claude-3-haiku-20240307 (faster, good for analysis)");
  console.log("3. claude-3-opus-20240229 (higher quality, slower)\n");
  
  const choice = await askQuestion("Which model would you like to use? (1-3, default: 1): ");
  
  let modelName = 'claude-3-sonnet-20240307';
  if (choice === '2') {
    modelName = 'claude-3-haiku-20240307';
  } else if (choice === '3') {
    modelName = 'claude-3-opus-20240229';
  }
  
  // Update the .env file with the correct model
  let envContent = readEnvFile();
  
  // Create a .env.old backup
  try {
    fs.writeFileSync(ENV_PATH + '.old', envContent);
    console.log(`${colors.yellow}Created backup of .env at .env.old${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error creating backup: ${error.message}${colors.reset}`);
  }
  
  envContent = updateEnvVar(envContent, 'ANTHROPIC_MODEL', modelName);
  
  if (writeEnvFile(envContent)) {
    console.log(`${colors.green}Claude model updated to: ${modelName}${colors.reset}`);
    console.log(`${colors.yellow}Your .env file has been updated with the correct model name.${colors.reset}`);
  }
}

/**
 * Show main menu and handle user choices
 */
async function showMainMenu() {
  console.log(`${colors.magenta}=== LLM API Issue Fix Tool ====${colors.reset}`);
  console.log("This tool will help you fix common issues with LLM API keys and models.\n");
  
  if (!checkEnvFile()) {
    console.log(`${colors.red}Failed to access .env file. Please check permissions and try again.${colors.reset}`);
    rl.close();
    return;
  }
  
  console.log(`${colors.blue}Choose an issue to fix:${colors.reset}`);
  console.log("1. OpenAI API quota exceeded or billing issues");
  console.log("2. Claude model not found error");
  console.log("3. Run API key test");
  console.log("4. Exit\n");
  
  const choice = await askQuestion("Enter your choice (1-4): ");
  
  switch (choice) {
    case '1':
      await fixOpenAIQuota();
      break;
    case '2':
      await fixClaudeModel();
      break;
    case '3':
      console.log(`${colors.yellow}Running API key test...${colors.reset}`);
      console.log(`${colors.cyan}Execute this command after this tool finishes:${colors.reset}`);
      console.log("node tests/test-llm-keys.js");
      break;
    case '4':
      console.log(`${colors.green}Exiting...${colors.reset}`);
      break;
    default:
      console.log(`${colors.red}Invalid choice. Please try again.${colors.reset}`);
      break;
  }
  
  // Unless we're exiting, ask if user wants to return to menu
  if (choice !== '4') {
    const returnToMenu = await askQuestion("\nWould you like to return to the main menu? (y/n): ");
    if (returnToMenu.toLowerCase() === 'y') {
      console.log("\n");
      await showMainMenu();
      return;
    }
  }
  
  console.log(`\n${colors.green}Thank you for using the LLM API Issue Fix Tool.${colors.reset}`);
  console.log(`${colors.cyan}Run 'node tests/test-llm-keys.js' to test your API keys.${colors.reset}`);
  rl.close();
}

// Start the tool
showMainMenu();