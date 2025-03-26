/**
 * LLM Model Selector and Testing Tool
 * 
 * This script provides an interactive way to test different LLM models
 * and select the optimal ones for your use case.
 */

const readline = require('readline');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Load model configurations
let openAIModelConfig = { compatibleModels: [], modelConfig: {} };
let claudeModelConfig = { claudeModels: [], modelConfig: {}, defaultModel: 'claude-3-sonnet-latest' };

try {
  const openaiConfigPath = path.join(__dirname, '..', 'config', 'openai-models.js');
  if (fs.existsSync(openaiConfigPath)) {
    openAIModelConfig = require('../config/openai-models');
    console.log(`Loaded OpenAI configurations for ${openAIModelConfig.compatibleModels.length} models`);
  }
} catch (error) {
  console.warn('OpenAI model configuration not found or invalid.');
}

try {
  const claudeConfigPath = path.join(__dirname, '..', 'config', 'claude-models.js');
  if (fs.existsSync(claudeConfigPath)) {
    claudeModelConfig = require('../config/claude-models');
    console.log(`Loaded Claude configurations for ${claudeModelConfig.claudeModels.length} models`);
  }
} catch (error) {
  console.warn('Claude model configuration not found or invalid.');
}

// Initialize clients
let openai = null;
let claude = null;

// Try to initialize OpenAI client
const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENAPI_KEY;
if (openaiKey) {
  try {
    openai = new OpenAI({ apiKey: openaiKey });
    console.log('✓ OpenAI client initialized successfully');
  } catch (error) {
    console.error('✗ Error initializing OpenAI client:', error.message);
  }
} else {
  console.warn('✗ OpenAI API key not found in environment variables');
}

// Try to initialize Claude client
if (process.env.ANTHROPIC_API_KEY) {
  try {
    claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    console.log('✓ Claude client initialized successfully');
  } catch (error) {
    console.error('✗ Error initializing Claude client:', error.message);
  }
} else {
  console.warn('✗ Claude API key not found in environment variables');
}

// Test prompts for different tasks
const TEST_PROMPTS = {
  profile: `Create a brief personalized email for John Smith, who works as a Project Manager at ABC Construction.
His interests include safety innovations, project efficiency, and sustainable building methods.
Focus on how our AI-powered surveillance system could benefit his role in safety compliance and project tracking.
Keep the email professional, concise (150 words), and with a clear call to action for a 15-minute demo.`,

  analysis: `Analyze the following client message:
"I'm interested in your construction surveillance system, but I'm concerned about the implementation time and ROI. 
Can you provide more details on how long it takes to set up and what kind of returns we can expect?"

Provide an analysis in JSON format with:
1. sentiment
2. main topics
3. questions that need answers`,

  creative: `Create a metaphor that explains how our AI-powered surveillance system works like having four extra specialized employees on a construction site. Make it vivid, memorable, and relatable to construction professionals.`
};

/**
 * Run a comparison test between different models
 */
