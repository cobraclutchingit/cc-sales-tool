/**
 * Claude Models Configuration
 * Last updated: 2025-03-24
 */

// Compatible Claude models for text generation
exports.claudeModels = [
  // Newest Claude models with verified working IDs
  'claude-3-opus-20240229',    // Specific version (verified working)
  'claude-3-sonnet-20240229',  // Specific version
  'claude-3-haiku-20240229',   // Specific version
  
  // These may not work - use with caution
  'claude-3-opus',             // Generic ID (may not work)
  'claude-3-sonnet',           // Generic ID (may not work)
  'claude-3-haiku',            // Generic ID (may not work)
];

// Default model to use if none specified
exports.defaultModel = 'claude-3-opus-20240229';

// Model-specific configurations
exports.modelConfig = {
  // Verified working models
  'claude-3-opus-20240229': {
    maxTokens: 4000,
    temperature: 0.7,
    bestFor: ['complex', 'creative', 'reasoning'],
    description: 'Claude 3 Opus (Feb 2024) - highest quality Claude model'
  },
  'claude-3-sonnet-20240229': {
    maxTokens: 4000,
    temperature: 0.7,
    bestFor: ['general', 'complex', 'creative'],
    description: 'Claude 3 Sonnet (Feb 2024) - good balance of quality and cost'
  },
  'claude-3-haiku-20240229': {
    maxTokens: 1000,
    temperature: 0.8,
    bestFor: ['fast', 'cost-effective', 'simple'],
    description: 'Claude 3 Haiku (Feb 2024) - fastest and most affordable Claude model'
  },
  
  // Generic models (may not work)
  'claude-3-opus': {
    maxTokens: 4000,
    temperature: 0.7,
    bestFor: ['complex', 'creative', 'reasoning'],
    description: 'Claude 3 Opus - highest quality Claude model (generic ID)'
  },
  'claude-3-sonnet': {
    maxTokens: 4000,
    temperature: 0.7,
    bestFor: ['general', 'complex', 'creative'],
    description: 'Claude 3 Sonnet - good balance of quality and speed (generic ID)'
  },
  'claude-3-haiku': {
    maxTokens: 1000,
    temperature: 0.8,
    bestFor: ['fast', 'cost-effective', 'simple'],
    description: 'Claude 3 Haiku - fastest and most cost-effective (generic ID)'
  }
};

// Helper function to find the best model for a specific task
exports.getBestModelForTask = function(task, preferredModel = null) {
  // If preferred model is specified and valid, use it
  if (preferredModel && exports.claudeModels.includes(preferredModel)) {
    return preferredModel;
  }
  
  // Otherwise, select best model based on task
  let recommendedModel = exports.defaultModel;
  
  // Map tasks to models (using verified working models)
  if (task === 'fast' || task === 'cost-effective') {
    recommendedModel = 'claude-3-haiku-20240229';
  } else if (task === 'complex' || task === 'creative') {
    recommendedModel = 'claude-3-opus-20240229';
  } else if (task === 'general' || task === 'balanced') {
    recommendedModel = 'claude-3-sonnet-20240229';
  }
  
  return recommendedModel;
};

// Get configuration for a specific model
exports.getModelConfig = function(modelName) {
  // If the exact model name doesn't have a config, try to find a match
  // based on the model family (e.g., "claude-3-sonnet-20240307" -> "claude-3-sonnet-latest")
  if (!exports.modelConfig[modelName]) {
    // Try to find a match based on model family
    const modelFamily = modelName.split('-20')[0] + '-latest'; // Strip version and add 'latest'
    if (exports.modelConfig[modelFamily]) {
      return exports.modelConfig[modelFamily];
    }
    
    // If all else fails, return default configuration
    return {
      maxTokens: 2000,
      temperature: 0.7,
      bestFor: ['general'],
      description: 'Unknown model - using default settings'
    };
  }
  
  return exports.modelConfig[modelName];
};