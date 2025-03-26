/**
 * Migration Helper for Enhanced LLM Integration
 * 
 * This script helps users migrate from the original contentGenerationService
 * to the enhanced service using Claude and LangChain.
 * 
 * Usage: node utils/migrateToEnhancedLLM.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define paths
const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT_DIR, '.env');
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json');

// Define colors for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

/**
 * Log with color
 */
function colorLog(color, message) {
  console.log(`${color}${message}${COLORS.reset}`);
}

/**
 * Check environment variables
 */
async function checkEnvVariables() {
  colorLog(COLORS.blue, '\n=== Checking Environment Variables ===');
  
  try {
    if (!fs.existsSync(ENV_FILE)) {
      colorLog(COLORS.red, `.env file not found at ${ENV_FILE}`);
      return false;
    }
    
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    
    // Check for OpenAI API key in new format
    const hasOpenAIKey = envContent.includes('OPENAI_API_KEY=');
    if (!hasOpenAIKey) {
      colorLog(COLORS.yellow, 'OPENAI_API_KEY not found in .env file');
    } else {
      colorLog(COLORS.green, '✓ OPENAI_API_KEY found');
    }
    
    // Check for Anthropic API key
    const hasAnthropicKey = envContent.includes('ANTHROPIC_API_KEY=');
    if (!hasAnthropicKey) {
      colorLog(COLORS.yellow, 'ANTHROPIC_API_KEY not found in .env file');
      
      const answer = await askQuestion('Would you like to add the Anthropic API key variable to your .env file? (y/n) ');
      if (answer.toLowerCase() === 'y') {
        const apiKey = await askQuestion('Enter your Anthropic API key (or leave blank to add just the variable): ');
        
        const modelAnswer = await askQuestion('Which Claude model would you like to use? (default: claude-3-sonnet-20240307): ');
        const model = modelAnswer.trim() || 'claude-3-sonnet-20240307';
        
        // Add Anthropic variables to .env
        const newEnvContent = envContent +
          '\n# Anthropic configuration\n' +
          `ANTHROPIC_API_KEY=${apiKey}\n` +
          `ANTHROPIC_MODEL=${model}\n`;
          
        fs.writeFileSync(ENV_FILE, newEnvContent);
        colorLog(COLORS.green, 'Anthropic variables added to .env file');
      }
    } else {
      colorLog(COLORS.green, '✓ ANTHROPIC_API_KEY found');
    }
    
    return true;
  } catch (error) {
    colorLog(COLORS.red, `Error checking environment variables: ${error.message}`);
    return false;
  }
}

/**
 * Check and update package.json
 */
async function updatePackageJson() {
  colorLog(COLORS.blue, '\n=== Checking Package Dependencies ===');
  
  try {
    if (!fs.existsSync(PACKAGE_JSON)) {
      colorLog(COLORS.red, `package.json not found at ${PACKAGE_JSON}`);
      return false;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
    const deps = packageJson.dependencies || {};
    
    // Check for required dependencies
    const requiredDeps = {
      '@langchain/anthropic': '^0.1.5',
      '@langchain/community': '^0.1.17',
      '@langchain/core': '^0.1.27',
      '@langchain/openai': '^0.0.14',
      'anthropic': '^0.19.1',
      'langchain': '^0.1.17'
    };
    
    const missingDeps = Object.keys(requiredDeps).filter(dep => !deps[dep]);
    
    if (missingDeps.length > 0) {
      colorLog(COLORS.yellow, 'Missing dependencies: ' + missingDeps.join(', '));
      
      const answer = await askQuestion('Would you like to add these dependencies to package.json? (y/n) ');
      if (answer.toLowerCase() === 'y') {
        // Add missing dependencies
        missingDeps.forEach(dep => {
          deps[dep] = requiredDeps[dep];
        });
        
        packageJson.dependencies = deps;
        fs.writeFileSync(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));
        
        colorLog(COLORS.green, 'Dependencies added to package.json');
        colorLog(COLORS.yellow, 'Remember to run "npm install" to install the new dependencies');
      }
    } else {
      colorLog(COLORS.green, '✓ All required dependencies found');
    }
    
    return true;
  } catch (error) {
    colorLog(COLORS.red, `Error updating package.json: ${error.message}`);
    return false;
  }
}

/**
 * Check if using the enhanced service
 */