async function runModelComparison() {
  // Check if we have any clients
  if (!openai && !claude) {
    console.error('\n⚠️  No LLM clients initialized. Please check your API keys and try again.');
    process.exit(1);
  }

  console.log('\n=== LLM MODEL COMPARISON TOOL ===');
  console.log('This tool helps you test and compare different language models for your specific needs.\n');

  // Select a task
  console.log('Available test tasks:');
  console.log('1. Sales Email Generation (profile)');
  console.log('2. Message Analysis (analysis)');
  console.log('3. Creative Content (creative)');
  console.log('4. Custom Prompt (custom)');

  const taskChoice = await askQuestion('Select a task number (1-4): ');
  
  let prompt = '';
  let taskType = '';
  
  if (taskChoice === '1') {
    prompt = TEST_PROMPTS.profile;
    taskType = 'profile';
  } else if (taskChoice === '2') {
    prompt = TEST_PROMPTS.analysis;
    taskType = 'analysis';
  } else if (taskChoice === '3') {
    prompt = TEST_PROMPTS.creative;
    taskType = 'creative';
  } else if (taskChoice === '4') {
    prompt = await askQuestion('Enter your custom prompt: ');
    taskType = 'custom';
  } else {
    console.log('Invalid choice. Using profile task.');
    prompt = TEST_PROMPTS.profile;
    taskType = 'profile';
  }
  
  console.log(`\nSelected task: ${taskType}`);
  console.log('Prompt:');
  console.log('-------------------');
  console.log(prompt);
  console.log('-------------------\n');
  
  // Select Claude models to test
  let selectedClaudeModels = [];
  if (claude && claudeModelConfig.claudeModels.length > 0) {
    console.log('\nAvailable Claude models:');
    claudeModelConfig.claudeModels.forEach((model, index) => {
      const config = claudeModelConfig.modelConfig[model] || {};
      console.log(`${index + 1}. ${model} - ${config.description || ''}`);
    });
    
    const claudeChoices = await askQuestion('Select Claude models to test (comma-separated numbers, 0 for all, empty for none): ');
    
    if (claudeChoices.trim() !== '') {
      if (claudeChoices === '0') {
        selectedClaudeModels = [...claudeModelConfig.claudeModels];
      } else {
        const choiceArray = claudeChoices.split(',').map(n => parseInt(n.trim()));
        selectedClaudeModels = choiceArray
          .filter(n => n > 0 && n <= claudeModelConfig.claudeModels.length)
          .map(n => claudeModelConfig.claudeModels[n - 1]);
      }
    }
  }
  
  // Select OpenAI models to test
  let selectedOpenAIModels = [];
  if (openai && openAIModelConfig.compatibleModels.length > 0) {
    console.log('\nAvailable OpenAI models:');
    openAIModelConfig.compatibleModels.forEach((model, index) => {
      const config = openAIModelConfig.modelConfig[model] || {};
      console.log(`${index + 1}. ${model} - ${config.description || ''}`);
    });
    
    const openaiChoices = await askQuestion('Select OpenAI models to test (comma-separated numbers, 0 for all, empty for none): ');
    
    if (openaiChoices.trim() !== '') {
      if (openaiChoices === '0') {
        // Limit to 5 models if "all" is selected to prevent excessive API calls
        selectedOpenAIModels = [...openAIModelConfig.compatibleModels].slice(0, 5);
      } else {
        const choiceArray = openaiChoices.split(',').map(n => parseInt(n.trim()));
        selectedOpenAIModels = choiceArray
          .filter(n => n > 0 && n <= openAIModelConfig.compatibleModels.length)
          .map(n => openAIModelConfig.compatibleModels[n - 1]);
      }
    }
  }
  
  // Make sure we have at least one model selected
  if (selectedClaudeModels.length === 0 && selectedOpenAIModels.length === 0) {
    console.log('\n⚠️  No models selected. Please try again.');
    return;
  }
  
  console.log('\nRunning comparison with the following models:');
  selectedClaudeModels.forEach(model => console.log(`- Claude: ${model}`));
  selectedOpenAIModels.forEach(model => console.log(`- OpenAI: ${model}`));
  
  console.log('\nGenerating responses...');
  
  // Test selected Claude models
  for (const model of selectedClaudeModels) {
    try {
      console.log(`\nTesting Claude model: ${model}`);
      const startTime = Date.now();
      
      const modelConfig = claudeModelConfig.modelConfig[model] || { maxTokens: 2000, temperature: 0.7 };
      
      const response = await claude.messages.create({
        model: model,
        max_tokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
        messages: [{ role: "user", content: prompt }]
      });
      
      const endTime = Date.now();
      const elapsedTime = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`✓ Response generated in ${elapsedTime}s`);
      console.log('-------------------');
      console.log(response.content[0].text);
      console.log('-------------------');
      
      // Ask for rating
      const rating = await askQuestion('Rate this response (1-5): ');
      console.log(`You rated ${model}: ${rating}/5`);
      
    } catch (error) {
      console.error(`✗ Error with Claude model ${model}:`, error.message);
    }
  }
  
  // Test selected OpenAI models
  for (const model of selectedOpenAIModels) {
    try {
      console.log(`\nTesting OpenAI model: ${model}`);
      const startTime = Date.now();
      
      const modelConfig = openAIModelConfig.modelConfig[model] || { maxTokens: 2000, temperature: 0.7 };
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature
      });
      
      const endTime = Date.now();
      const elapsedTime = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`✓ Response generated in ${elapsedTime}s`);
      console.log('-------------------');
      console.log(response.choices[0].message.content);
      console.log('-------------------');
      
      // Ask for rating
      const rating = await askQuestion('Rate this response (1-5): ');
      console.log(`You rated ${model}: ${rating}/5`);
      
    } catch (error) {
      console.error(`✗ Error with OpenAI model ${model}:`, error.message);
    }
  }
  
  // Get final model preferences
  console.log('\n=== MODEL SELECTION ===');
  
  const preferredClaudeModel = await askQuestion('Enter your preferred Claude model: ');
  const preferredOpenAIModel = await askQuestion('Enter your preferred OpenAI model: ');
  
  console.log('\nBased on your tests, update your .env file with:');
  if (preferredClaudeModel) {
    console.log(`ANTHROPIC_MODEL=${preferredClaudeModel}`);
  }
  if (preferredOpenAIModel) {
    console.log(`OPENAI_MODEL=${preferredOpenAIModel}`);
  }
}

/**
 * Helper function to ask a question and get user input
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Main function
 */
async function main() {
  try {
    await runModelComparison();
  } catch (error) {
    console.error('Error running model comparison:', error);
  } finally {
    rl.close();
  }
}

// Run the main function
main();