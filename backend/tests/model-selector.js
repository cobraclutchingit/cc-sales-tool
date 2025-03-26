/**
 * OpenAI Model Selector and Tester
 * 
 * This script displays all available OpenAI models and lets you select and test them.
 * It requires a valid OpenAI API key in the .env file or as a command-line argument.
 */

const OpenAI = require('openai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get API key from environment or command line
let apiKey = process.env.OPENAI_API_KEY || process.env.OPENAPI_KEY;
if (process.argv.length > 2) {
  apiKey = process.argv[2];
}

if (!apiKey) {
  console.error(`${colors.red}No OpenAI API key found. Please provide it in the .env file or as a command-line argument.${colors.reset}`);
  console.error(`Usage: node model-selector.js [api_key]`);
  process.exit(1);
}

// Helper function for prompting
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
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
 * Display models interactively with selection
 */
async function displayModelsInteractive(modelFamilies) {
  // Build list of chat completion models only
  const chatModels = [];
  
  // Get compatible model families
  const compatibleFamilies = ['gpt-4', 'gpt-3.5', 'o3', 'o1'];
  
  Object.keys(modelFamilies)
    .filter(family => compatibleFamilies.includes(family))
    .sort()
    .forEach(family => {
      console.log(`${colors.cyan}${family.toUpperCase()} MODELS${colors.reset}`);
      console.log('=' + '='.repeat(family.length + 7));
      
      modelFamilies[family].forEach((model, index) => {
        chatModels.push(model.id);
        console.log(`${colors.yellow}${chatModels.length}${colors.reset}. ${colors.green}${model.id}${colors.reset} (${formatDate(model.created)})`);
      });
      
      console.log(''); // Add spacing between families
    });
  
  // Let user select a model
  const choice = await askQuestion(`${colors.magenta}Select a model (1-${chatModels.length}):${colors.reset} `);
  const modelIndex = parseInt(choice) - 1;
  
  if (isNaN(modelIndex) || modelIndex < 0 || modelIndex >= chatModels.length) {
    console.log(`${colors.red}Invalid selection. Please try again.${colors.reset}`);
    return null;
  }
  
  return chatModels[modelIndex];
}

/**
 * Test selected model with a simple prompt
 */
async function testSelectedModel(modelId) {
  console.log(`${colors.blue}Testing model: ${modelId}...${colors.reset}`);
  
  // Ask for a prompt
  const defaultPrompt = "What are 3 key benefits of AI-powered construction site monitoring?";
  const customPrompt = await askQuestion(`${colors.magenta}Enter a prompt (press Enter for default):${colors.reset} `);
  const prompt = customPrompt.trim() || defaultPrompt;
  
  try {
    const openai = new OpenAI({ apiKey });
    const startTime = Date.now();
    
    console.log(`${colors.yellow}Sending request to ${modelId}...${colors.reset}`);
    
    const response = await openai.chat.completions.create({
      model: modelId,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const latency = Date.now() - startTime;
    const generatedText = response.choices[0].message.content;
    
    console.log(`\n${colors.green}Response (${latency}ms):${colors.reset}`);
    console.log(`${'-'.repeat(80)}`);
    console.log(generatedText);
    console.log(`${'-'.repeat(80)}`);
    
    // Total tokens used
    console.log(`${colors.blue}Total tokens: ${response.usage.total_tokens} (Prompt: ${response.usage.prompt_tokens}, Completion: ${response.usage.completion_tokens})${colors.reset}`);
    
    return {
      model: modelId,
      prompt,
      response: generatedText,
      latency,
      tokens: response.usage
    };
  } catch (error) {
    console.error(`${colors.red}Error testing model: ${error.message}${colors.reset}`);
    
    if (error.message.includes('404') || error.message.includes('model_not_found')) {
      console.log(`${colors.yellow}This model may not be available for your account or has been deprecated.${colors.reset}`);
    } else if (error.message.includes('429')) {
      console.log(`${colors.yellow}Rate limit hit. Try again later or use a different model.${colors.reset}`);
    }
    
    return null;
  }
}

/**
 * Update environment file with selected model
 */
async function updateEnvironmentFile(modelId) {
  const shouldUpdate = await askQuestion(`${colors.magenta}Would you like to set ${modelId} as your default model in .env? (y/n):${colors.reset} `);
  
  if (shouldUpdate.toLowerCase() !== 'y') {
    return false;
  }
  
  try {
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add OPENAI_MODEL
    const modelRegex = /^OPENAI_MODEL=.*/m;
    if (modelRegex.test(envContent)) {
      envContent = envContent.replace(modelRegex, `OPENAI_MODEL=${modelId}`);
    } else {
      envContent += `\nOPENAI_MODEL=${modelId}\n`;
    }
    
    // Write back to .env
    fs.writeFileSync(envPath, envContent);
    console.log(`${colors.green}Updated .env file with OPENAI_MODEL=${modelId}${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error updating .env file: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.magenta}=== OpenAI Model Selector ====${colors.reset}`);
  
  // Fetch models
  const models = await fetchAvailableModels();
  
  // Group models by family
  const modelFamilies = groupModelsByFamily(models);
  
  // User selects a model
  const selectedModel = await displayModelsInteractive(modelFamilies);
  
  if (selectedModel) {
    // Test the selected model
    const testResult = await testSelectedModel(selectedModel);
    
    if (testResult) {
      // Update environment file if desired
      await updateEnvironmentFile(selectedModel);
      
      console.log(`\n${colors.blue}To use this model in your code:${colors.reset}`);
      console.log(`OPENAI_MODEL=${selectedModel}`);
    }
  }
  
  rl.close();
}

// Run the main function
main().catch(console.error);