/**
 * OpenAI Models List
 * 
 * This script fetches and displays all available models from OpenAI.
 * It requires a valid OpenAI API key in the .env file or as a command-line argument.
 */

const OpenAI = require('openai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

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

// Load environment variables
dotenv.config();

// Get API key from environment or command line
let apiKey = process.env.OPENAI_API_KEY || process.env.OPENAPI_KEY;
if (process.argv.length > 2) {
  apiKey = process.argv[2];
}

if (!apiKey) {
  console.error(`${colors.red}No OpenAI API key found. Please provide it in the .env file or as a command-line argument.${colors.reset}`);
  console.error(`Usage: node openai-models-list.js [api_key]`);
  process.exit(1);
}

/**
 * Fetch all available models from OpenAI API
 */
async function fetchAvailableModels() {
  console.log(`${colors.blue}Fetching available OpenAI models...${colors.reset}`);
  
  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.models.list();
    
    // Extract model data
    const models = response.data || [];
    console.log(`${colors.green}Found ${models.length} models.${colors.reset}\n`);
    
    return models;
  } catch (error) {
    console.error(`${colors.red}Error fetching models: ${error.message}${colors.reset}`);
    if (error.message.includes('401')) {
      console.error(`${colors.yellow}Authentication error. Please check your API key.${colors.reset}`);
    }
    process.exit(1);
  }
}

/**
 * Group models by family
 */
function groupModelsByFamily(models) {
  const families = {};
  
  models.forEach(model => {
    const id = model.id;
    let family = 'other';
    
    if (id.startsWith('gpt-4')) family = 'gpt-4';
    else if (id.startsWith('gpt-3.5')) family = 'gpt-3.5';
    else if (id.includes('o3')) family = 'o3';
    else if (id.includes('o1')) family = 'o1';
    else if (id.includes('whisper')) family = 'whisper';
    else if (id.includes('embeddings')) family = 'embeddings';
    else if (id.includes('dall-e')) family = 'dall-e';
    else if (id.includes('tts')) family = 'tts';
    
    if (!families[family]) families[family] = [];
    families[family].push(model);
  });
  
  // Sort models within each family
  Object.keys(families).forEach(family => {
    families[family].sort((a, b) => {
      // Sort by created date (newest first)
      return new Date(b.created) - new Date(a.created);
    });
  });
  
  return families;
}

/**
 * Format date for display
 */
function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toISOString().split('T')[0];
}

/**
 * Display models in a nice format
 */
function displayModels(modelFamilies) {
  console.log(`${colors.magenta}=== OpenAI Models by Family ====${colors.reset}\n`);
  
  // Display models by family
  Object.keys(modelFamilies).sort().forEach(family => {
    console.log(`${colors.cyan}${family.toUpperCase()}${colors.reset}`);
    console.log(`${'='.repeat(family.length)}`);
    
    modelFamilies[family].forEach(model => {
      console.log(`- ${colors.green}${model.id}${colors.reset} (Created: ${formatDate(model.created)})`);
    });
    
    console.log(''); // Add spacing between families
  });
}

/**
 * Generate model configuration for multiLLMService.js
 */
function generateModelConfig(modelFamilies) {
  const modelConfig = {};
  
  // Get chat models that are suitable for generation
  const chatModels = [];
  
  Object.keys(modelFamilies).forEach(family => {
    modelFamilies[family].forEach(model => {
      const id = model.id;
      
      // Skip non-chat models
      if (family === 'embeddings' || family === 'whisper' || 
          family === 'dall-e' || family === 'tts') {
        return;
      }
      
      // Skip old deprecated models
      if (id.includes('0301') || id.includes('0613')) {
        return;
      }
      
      // Skip base models ending with "-base"
      if (id.endsWith('-base')) {
        return;
      }
      
      // Parameters based on model family
      const isMiniModel = id.includes('mini') || id.includes('o1-') || id.includes('o3-');
      const isGPT4 = id.startsWith('gpt-4');
      
      modelConfig[id] = {
        temperature: isMiniModel ? 0.5 : isGPT4 ? 0.7 : 0.75,
        maxTokens: isMiniModel ? 1000 : isGPT4 ? 1000 : 800,
        best_for: []
      };
      
      // Determine what tasks the model is best for
      if (isGPT4 || id.includes('gpt-4')) {
        modelConfig[id].best_for.push('complex');
        
        if (id.includes('vision')) {
          modelConfig[id].best_for.push('vision');
        }
      }
      
      if (isMiniModel) {
        modelConfig[id].best_for.push('fast');
        modelConfig[id].best_for.push('cost-effective');
      }
      
      if (id.includes('turbo')) {
        modelConfig[id].best_for.push('general');
        modelConfig[id].best_for.push('fast');
      }
      
      chatModels.push(id);
    });
  });
  
  return {
    compatibleModels: chatModels.sort(),
    modelConfig
  };
}

/**
 * Save model configuration to file
 */
function saveModelConfig(config) {
  const configOutput = 
`/**
 * OpenAI Models Configuration
 * Last updated: ${new Date().toISOString().split('T')[0]}
 * 
 * This file is auto-generated. Do not edit directly.
 */

// Compatible chat completion models (suitable for text generation)
exports.compatibleModels = ${JSON.stringify(config.compatibleModels, null, 2)};

// Model specific configurations
exports.modelConfig = ${JSON.stringify(config.modelConfig, null, 2)};
`;

  const configPath = path.join(__dirname, '..', 'config', 'openai-models.js');
  
  // Ensure the directory exists
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, configOutput);
  console.log(`${colors.green}Model configuration saved to: ${configPath}${colors.reset}`);
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.magenta}=== OpenAI Models Explorer ====${colors.reset}`);
  
  // Fetch models
  const models = await fetchAvailableModels();
  
  // Group models by family
  const modelFamilies = groupModelsByFamily(models);
  
  // Display models
  displayModels(modelFamilies);
  
  // Generate and save model configuration
  const config = generateModelConfig(modelFamilies);
  saveModelConfig(config);
  
  console.log(`${colors.blue}Model Explorer Complete${colors.reset}`);
  console.log(`${colors.yellow}To use these models, set OPENAI_MODEL=model_name in your .env file${colors.reset}`);
  console.log(`${colors.yellow}Suggested models for chat completions:${colors.reset}`);
  console.log(`- gpt-4o (best quality)`);
  console.log(`- gpt-4o-mini (good balance between quality and speed)`);
  console.log(`- gpt-3.5-turbo (fastest response, lower cost)`);
}

// Run the main function
main().catch(console.error);