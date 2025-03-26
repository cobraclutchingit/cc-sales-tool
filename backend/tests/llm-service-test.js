/**
 * LLM Service Test
 * 
 * This script tests the core LLM service functionality including:
 * - Environment variable detection
 * - API client initialization
 * - Model selection logic
 * - Caching functionality
 * - Error handling and fallbacks
 */

const dotenv = require('dotenv');
const multiLLMService = require('../services/multiLLMService');
const { llmCache } = require('../services/llmService');

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
 * Test environment variables and configuration
 */
async function testEnvironmentConfig() {
  console.log(`${colors.magenta}=== Testing Environment Configuration ====${colors.reset}`);
  
  // Check OpenAI configuration
  const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENAPI_KEY;
  const openaiModel = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
  
  console.log(`OpenAI API Key: ${openaiKey ? colors.green + 'Found' : colors.red + 'Not found'}`);
  if (openaiKey) {
    console.log(`OpenAI Key format: ${openaiKey.startsWith('sk-') ? colors.green + 'Valid' : colors.red + 'Invalid'}`);
  }
  console.log(`OpenAI Model: ${colors.cyan}${openaiModel}${colors.reset}`);
  
  // Check Claude configuration
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  const claudeModel = process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240307";
  
  console.log(`\nClaude API Key: ${claudeKey ? colors.green + 'Found' : colors.red + 'Not found'}`);
  if (claudeKey) {
    console.log(`Claude Key format: ${claudeKey.startsWith('sk-ant-') ? colors.green + 'Valid' : colors.red + 'Invalid'}`);
  }
  console.log(`Claude Model: ${colors.cyan}${claudeModel}${colors.reset}`);
  
  // Check for API key conflicts or issues
  if (openaiKey && openaiKey === claudeKey) {
    console.log(`\n${colors.red}WARNING: OpenAI and Claude have the same API key - this is incorrect!${colors.reset}`);
  }
  
  // Check for environment naming issues
  if (process.env.OPENAPI_KEY && !process.env.OPENAI_API_KEY) {
    console.log(`\n${colors.yellow}Note: Found OPENAPI_KEY but not OPENAI_API_KEY. The service should handle this automatically, but renaming to OPENAI_API_KEY is recommended.${colors.reset}`);
  }
  
  return {
    openaiConfigured: openaiKey && openaiKey.startsWith('sk-'),
    claudeConfigured: claudeKey && claudeKey.startsWith('sk-ant-')
  };
}

/**
 * Test service initialization
 */
async function testServiceInitialization() {
  console.log(`\n${colors.magenta}=== Testing LLM Service Initialization ====${colors.reset}`);
  
  try {
    console.log(`Initializing multiLLMService...`);
    await multiLLMService.initialize();
    console.log(`${colors.green}Service initialized successfully!${colors.reset}`);
    
    // Check which providers are available
    const models = multiLLMService.models;
    console.log(`\nAvailable models:`);
    console.log(`- OpenAI: ${models.openai ? colors.green + 'Available' : colors.red + 'Not available'}`);
    console.log(`- Claude: ${models.claude ? colors.green + 'Available' : colors.red + 'Not available'}`);
    
    return {
      openaiAvailable: !!models.openai,
      claudeAvailable: !!models.claude
    };
  } catch (error) {
    console.log(`${colors.red}Error initializing service: ${error.message}${colors.reset}`);
    return {
      openaiAvailable: false,
      claudeAvailable: false,
      error: error.message
    };
  }
}

/**
 * Test model selection logic
 */
function testModelSelection() {
  console.log(`\n${colors.magenta}=== Testing Model Selection Logic ====${colors.reset}`);
  
  const testCases = [
    { task: 'warmFollowup', context: { contentLength: 3000 }, expected: 'claude' },
    { task: 'messageAnalysis', context: {}, expected: 'openai' },
    { task: 'profileContent', context: { contentLength: 1000 }, expected: 'any' },
  ];
  
  for (const testCase of testCases) {
    const { model, name } = multiLLMService.selectModelForTask(testCase.task, testCase.context);
    
    console.log(`\nTask: ${colors.cyan}${testCase.task}${colors.reset}`);
    console.log(`Context: ${JSON.stringify(testCase.context)}`);
    console.log(`Selected model: ${colors.yellow}${name || 'none'}${colors.reset}`);
    
    if (testCase.expected === 'any') {
      console.log(`Result: ${name ? colors.green + 'PASS' : colors.red + 'FAIL'} (Expected any model)`);
    } else {
      console.log(`Result: ${name === testCase.expected ? colors.green + 'PASS' : colors.red + 'FAIL'} (Expected ${testCase.expected})`);
    }
  }
}

