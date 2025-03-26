/**
 * Update Environment Model Names
 * 
 * This utility script updates model names in the .env file to use the latest versions
 * and standardize environment variable names for API keys.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

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

// Path to the .env file
const ENV_PATH = path.join(__dirname, '..', '.env');

/**
 * Update environment variables related to LLM models
 */
function updateEnvModels() {
  console.log(`${colors.magenta}=== LLM Environment Variable Updater ====${colors.reset}`);
  
  // Check if .env file exists
  if (!fs.existsSync(ENV_PATH)) {
    console.log(`${colors.yellow}No .env file found at ${ENV_PATH}${colors.reset}`);
    console.log(`Creating a new .env file with recommended settings...`);
    
    // Create a default .env file with recommended settings
    const defaultEnvContent = 
`# LLM API Keys
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# LLM Model Settings
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_MODEL=claude-3-haiku-20240307

# Optional: Cache TTL in milliseconds (24 hours by default)
LLM_CACHE_TTL=86400000
`;
    
    fs.writeFileSync(ENV_PATH, defaultEnvContent);
    console.log(`${colors.green}Created new .env file with template settings${colors.reset}`);
    console.log(`Please edit the file and add your actual API keys.`);
    return;
  }
  
  // Read the existing .env file
  let envContent = fs.readFileSync(ENV_PATH, 'utf8');
  let updated = false;
  
  console.log(`${colors.blue}Scanning existing .env file for updates...${colors.reset}`);
  
  // ========== Check for OpenAI API key variable name issues ==========
  const hasOpenAIKey = /^OPENAI_API_KEY=/m.test(envContent);
  const hasOldOpenAIKey = /^OPENAPI_KEY=/m.test(envContent);
  
  if (hasOldOpenAIKey && !hasOpenAIKey) {
    console.log(`${colors.yellow}Found OPENAPI_KEY but not OPENAI_API_KEY${colors.reset}`);
    
    // Extract the key value
    const openaiKeyMatch = envContent.match(/^OPENAPI_KEY=(.*)$/m);
    if (openaiKeyMatch && openaiKeyMatch[1]) {
      const openaiKey = openaiKeyMatch[1].trim();
      
      // Add the standardized variable with the same value
      envContent += `\nOPENAI_API_KEY=${openaiKey}\n`;
      console.log(`${colors.green}Added OPENAI_API_KEY with the same value as OPENAPI_KEY${colors.reset}`);
      
      // Optionally comment out the old variable
      // envContent = envContent.replace(/^OPENAPI_KEY=/m, '# OPENAPI_KEY=');
      
      updated = true;
    }
  }
  
  // ========== Update Claude model if using outdated version ==========
  // Load Claude model configuration if available
  let claudeModels = [];
  let defaultClaudeModel = 'claude-3-sonnet-20240307';
  try {
    const claudeConfigPath = path.join(__dirname, '..', 'config', 'claude-models.js');
    if (fs.existsSync(claudeConfigPath)) {
      const claudeConfig = require('../config/claude-models');
      claudeModels = claudeConfig.claudeModels;
      defaultClaudeModel = claudeConfig.defaultModel;
      console.log(`${colors.blue}Loaded Claude model configuration${colors.reset}`);
    }
  } catch (error) {
    console.warn(`${colors.yellow}Could not load Claude model configuration${colors.reset}`);
  }
  
  const claudeModelMatch = envContent.match(/^ANTHROPIC_MODEL=(.*)$/m);
  if (claudeModelMatch && claudeModelMatch[1]) {
    const claudeModel = claudeModelMatch[1].trim();
    
    // Check if model is outdated (contains date that's not the newest)
    const isOutdated = claudeModel === 'claude-3-sonnet-20240229' || 
                      claudeModel === 'claude-3-opus-20240229' ||
                      claudeModel === 'claude-instant-1.2';
    
    // Check if model exists in our configuration
    const isInConfig = claudeModels.length > 0 && claudeModels.includes(claudeModel);
    
    if (isOutdated || (!isInConfig && claudeModels.length > 0)) {
      console.log(`${colors.yellow}Found potentially outdated Claude model: ${claudeModel}${colors.reset}`);
      
      // Update to the newer model version
      envContent = envContent.replace(
        /^ANTHROPIC_MODEL=.*$/m, 
        `ANTHROPIC_MODEL=${defaultClaudeModel}`
      );
      console.log(`${colors.green}Updated Claude model to ${defaultClaudeModel}${colors.reset}`);
      
      updated = true;
    }
  } else {
    // If ANTHROPIC_MODEL is not defined, add it
    if (envContent.includes('ANTHROPIC_API_KEY') && !envContent.includes('ANTHROPIC_MODEL')) {
      envContent += `\nANTHROPIC_MODEL=${defaultClaudeModel}\n`;
      console.log(`${colors.green}Added ANTHROPIC_MODEL=${defaultClaudeModel}${colors.reset}`);
      
      updated = true;
    }
  }
  
  // ========== Check OpenAI model and add if missing ==========
  // Load OpenAI model configuration if available
  let openaiModels = [];
  let defaultOpenAIModel = 'gpt-4o-mini';
  try {
    const openaiConfigPath = path.join(__dirname, '..', 'config', 'openai-models.js');
    if (fs.existsSync(openaiConfigPath)) {
      const openaiConfig = require('../config/openai-models');
      openaiModels = openaiConfig.compatibleModels;
      // Get the default model from getBestModelForTask or use gpt-4o-mini
      defaultOpenAIModel = openaiConfig.getBestModelForTask 
        ? openaiConfig.getBestModelForTask('general') 
        : 'gpt-4o-mini';
      console.log(`${colors.blue}Loaded OpenAI model configuration${colors.reset}`);
    }
  } catch (error) {
    console.warn(`${colors.yellow}Could not load OpenAI model configuration${colors.reset}`);
  }
  
  const openaiModelMatch = envContent.match(/^OPENAI_MODEL=(.*)$/m);
  if (openaiModelMatch && openaiModelMatch[1]) {
    const openaiModel = openaiModelMatch[1].trim();
    
    // Check if model is outdated or not in our configuration
    const isInConfig = openaiModels.length > 0 && openaiModels.includes(openaiModel);
    const isOutdated = openaiModel === 'gpt-4-32k' || 
                      openaiModel === 'gpt-3.5-turbo-0613' ||
                      openaiModel === 'text-davinci-003';
    
    if (isOutdated || (!isInConfig && openaiModels.length > 0)) {
      console.log(`${colors.yellow}Found potentially outdated OpenAI model: ${openaiModel}${colors.reset}`);
      
      // Update to the recommended model
      envContent = envContent.replace(
        /^OPENAI_MODEL=.*$/m, 
        `OPENAI_MODEL=${defaultOpenAIModel}`
      );
      console.log(`${colors.green}Updated OpenAI model to ${defaultOpenAIModel}${colors.reset}`);
      
      updated = true;
    }
  } else if (!openaiModelMatch && (hasOpenAIKey || hasOldOpenAIKey)) {
    console.log(`${colors.yellow}OpenAI API key found but no model specified${colors.reset}`);
    
    // Add the recommended model
    envContent += `\nOPENAI_MODEL=${defaultOpenAIModel}\n`;
    console.log(`${colors.green}Added OPENAI_MODEL=${defaultOpenAIModel}${colors.reset}`);
    
    updated = true;
  }
  
  // ========== Write the updated content back to the file ==========
  if (updated) {
    // Make sure file has reasonable formatting
    envContent = envContent.replace(/\n\n+/g, '\n\n');
    if (!envContent.endsWith('\n')) {
      envContent += '\n';
    }
    
    fs.writeFileSync(ENV_PATH, envContent);
    console.log(`${colors.green}.env file updated successfully!${colors.reset}`);
  } else {
    console.log(`${colors.cyan}No updates needed to .env file${colors.reset}`);
  }
  
  // ========== Load the updated .env file and display current settings ==========
  dotenv.config({ path: ENV_PATH, override: true });
  
  console.log(`\n${colors.magenta}Current LLM Settings:${colors.reset}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Present' : 'Not set'}`);
  console.log(`OpenAI Model: ${process.env.OPENAI_MODEL || 'Not set'}`);
  console.log(`Claude API Key: ${process.env.ANTHROPIC_API_KEY ? 'Present' : 'Not set'}`);
  console.log(`Claude Model: ${process.env.ANTHROPIC_MODEL || 'Not set'}`);
  
  console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
  console.log(`1. If API keys are missing, add them to your .env file`);
  console.log(`2. Run node tests/llm-service-test.js to verify your configuration`);
  console.log(`3. Try generating content with node tests/multi-llm-test.js`);
}

// Run the update function
updateEnvModels();