async function checkServiceUsage() {
  colorLog(COLORS.blue, '\n=== Checking Code for LLM Service Usage ===');
  
  try {
    // Find all JS files in specified directories
    const dirsToCheck = ['api', 'controllers', 'routes', 'services'];
    const jsFiles = [];
    
    for (const dir of dirsToCheck) {
      const dirPath = path.join(ROOT_DIR, dir);
      if (fs.existsSync(dirPath)) {
        const files = listJsFiles(dirPath);
        jsFiles.push(...files);
      }
    }
    
    colorLog(COLORS.dim, `Found ${jsFiles.length} JavaScript files to scan`);
    
    // Check for contentGenerationService usage
    let usesOriginalService = false;
    let usesEnhancedService = false;
    
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      if (content.includes('require(\'../services/contentGenerationService\')') || 
          content.includes('require("../services/contentGenerationService")') ||
          content.includes('from \'../services/contentGenerationService\'') || 
          content.includes('from "../services/contentGenerationService"')) {
        usesOriginalService = true;
        colorLog(COLORS.yellow, `File using original service: ${path.relative(ROOT_DIR, file)}`);
      }
      
      if (content.includes('require(\'../services/enhancedContentGenerationService\')') || 
          content.includes('require("../services/enhancedContentGenerationService")') ||
          content.includes('from \'../services/enhancedContentGenerationService\'') || 
          content.includes('from "../services/enhancedContentGenerationService"')) {
        usesEnhancedService = true;
        colorLog(COLORS.green, `File using enhanced service: ${path.relative(ROOT_DIR, file)}`);
      }
    }
    
    if (usesOriginalService && !usesEnhancedService) {
      colorLog(COLORS.yellow, 'Your code is using the original service but not the enhanced service');
      colorLog(COLORS.yellow, 'To migrate, update your imports to use enhancedContentGenerationService');
      
      colorLog(COLORS.magenta, '\nExample change:');
      colorLog(COLORS.red, '- const contentGenerationService = require(\'../services/contentGenerationService\');');
      colorLog(COLORS.green, '+ const contentGenerationService = require(\'../services/enhancedContentGenerationService\');');
      
      colorLog(COLORS.magenta, '\nOr for gradual migration with both services:');
      colorLog(COLORS.green, 'const originalService = require(\'../services/contentGenerationService\');');
      colorLog(COLORS.green, 'const enhancedService = require(\'../services/enhancedContentGenerationService\');');
    } else if (usesEnhancedService) {
      colorLog(COLORS.green, '✓ Your code is already using the enhanced service');
    } else {
      colorLog(COLORS.yellow, 'No direct usage of content generation service found');
    }
    
    return true;
  } catch (error) {
    colorLog(COLORS.red, `Error checking service usage: ${error.message}`);
    return false;
  }
}

/**
 * List all JavaScript files in a directory recursively
 */
function listJsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      files.push(...listJsFiles(itemPath));
    } else if (stats.isFile() && (item.endsWith('.js') || item.endsWith('.jsx') || item.endsWith('.ts') || item.endsWith('.tsx'))) {
      files.push(itemPath);
    }
  }
  
  return files;
}

/**
 * Check if files exist
 */
function checkFileExists(file) {
  return fs.existsSync(path.join(ROOT_DIR, file));
}

/**
 * Ask a question and get a response
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Run the migration helper
 */
async function runMigrationHelper() {
  colorLog(COLORS.bright + COLORS.magenta, '\n=== Enhanced LLM Integration Migration Helper ===');
  
  // Check for required files
  const requiredFiles = [
    'services/llmService.js',
    'services/promptTemplates.js',
    'services/enhancedContentGenerationService.js',
    'tests/multi-llm-test.js',
    'LLM_INTEGRATION.md'
  ];
  
  colorLog(COLORS.blue, '\n=== Checking Required Files ===');
  const missingFiles = requiredFiles.filter(file => !checkFileExists(file));
  
  if (missingFiles.length > 0) {
    colorLog(COLORS.red, 'Missing required files:');
    missingFiles.forEach(file => colorLog(COLORS.red, `- ${file}`));
    colorLog(COLORS.yellow, 'Please make sure all required files are installed before continuing');
  } else {
    colorLog(COLORS.green, '✓ All required files are present');
  }
  
  // Check environment variables
  await checkEnvVariables();
  
  // Check package.json
  await updatePackageJson();
  
  // Check service usage
  await checkServiceUsage();
  
  // Finish
  colorLog(COLORS.blue, '\n=== Running Tests ===');
  const answer = await askQuestion('Would you like to run the multi-LLM test? (y/n) ');
  
  if (answer.toLowerCase() === 'y') {
    colorLog(COLORS.yellow, 'Running multi-LLM test...');
    colorLog(COLORS.yellow, 'You will need to manually run: node tests/multi-llm-test.js');
  }
  
  colorLog(COLORS.bright + COLORS.green, '\n=== Migration Helper Complete ===');
  colorLog(COLORS.green, 'For more information, please read the LLM_INTEGRATION.md file');
  
  rl.close();
}

// Run the migration helper
runMigrationHelper();