/**
 * Test caching functionality
 */
function testCaching() {
  console.log(`\n${colors.magenta}=== Testing LLM Cache ====${colors.reset}`);
  
  // Test cache key generation
  const prompt = "This is a test prompt with some content that should be normalized   and trimmed.";
  const model = "test-model";
  const task = "test-task";
  
  const key = llmCache.generateKey(prompt, model, task);
  console.log(`Generated cache key: ${colors.cyan}${key}${colors.reset}`);
  
  // Test cache operations
  const testValue = "This is a test cached response";
  llmCache.set(prompt, model, task, testValue);
  
  const cachedValue = llmCache.get(prompt, model, task);
  console.log(`Cache set/get: ${cachedValue === testValue ? colors.green + 'PASS' : colors.red + 'FAIL'}`);
  
  // Get cache stats
  const stats = llmCache.getStats();
  console.log(`\nCache statistics:`);
  console.log(`- Size: ${stats.cacheSize} items`);
  console.log(`- Hits: ${stats.hits}`);
  console.log(`- Misses: ${stats.misses}`);
  console.log(`- Hit rate: ${stats.hitRate}%`);
}

/**
 * Display configuration recommendations
 */
function displayRecommendations(envConfig, serviceStatus) {
  console.log(`\n${colors.magenta}=== Recommendations ====${colors.reset}`);
  
  if (!envConfig.openaiConfigured && !envConfig.claudeConfigured) {
    console.log(`${colors.red}No LLM API keys found. Add the following to your .env file:${colors.reset}`);
    console.log(`OPENAI_API_KEY=sk-your-openai-key`);
    console.log(`OPENAI_MODEL=gpt-4o-mini`);
    console.log(`ANTHROPIC_API_KEY=sk-ant-your-claude-key`);
    console.log(`ANTHROPIC_MODEL=claude-3-haiku-20240307`);
  } else {
    if (!envConfig.openaiConfigured) {
      console.log(`${colors.yellow}OpenAI API key not found or invalid. Add to your .env file:${colors.reset}`);
      console.log(`OPENAI_API_KEY=sk-your-openai-key`);
      console.log(`OPENAI_MODEL=gpt-4o-mini`);
    }
    
    if (!envConfig.claudeConfigured) {
      console.log(`${colors.yellow}Claude API key not found or invalid. Add to your .env file:${colors.reset}`);
      console.log(`ANTHROPIC_API_KEY=sk-ant-your-claude-key`);
      console.log(`ANTHROPIC_MODEL=claude-3-haiku-20240307`);
    }
  }
  
  if (process.env.OPENAPI_KEY && !process.env.OPENAI_API_KEY) {
    console.log(`\n${colors.yellow}You're using OPENAPI_KEY instead of OPENAI_API_KEY. While this works due to built-in compatibility, consider updating to:${colors.reset}`);
    console.log(`OPENAI_API_KEY=${process.env.OPENAPI_KEY}`);
  }
  
  // Check for outdated model names
  if (process.env.ANTHROPIC_MODEL && process.env.ANTHROPIC_MODEL.includes('claude-3-sonnet-20240229')) {
    console.log(`\n${colors.yellow}You're using an outdated Claude model. Update to:${colors.reset}`);
    console.log(`ANTHROPIC_MODEL=claude-3-sonnet-20240307`);
  }
  
  console.log(`\n${colors.cyan}For troubleshooting:${colors.reset}`);
  console.log(`1. Run tests/api-quick-test.js after adding your API keys to verify direct API access`);
  console.log(`2. Check your API quotas and limits in your OpenAI and Anthropic dashboards`);
  console.log(`3. Ensure your IP is not blocked by either API provider`);
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.magenta}=== LLM Service Diagnostic Tool ====${colors.reset}`);
  console.log(`This tool checks your LLM service configuration and helps resolve issues.\n`);
  
  // Check environment configuration
  const envConfig = await testEnvironmentConfig();
  
  // Test service initialization
  const serviceStatus = await testServiceInitialization();
  
  // Test model selection logic
  if (serviceStatus.openaiAvailable || serviceStatus.claudeAvailable) {
    testModelSelection();
  }
  
  // Test caching system
  testCaching();
  
  // Display recommendations based on test results
  displayRecommendations(envConfig, serviceStatus);
}

// Run the test
main().catch(console.error);