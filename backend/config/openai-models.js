/**
 * OpenAI Models Configuration
 * Last updated: 2025-03-24
 */

// Compatible OpenAI models for text generation
exports.compatibleModels = [
  // O Series
  'gpt-4o',
  'gpt-4o-mini',
  'o1-preview',
  'o1-mini',
  'o3-preview',
  
  // GPT-4 Series
  'gpt-4-turbo',
  'gpt-4-turbo-preview',
  'gpt-4',
  
  // GPT-3.5 Series
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-instruct',
];

// Model-specific configurations
exports.modelConfig = {
  'gpt-4o': {
    maxTokens: 4000,
    temperature: 0.7,
    best_for: ['general', 'complex', 'creative'],
    description: 'GPT-4o - newest model with strong performance across tasks'
  },
  'gpt-4o-mini': {
    maxTokens: 4000,
    temperature: 0.7, 
    best_for: ['general', 'fast', 'cost-effective'],
    description: 'GPT-4o Mini - good balance of quality, speed and cost (verified working)'
  },
  'o1-preview': {
    maxTokens: 4000,
    temperature: 0.7,
    best_for: ['complex', 'creative', 'reasoning'],
    description: 'O1 Preview - specialized for advanced reasoning tasks'
  },
  'o1-mini': {
    maxTokens: 3000,
    temperature: 0.7,
    best_for: ['fast', 'cost-effective', 'reasoning'],
    description: 'O1 Mini - faster, more affordable reasoning model'
  },
  'o3-preview': {
    maxTokens: 4000,
    temperature: 0.7,
    best_for: ['complex', 'creative', 'specialized'],
    description: 'O3 Preview - multimodal model with advanced capabilities'
  },
  'gpt-4-turbo': {
    maxTokens: 4000,
    temperature: 0.7,
    best_for: ['complex', 'creative', 'comprehensive'],
    description: 'GPT-4 Turbo - powerful model for complex tasks'
  },
  'gpt-4-turbo-preview': {
    maxTokens: 4000,
    temperature: 0.7,
    best_for: ['complex', 'creative', 'comprehensive'],
    description: 'GPT-4 Turbo Preview - latest GPT-4 capabilities'
  },
  'gpt-4': {
    maxTokens: 4000,
    temperature: 0.7,
    best_for: ['complex', 'precise', 'reasoning'],
    description: 'GPT-4 - strong for complex reasoning tasks'
  },
  'gpt-3.5-turbo': {
    maxTokens: 3000,
    temperature: 0.7,
    best_for: ['fast', 'simple', 'cost-effective'],
    description: 'GPT-3.5 Turbo - fast and cost-effective'
  },
  'gpt-3.5-turbo-instruct': {
    maxTokens: 2000,
    temperature: 0.7,
    best_for: ['fast', 'simple', 'focused'],
    description: 'GPT-3.5 Turbo Instruct - optimized for instruction following'
  }
};

// Helper function to find the best model for a specific task
exports.getBestModelForTask = function(task, preferredModel = null) {
  // If preferred model is specified and valid, use it
  if (preferredModel && exports.compatibleModels.includes(preferredModel)) {
    return preferredModel;
  }
  
  // Otherwise, select best model based on task
  let recommendedModel = 'gpt-4o-mini'; // Default recommendation
  
  // Map tasks to models
  if (task === 'fast' || task === 'cost-effective') {
    recommendedModel = 'gpt-3.5-turbo';
  } else if (task === 'complex' || task === 'creative') {
    recommendedModel = 'gpt-4o';
  } else if (task === 'reasoning') {
    recommendedModel = 'o1-mini';
  }
  
  return recommendedModel;
};

// Get configuration for a specific model
exports.getModelConfig = function(modelName) {
  // If the exact model name doesn't have a config, try to find a match
  // or return a default configuration
  if (!exports.modelConfig[modelName]) {
    // Default configuration
    return {
      maxTokens: 3000,
      temperature: 0.7,
      best_for: ['general'],
      description: 'Unknown model - using default settings'
    };
  }
  
  return exports.modelConfig[modelName];
};