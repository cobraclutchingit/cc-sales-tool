/**
 * Setup LLM API Keys Helper Script
 * 
 * This script helps users set up their API keys for OpenAI and Claude (Anthropic)
 * by adding them to the .env file.
 * 
 * Usage: node utils/setup-llm-keys.js
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

// Helper function to prompt for user input
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Path to .env file
const ENV_PATH = path.join(__dirname, '..', '.env');

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
 * Main function
 */
async function setupLLMKeys() {
  console.log(`${colors.magenta}=== LLM API Keys Setup ====${colors.reset}`);
  console.log('This script will help you set up your API keys for OpenAI and Claude (Anthropic).\n');
  
  // Check if .env file exists
  if (!checkEnvFile()) {
    console.log(`${colors.red}Failed to create .env file. Please check file permissions and try again.${colors.reset}`);
    rl.close();
    return;
  }
  
  // Read current .env content
  let envContent = readEnvFile();
  
  // Setup OpenAI API key
  console.log(`${colors.blue}Setting up OpenAI API key...${colors.reset}`);
  console.log(`${colors.cyan}You can get an API key from: https://platform.openai.com/api-keys${colors.reset}`);
  
  const openaiKey = await askQuestion(`Enter your OpenAI API key (leave blank to skip): `);
  
  if (openaiKey.trim()) {
    envContent = updateEnvVar(envContent, 'OPENAI_API_KEY', openaiKey.trim());
    
    // Ask for model preference
    console.log(`\n${colors.blue}Setting up OpenAI model preference...${colors.reset}`);
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
    
    envContent = updateEnvVar(envContent, 'OPENAI_MODEL', modelName);
    console.log(`${colors.green}OpenAI model set to: ${modelName}${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Skipping OpenAI API key setup.${colors.reset}`);
  }
  
  // Setup Anthropic (Claude) API key
  console.log(`\n${colors.blue}Setting up Anthropic (Claude) API key...${colors.reset}`);
  console.log(`${colors.cyan}You can get an API key from: https://console.anthropic.com/settings/keys${colors.reset}`);
  
  const anthropicKey = await askQuestion(`Enter your Anthropic API key (leave blank to skip): `);
  
  if (anthropicKey.trim()) {
    envContent = updateEnvVar(envContent, 'ANTHROPIC_API_KEY', anthropicKey.trim());
    
    // Ask for model preference
    console.log(`\n${colors.blue}Setting up Claude model preference...${colors.reset}`);
    const claudeOptions = [
      'claude-3-sonnet-20240307 (balanced speed and quality)',
      'claude-3-haiku-20240307 (fastest, good for analysis)',
      'claude-3-opus-20240229 (highest quality, slower)'
    ];
    
    claudeOptions.forEach((model, index) => {
      console.log(`${colors.cyan}${index + 1}. ${model}${colors.reset}`);
    });
    
    const claudeChoice = await askQuestion(`Choose a model (1-3, default: 1): `);
    let claudeName = 'claude-3-sonnet-20240307';
    
    if (claudeChoice === '2') {
      claudeName = 'claude-3-haiku-20240307';
    } else if (claudeChoice === '3') {
      claudeName = 'claude-3-opus-20240229';
    }
    
    envContent = updateEnvVar(envContent, 'ANTHROPIC_MODEL', claudeName);
    console.log(`${colors.green}Claude model set to: ${claudeName}${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Skipping Anthropic API key setup.${colors.reset}`);
  }
  
  // Write updated content to .env file
  if (writeEnvFile(envContent)) {
    console.log(`\n${colors.green}API keys have been successfully added to the .env file.${colors.reset}`);
    console.log(`${colors.yellow}To test your API keys, run: node tests/test-llm-keys.js${colors.reset}`);
  } else {
    console.log(`\n${colors.red}Failed to update .env file. Please check file permissions and try again.${colors.reset}`);
  }
  
  rl.close();
}

// Run the setup
setupLLMKeys();