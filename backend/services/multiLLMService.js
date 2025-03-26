/**
 * Multi-LLM Service for VigilantEx Sales Automation
 * 
 * This service manages interactions with multiple LLMs (OpenAI and Anthropic's Claude),
 * providing a consistent interface and intelligent fallback mechanisms.
 */

const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { pipeline, env } = require('@xenova/transformers');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { llmCache } = require('./llmService');

// Load OpenAI model configurations if available
let openAIModelConfig = { compatibleModels: [], modelConfig: {} };
try {
  const configPath = path.join(__dirname, '..', 'config', 'openai-models.js');
  if (fs.existsSync(configPath)) {
    openAIModelConfig = require('../config/openai-models');
    console.log(`Loaded OpenAI model configurations for ${openAIModelConfig.compatibleModels.length} models`);
  }
} catch (error) {
  console.warn('OpenAI model configuration not found or invalid. Using default settings.');
}

// Load Claude model configurations
let claudeModelConfig = { 
  claudeModels: [], 
  modelConfig: {}, 
  defaultModel: 'claude-3-sonnet-latest',
  getBestModelForTask: () => 'claude-3-sonnet-latest',
  getModelConfig: () => ({ maxTokens: 4000, temperature: 0.7 })
};
try {
  const configPath = path.join(__dirname, '..', 'config', 'claude-models.js');
  if (fs.existsSync(configPath)) {
    claudeModelConfig = require('../config/claude-models');
    console.log(`Loaded Claude model configurations for ${claudeModelConfig.claudeModels.length} models`);
  }
} catch (error) {
  console.warn('Claude model configuration not found or invalid. Using default settings.');
}

// Load environment variables
dotenv.config();

// Configure local transformers environment (used as final fallback)
env.useBrowserCache = false;
env.allowLocalModels = true;
env.cacheDir = './models';
const LOCAL_MODEL_NAME = 'Xenova/distilgpt2';
let localGenerator = null;

/**
 * Initialize the local transformers model (final fallback option)
 */
const initializeLocalModel = async () => {
  if (!localGenerator) {
    console.log('Initializing local transformers model...');
    try {
      localGenerator = await pipeline('text-generation', LOCAL_MODEL_NAME);
      console.log('Local model initialized successfully');
    } catch (error) {
      console.error('Error initializing local model:', error);
      throw new Error(`Failed to initialize local model: ${error.message}`);
    }
  }
  return localGenerator;
};

/**
 * Main Multi-LLM service class
 * Manages multiple models with fallback chains
 */
/**
 * Simple usage metrics tracking
 */
class UsageMetrics {
  constructor() {
    this.metricsFile = path.join(__dirname, '../logs/llm_usage_metrics.json');
    this.metrics = {
      totalRequests: 0,
      modelsUsed: {
        claude: 0,
        openai: 0,
        local: 0,
        template: 0
      },
      taskTypes: {},
      successRate: {
        success: 0,
        failure: 0
      },
      averageLatency: 0,
      totalLatency: 0,
      timestamp: new Date().toISOString()
    };
    
    this.loadMetrics();
  }
  
  // Load existing metrics if available
  loadMetrics() {
    try {
      // Ensure logs directory exists
      const logsDir = path.join(__dirname, '../logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      if (fs.existsSync(this.metricsFile)) {
        const data = fs.readFileSync(this.metricsFile, 'utf8');
        this.metrics = JSON.parse(data);
        // Update timestamp to the current date
        this.metrics.timestamp = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      // Continue with default metrics
    }
  }
  
  // Save current metrics to file
  saveMetrics() {
    try {
      fs.writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving metrics:', error);
    }
  }
  
  // Track a successful request
  trackRequest(modelName, task, latencyMs, success = true) {
    // Increment total requests
    this.metrics.totalRequests++;
    
    // Track model usage
    if (modelName && this.metrics.modelsUsed[modelName] !== undefined) {
      this.metrics.modelsUsed[modelName]++;
    }
    
    // Track task type
    if (task) {
      if (!this.metrics.taskTypes[task]) {
        this.metrics.taskTypes[task] = { count: 0, success: 0, failure: 0 };
      }
      this.metrics.taskTypes[task].count++;
      
      if (success) {
        this.metrics.taskTypes[task].success++;
      } else {
        this.metrics.taskTypes[task].failure++;
      }
    }
    
    // Track success/failure
    if (success) {
      this.metrics.successRate.success++;
    } else {
      this.metrics.successRate.failure++;
    }
    
    // Track latency
    if (latencyMs) {
      this.metrics.totalLatency += latencyMs;
      this.metrics.averageLatency = this.metrics.totalLatency / this.metrics.totalRequests;
    }
    
    // Save updated metrics
    this.saveMetrics();
  }
  
  // Get current metrics
  getMetrics() {
    return this.metrics;
  }
}

class MultiLLMService {
  constructor() {
    this.models = {};
    this.promptTemplates = {};
    this.initialized = false;
    this.metrics = new UsageMetrics();
  }

  /**
   * Initialize LLM models
   */
  async initialize() {
    if (this.initialized) return;

    console.log('Initializing Multi-LLM Service...');

    // Initialize Claude if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        // Create Claude client with API key and optional configuration
        this.models.claude = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          // Additional client configuration options
          maxRetries: 2,  // Retry failed requests up to 2 times
        });
        
        // Get the default model from environment or config
        const defaultModel = process.env.ANTHROPIC_MODEL || claudeModelConfig.defaultModel;
        console.log(`Claude initialized with model: ${defaultModel}`);
      } catch (error) {
        console.error('Error initializing Claude:', error);
        this.models.claude = null;
      }
    } else {
      console.warn('Warning: Anthropic API key not found. Claude integration will be disabled.');
      this.models.claude = null;
    }

    // Initialize OpenAI if API key is available
    const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENAPI_KEY; // Support both for backward compatibility
    if (openaiKey) {
      try {
        this.models.openai = new OpenAI({
          apiKey: openaiKey,
        });
        console.log(`OpenAI initialized with model: ${process.env.OPENAI_MODEL || "gpt-3.5-turbo"}`);
      } catch (error) {
        console.error('Error initializing OpenAI:', error);
        this.models.openai = null;
      }
    } else {
      console.warn('Warning: OpenAI API key not found. OpenAI integration will be disabled.');
      this.models.openai = null;
    }

    // Initialize prompt templates
    this.initializePromptTemplates();

    this.initialized = true;
    console.log('Multi-LLM Service initialization complete.');
  }

  /**
   * Initialize prompt templates for different use cases
   */
  initializePromptTemplates() {
    // System prompt for B2B construction sales content
    const salesSystemPrompt = 
`You are an expert sales copywriter specializing in B2B construction technology. 
Your task is to create persuasive, concise, and professional content for VigilantEx, 
a company providing AI-powered surveillance for construction sites. 
Focus on benefits, ROI, and personalization. Use a confident but not aggressive tone.`;

    // Initialize prompt templates
    this.promptTemplates = {
      // Profile content prompt
      profileContent: (name, title, companyInfo, interests, experience, outputFormat, greeting, roleGuidance) => `${salesSystemPrompt}

Create a personalized ${outputFormat} for ${name}, who works as a ${title} ${companyInfo}.

Their interests include: ${interests}
Their experience: ${experience}

VigilantEx provides an advanced AI-powered surveillance system for construction sites that functions like having four additional specialized team members:
1. Security Officer: Monitors for unauthorized access and security breaches
2. Project Manager: Tracks work progress and completion
3. Safety Coordinator: Identifies safety violations in real-time
4. Damage Mitigator: Documents incidents and identifies responsible parties

Key statistics to use:
- Companies using our system have reduced safety incidents by 30%
- Safety violations have decreased by 35% through real-time monitoring
- Productivity has improved by 22% 
- Theft and vandalism have decreased by 40%

Personalize the message based on their role.
${roleGuidance}

Format:
- Start with ${greeting}
- Include a personal connection to their work experience
- Briefly explain our "4 Extra Employees" concept 
- Add personalized value proposition for their specific role
- End with a call to action for a 15-minute demo

The message should be professional, concise (250-300 words), and conversational.`,

      // Warm follow-up email prompt
      warmFollowup: (name, title, companyInfo, duration, topicsDiscussed, concerns, nextSteps) => `${salesSystemPrompt}

Create a warm, personalized follow-up email to ${name}, who works as a ${title} ${companyInfo}.

I just had a phone call with them regarding VigilantEx's AI-powered surveillance system for construction sites. 

Call details:
- Call duration: ${duration}
- Main topics discussed: ${topicsDiscussed}
- Their primary concerns: ${concerns}
- Next steps discussed: ${nextSteps}

VigilantEx provides an advanced AI-powered surveillance system for construction sites that functions like having four additional specialized team members:
1. Security Officer: Monitors for unauthorized access and security breaches
2. Project Manager: Tracks work progress and completion
3. Safety Coordinator: Identifies safety violations in real-time
4. Damage Mitigator: Documents incidents and identifying responsible parties

Key statistics to use:
- Companies using our system have reduced safety incidents by 30%
- Safety violations have decreased by 35% through real-time monitoring
- Productivity has improved by 22% 
- Theft and vandalism have decreased by 40%

Email format:
- Start with a warm, personalized greeting referencing our phone conversation
- Express appreciation for their time
- Provide a brief summary of what we discussed
- Address any specific questions or concerns they raised
- Confirm the next steps we agreed on (like scheduling a demo)
- Offer to answer any additional questions they might have
- End with a friendly, professional sign-off

The email should be professional, warm, concise (250 words max), and conversational.`,

      // Message analysis prompt
      messageAnalysis: (clientMessage) => `Analyze the following client message regarding VigilantEx's construction site surveillance system:

"""
${clientMessage}
"""

Provide the analysis in JSON format with these fields:
1. sentiment: Classify as "positive", "negative", or "neutral"
2. topics: Identify main topics discussed (e.g., pricing, features, demo request, implementation, ROI, or general inquiry)
3. questions: Extract explicit or implied questions that need answers

Note that VigilantEx provides:
- Advanced surveillance systems for construction sites
- Core features: security monitoring, project progress tracking, safety violation detection, and incident documentation
- Pricing: Argos system at $1,849/month, LunaVue units at $249/month
- Implementation: Solar-powered with StarLink connectivity, setup in less than a day

Return ONLY the JSON data without any explanations.`,

      // Company content prompt
      companyContent: (companyName, industry, size, location, specialties, outputFormat, greeting, specialtyGuidance) => `${salesSystemPrompt}

Create a personalized ${outputFormat} for a decision maker at ${companyName}.

Company details:
- Industry: ${industry}
- Size: ${size}
- Location: ${location}
- Specialties: ${specialties}

VigilantEx provides an advanced AI-powered surveillance system for construction sites that functions like having four additional specialized team members:
1. Security Officer: Monitors for unauthorized access and security breaches
2. Project Manager: Tracks work progress and completion
3. Safety Coordinator: Identifies safety violations in real-time
4. Damage Mitigator: Documents incidents and identifies responsible parties

Key statistics to use:
- Companies using our system have reduced safety incidents by 30%
- Safety violations have decreased by 35% through real-time monitoring
- Productivity has improved by 22% 
- Theft and vandalism have decreased by 40%

Personalize the message based on the company's specialties:
${specialtyGuidance}

Format:
- Start with ${greeting}
- Include a reference to the company's projects or specialties
- Briefly explain our "4 Extra Employees" concept
- Add personalized value proposition based on company specialties
- End with a call to action for a 15-minute demo

The message should be professional, concise (250-300 words), and conversational.`,

      // Message response prompt
      messageResponse: (clientMessage, sentiment, topics, questions, outputFormat, responseFormat, sentimentGuidance) => `${salesSystemPrompt}

Create a personalized response to the following client message about VigilantEx's construction site surveillance system:

CLIENT MESSAGE:
"""
${clientMessage}
"""

MESSAGE ANALYSIS:
- Sentiment: ${sentiment}
- Topics: ${topics}
- Questions: ${questions}

VigilantEx provides an advanced AI-powered surveillance system for construction sites that functions like having four additional specialized team members:
1. Security Officer: Monitors for unauthorized access and security breaches
2. Project Manager: Tracks work progress and completion
3. Safety Coordinator: Identifies safety violations in real-time
4. Damage Mitigator: Documents incidents and identifies responsible parties

Product Information:
- Argos system: $1,849/month, includes AI-powered surveillance, solar power, StarLink connectivity
- LunaVue units: $249/month per unit or $199/month for multi-packs
- Implementation: Solar-powered with StarLink connectivity, setup in less than a day
- ROI: 35% reduction in safety violations, 22% productivity improvement, 40% decrease in theft

Format the response as a ${outputFormat}.

${responseFormat}

The response should:
- Acknowledge their inquiry with an appropriate tone based on sentiment
- Address specific topics they mentioned (${topics})
- Answer their questions (${questions})
- Include a call to action to schedule a 15-minute demo
- Be professional, helpful, and conversational
- Be 250-300 words in length

${sentimentGuidance}`
    };
  }

  /**
   * Choose the best model for a specific task
   * @param {string} task - The task to perform
   * @param {Object} context - Context data for making routing decisions
   * @returns {Object} The selected model and model name
   */
  selectModelForTask(task, context = {}) {
    // Get preferred models from context, environment or defaults
    const preferredOpenAIModel = context.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
    
    // For Claude, use context, environment or get from configuration based on task
    let preferredClaudeModel = context.claudeModel || process.env.ANTHROPIC_MODEL;
    if (!preferredClaudeModel) {
      // Map task to appropriate Claude model using configuration
      if (task === 'fast' || task === 'quick') {
        preferredClaudeModel = claudeModelConfig.getBestModelForTask('fast');
      } else if (task === 'complex' || context.contentLength > 2000) {
        preferredClaudeModel = claudeModelConfig.getBestModelForTask('complex');
      } else {
        preferredClaudeModel = claudeModelConfig.defaultModel;
      }
    }
    
    // Check if we should use a specific model family for this task
    let shouldUseGPT4 = false;
    let shouldUseClaude = false;
    
    // Complex or long-form content is better with Claude or GPT-4
    if (task === 'warmFollowup' || 
        task === 'messageResponse' ||
        task === 'profileContent' ||
        (context.contentLength && context.contentLength > 2000)) {
      shouldUseClaude = true;
    }
    
    // Structured analysis is better with OpenAI
    if (task === 'messageAnalysis') {
      shouldUseGPT4 = true;
    }
    
    // If Claude is available and recommended for this task
    if (this.models.claude && shouldUseClaude) {
      return {
        model: this.models.claude,
        name: 'claude',
        modelName: preferredClaudeModel
      };
    }
    
    // If OpenAI is available 
    if (this.models.openai) {
      // Find the best model based on task requirements
      let selectedModel = preferredOpenAIModel;
      
      // If we have model configurations, try to find the most suitable model
      if (openAIModelConfig.modelConfig && Object.keys(openAIModelConfig.modelConfig).length > 0) {
        // For complex tasks, prefer GPT-4 models
        if (shouldUseGPT4 || task === 'complex') {
          const gpt4Models = openAIModelConfig.compatibleModels.filter(m => 
            m.includes('gpt-4') && openAIModelConfig.modelConfig[m].best_for.includes('complex')
          );
          
          if (gpt4Models.length > 0) {
            selectedModel = gpt4Models[0];
          }
        }
        
        // For analysis tasks, prefer fast models
        if (task === 'messageAnalysis') {
          const analysisModels = openAIModelConfig.compatibleModels.filter(m => 
            openAIModelConfig.modelConfig[m].best_for.includes('fast')
          );
          
          if (analysisModels.length > 0) {
            selectedModel = analysisModels[0];
          }
        }
      }
      
      return {
        model: this.models.openai,
        name: 'openai',
        modelName: selectedModel
      };
    }
    
    // If neither is available, we'll use template-based fallbacks
    return { model: null, name: null, modelName: null };
  }

  /**
   * Generate content with Claude
   * @param {string} prompt - The prompt to send to Claude
   * @param {Object} options - Additional options for generation
   * @returns {Promise<string>} - Generated content
   */
  async generateWithClaude(prompt, options = {}) {
    const startTime = Date.now();
    try {
      console.log('Generating content with Claude...');

      if (!this.models.claude) {
        throw new Error('Claude client not initialized - check API key in environment variables');
      }

      // Get model from environment, options, or default from config
      const model = options.model || process.env.ANTHROPIC_MODEL || claudeModelConfig.defaultModel;
      
      // Get model-specific configuration
      const modelConfig = claudeModelConfig.getModelConfig(model);
      
      console.log(`Using Claude model: ${model}`);

      try {
        // Prepare the messages array - this supports both a simple prompt string
        // and a structured conversation with multiple messages
        const messages = Array.isArray(options.messages) ? options.messages : 
                        [{ role: "user", content: prompt }];
        
        // If system prompt is provided separately, use it
        const systemPrompt = options.systemPrompt || null;
        
        // Prepare API request parameters
        const requestParams = {
          model: model,
          max_tokens: options.maxTokens || modelConfig.maxTokens,
          messages: messages,
          temperature: options.temperature || modelConfig.temperature,
        };
        
        // Add system prompt if provided
        if (systemPrompt) {
          requestParams.system = systemPrompt;
        }
        
        // Add additional parameters if provided
        if (options.topP) requestParams.top_p = options.topP;
        if (options.topK) requestParams.top_k = options.topK;
        
        // Send the request to Claude
        const message = await this.models.claude.messages.create(requestParams);

        // Extract the generated text
        const generatedText = message.content[0].text;
        const latency = Date.now() - startTime;
        
        // Track metrics for successful request
        this.metrics.trackRequest('claude', options.task || null, latency, true);
        
        console.log(`Claude content generated successfully in ${latency}ms`);
        return generatedText;
      } catch (modelError) {
        // Handle specific Claude errors
        if (modelError.message.includes('404') || 
            modelError.message.includes('model not found') || 
            modelError.message.includes('no such model')) {
          // Model not found error - try to find a suitable fallback
          let fallbackModel = claudeModelConfig.defaultModel;
          
          // If trying to use a specific version that's not available,
          // try falling back to the "latest" version of the same model family
          if (model.includes('-2024')) {
            const modelFamily = model.split('-2024')[0] + '-latest';
            if (claudeModelConfig.claudeModels.includes(modelFamily)) {
              fallbackModel = modelFamily;
            }
          }
          
          console.warn(`Model ${model} not found. Falling back to ${fallbackModel}...`);
          
          // Get configuration for fallback model
          const fallbackConfig = claudeModelConfig.getModelConfig(fallbackModel);
          
          const fallbackMessage = await this.models.claude.messages.create({
            model: fallbackModel,
            max_tokens: fallbackConfig.maxTokens,
            messages: Array.isArray(options.messages) ? options.messages : 
                     [{ role: "user", content: prompt }],
            temperature: fallbackConfig.temperature,
          });
          
          const generatedText = fallbackMessage.content[0].text;
          const latency = Date.now() - startTime;
          
          // Track metrics for successful request with fallback model
          this.metrics.trackRequest('claude-fallback', options.task || null, latency, true);
          
          console.log(`Claude content generated with fallback model in ${latency}ms`);
          return generatedText;
        } else if (modelError.message.includes('429') || 
                  modelError.message.includes('rate_limit') || 
                  modelError.message.includes('quota exceeded')) {
          // Rate limit error - wait and retry with a smaller model
          const fallbackModel = 'claude-3-haiku-latest';
          console.warn(`Claude rate limit hit. Waiting 2 seconds and trying with ${fallbackModel}...`);
          
          // Wait 2 seconds
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            // Get configuration for the haiku model
            const haikuConfig = claudeModelConfig.getModelConfig(fallbackModel);
            
            const retryMessage = await this.models.claude.messages.create({
              model: fallbackModel,
              max_tokens: haikuConfig.maxTokens,
              messages: Array.isArray(options.messages) ? options.messages : 
                       [{ role: "user", content: prompt }],
              temperature: haikuConfig.temperature,
            });
            
            const generatedText = retryMessage.content[0].text;
            const latency = Date.now() - startTime;
            
            // Track metrics for successful retry
            this.metrics.trackRequest('claude-retry', options.task || null, latency, true);
            
            console.log(`Claude content generated after rate limit retry in ${latency}ms`);
            return generatedText;
          } catch (retryError) {
            console.error('Retry after rate limit also failed:', retryError.message);
            throw new Error(`Claude rate limit exceeded and retry failed: ${retryError.message}`);
          }
        } else if (modelError.message.includes('invalid_api_key') || 
                  modelError.message.includes('401') || 
                  modelError.message.includes('unauthorized')) {
          // Authentication error
          throw new Error(`Claude API key invalid or unauthorized: ${modelError.message}`);
        } else {
          // Re-throw for other types of errors
          throw modelError;
        }
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      
      // Track metrics for failed request
      this.metrics.trackRequest('claude', options.task || null, latency, false);
      
      console.error(`Error using Claude (${latency}ms):`, error);
      throw error;
    }
  }

  /**
   * Generate content with OpenAI
   * @param {string} prompt - The prompt to send to OpenAI
   * @returns {Promise<string>} - Generated content
   */
  async generateWithOpenAI(prompt) {
    const startTime = Date.now();
    try {
      console.log('Generating content with OpenAI...');

      if (!this.models.openai) {
        throw new Error('OpenAI client not initialized - check API key in environment variables');
      }

      // Get model from environment or use default
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      
      // Use model-specific configuration if available
      let temperature = 0.7;
      let maxTokens = 800;
      
      if (openAIModelConfig.modelConfig[model]) {
        // Use the configuration from our model config
        temperature = openAIModelConfig.modelConfig[model].temperature;
        maxTokens = openAIModelConfig.modelConfig[model].maxTokens;
        console.log(`Using model-specific configuration for ${model}`);
      } else {
        // Fallback to basic detection if configuration not found
        const isMiniModel = model.includes('mini') || model.includes('o1-') || model.includes('o3-');
        temperature = isMiniModel ? 0.5 : 0.7; // Lower temperature for mini models
        maxTokens = isMiniModel ? 1000 : 800; // Slightly higher token limit for mini models
      }
      
      console.log(`Using OpenAI model: ${model} (temp: ${temperature}, max_tokens: ${maxTokens})`)
      
      try {
        const completion = await this.models.openai.chat.completions.create({
          model: model,
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: temperature,
          max_tokens: maxTokens,
          top_p: 0.9,
        });

        const generatedText = completion.choices[0].message.content.trim();
        const latency = Date.now() - startTime;
        
        // Track metrics for successful request
        this.metrics.trackRequest('openai', null, latency, true);
        
        console.log(`OpenAI content generated successfully in ${latency}ms`);
        return generatedText;
      } catch (modelError) {
        // Check for various errors and handle appropriately
        if (modelError.message.includes('404') || modelError.message.includes('model_not_found')) {
          // Try to find a suitable fallback model
          let fallbackModel = "gpt-3.5-turbo"; // Default fallback
          
          // Try to find a similar model from our configuration
          if (openAIModelConfig.compatibleModels && openAIModelConfig.compatibleModels.length > 0) {
            // If the model contains "gpt-4", try another gpt-4 model
            if (model.includes('gpt-4')) {
              const gpt4Models = openAIModelConfig.compatibleModels.filter(m => m.includes('gpt-4'));
              if (gpt4Models.length > 0) {
                fallbackModel = gpt4Models[0]; // Use the first available GPT-4 model
              }
            } 
            // If the model contains "o1" or "o3", try gpt-4o-mini
            else if (model.includes('o1') || model.includes('o3')) {
              if (openAIModelConfig.compatibleModels.includes('gpt-4o-mini')) {
                fallbackModel = 'gpt-4o-mini';
              }
            }
          }
          
          console.warn(`Model ${model} not found. Falling back to ${fallbackModel}...`);
          
          // Get configuration for the fallback model
          let fallbackTemp = 0.7;
          let fallbackTokens = 800;
          
          if (openAIModelConfig.modelConfig && openAIModelConfig.modelConfig[fallbackModel]) {
            fallbackTemp = openAIModelConfig.modelConfig[fallbackModel].temperature;
            fallbackTokens = openAIModelConfig.modelConfig[fallbackModel].maxTokens;
          }
          
          const fallbackCompletion = await this.models.openai.chat.completions.create({
            model: fallbackModel,
            messages: [
              { role: "user", content: prompt }
            ],
            temperature: fallbackTemp,
            max_tokens: fallbackTokens,
            top_p: 0.9,
          });
          
          const generatedText = fallbackCompletion.choices[0].message.content.trim();
          const latency = Date.now() - startTime;
          
          // Track metrics for successful request with fallback model
          this.metrics.trackRequest('openai-fallback', null, latency, true);
          
          console.log(`OpenAI content generated with fallback model in ${latency}ms`);
          return generatedText;
        } else if (modelError.message.includes('429') || modelError.message.includes('rate limit')) {
          // Rate limit error - wait and retry once with a different model
          console.warn(`OpenAI rate limit hit. Waiting 2 seconds and trying with gpt-3.5-turbo...`);
          
          // Wait 2 seconds
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            const retryCompletion = await this.models.openai.chat.completions.create({
              model: "gpt-3.5-turbo", // Use a different model to avoid same rate limit
              messages: [
                { role: "user", content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 800,
              top_p: 0.9,
            });
            
            const generatedText = retryCompletion.choices[0].message.content.trim();
            const latency = Date.now() - startTime;
            
            // Track metrics for successful retry
            this.metrics.trackRequest('openai-retry', null, latency, true);
            
            console.log(`OpenAI content generated after rate limit retry in ${latency}ms`);
            return generatedText;
          } catch (retryError) {
            console.error('Retry after rate limit also failed:', retryError.message);
            throw new Error(`OpenAI rate limit exceeded and retry failed: ${retryError.message}`);
          }
        } else if (modelError.message.includes('invalid_api_key') || modelError.message.includes('401')) {
          // Authentication error
          throw new Error(`OpenAI API key invalid or unauthorized: ${modelError.message}`);
        } else {
          // Re-throw for other types of errors
          throw modelError;
        }
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      
      // Track metrics for failed request
      this.metrics.trackRequest('openai', null, latency, false);
      
      console.error(`Error using OpenAI (${latency}ms):`, error);
      throw error;
    }
  }

  /**
   * Generate content with the selected LLM
   * @param {string} prompt - The prompt to send to the LLM
   * @param {string} task - The task identifier for model selection
   * @param {Object} context - Context data for model selection
   * @returns {Promise<string>} - Generated content
   */
  async generateContent(prompt, task, context = {}) {
    const startTime = Date.now();
    await this.initialize();

    // Select the best model for this task
    const { model, name, modelName } = this.selectModelForTask(task, context);

    try {
      let content = null;
      let usedModelName = name;
      
      // Check cache first
      const cachedContent = llmCache.get(prompt, name || 'template', task);
      if (cachedContent) {
        console.log(`Using cached response for task: ${task}`);
        // Still track metrics for cache hits
        const latency = Date.now() - startTime;
        this.metrics.trackRequest('cache', task, latency, true);
        return cachedContent;
      }
      
      // Try the selected model
      if (name === 'claude') {
        content = await this.generateWithClaude(prompt);
      } else if (name === 'openai') {
        content = await this.generateWithOpenAI(prompt);
      }

      // If we have content, cache it and return it
      if (content && content.length > 50) {
        // Store in cache for future requests
        llmCache.set(prompt, name, task, content);
        
        const latency = Date.now() - startTime;
        this.metrics.trackRequest(usedModelName, task, latency, true);
        return content;
      }

      // If the selected model failed or didn't produce good content, try fallbacks
      if (name === 'claude' && this.models.openai) {
        console.log('Claude generation failed or insufficient, trying OpenAI...');
        try {
          content = await this.generateWithOpenAI(prompt);
          usedModelName = 'openai'; // Update the model used
          
          if (content && content.length > 50) {
            const latency = Date.now() - startTime;
            this.metrics.trackRequest(usedModelName, task, latency, true);
            return content;
          }
        } catch (openaiError) {
          console.error('OpenAI fallback failed:', openaiError);
        }
      }
      
      // If we still don't have good content, try the local model
      console.log('Cloud LLM generation failed or unavailable, trying local model...');
      
      // Initialize the local model if needed
      await initializeLocalModel();
      
      if (localGenerator) {
        try {
          // The local model needs a shorter prompt
          const shortenedPrompt = prompt.split('\n').slice(0, 10).join('\n') + 
                               '\n...\n[Prompt truncated for local model]\n\nGenerate response:';
          
          const localStartTime = Date.now();
          const result = await localGenerator(shortenedPrompt, {
            max_length: 200,
            num_return_sequences: 1,
            temperature: 0.7,
            top_k: 50,
            top_p: 0.9,
            do_sample: true,
          });
          
          content = result[0].generated_text.replace(shortenedPrompt, '').trim();
          usedModelName = 'local'; // Update the model used
          const localLatency = Date.now() - localStartTime;
          
          if (content.length > 20) {
            console.log(`Local model content generated successfully in ${localLatency}ms`);
            const totalLatency = Date.now() - startTime;
            this.metrics.trackRequest(usedModelName, task, totalLatency, true);
            return content;
          }
        } catch (localModelError) {
          console.error('Local model generation failed:', localModelError);
        }
      }
      
      // If all models failed, use a template-based approach as the final fallback
      console.log('All LLM models failed, using template as final fallback');
      usedModelName = 'template';
      const latency = Date.now() - startTime;
      this.metrics.trackRequest(usedModelName, task, latency, false);
      throw new Error('All LLM generation methods failed');
    } catch (error) {
      console.error(`Error generating content for task ${task}:`, error);
      const latency = Date.now() - startTime;
      this.metrics.trackRequest('template', task, latency, false); // Fallback to template
      throw error;
    }
  }

  /**
   * Generate profile content
   * @param {Object} profileData - LinkedIn profile data
   * @param {string} outputFormat - Desired output format (email, linkedin, phone)
   * @returns {Promise<string>} - Generated content
   */
  async generateProfileContent(profileData, outputFormat = 'email') {
    // Ensure service is initialized
    await this.initialize();
    
    console.log(`Generating ${outputFormat} content for profile: ${profileData.name}`);

    try {
      // Format experience data
      const experience = profileData.experience ? 
        profileData.experience.map(exp => `${exp.title} at ${exp.company}`).join(', ') : 
        '';
      
      // Company info
      const companyInfo = profileData.company ? `at ${profileData.company}` : '';
      
      // Determine greeting based on output format
      let greeting = '';
      if (outputFormat === 'email' || outputFormat === 'linkedin') {
        greeting = 'a brief greeting';
      } else if (outputFormat === 'phone') {
        greeting = 'a brief phone introduction';
      }
      
      // Role-specific guidance
      let roleGuidance = '';
      if (profileData.title.toLowerCase().includes('project manager') || 
          profileData.title.toLowerCase().includes('operations')) {
        roleGuidance = '- Emphasize productivity improvements and operational efficiency';
      } else if (profileData.title.toLowerCase().includes('safety') || 
                profileData.title.toLowerCase().includes('compliance')) {
        roleGuidance = '- Emphasize safety violation reduction and real-time monitoring';
      } else if (profileData.title.toLowerCase().includes('executive') || 
                profileData.title.toLowerCase().includes('director')) {
        roleGuidance = '- Emphasize ROI and overall business impact';
      }
      
      // Interests
      const interests = profileData.interests ? profileData.interests.join(', ') : '';

      // Create the prompt
      const prompt = this.promptTemplates.profileContent(
        profileData.name,
        profileData.title,
        companyInfo,
        interests,
        experience,
        outputFormat === 'email' ? 'email' : outputFormat === 'linkedin' ? 'LinkedIn message' : 'phone script',
        greeting,
        roleGuidance
      );

      // Generate content with the appropriate LLM
      return await this.generateContent(prompt, 'profileContent', { 
        contentLength: prompt.length 
      });
    } catch (error) {
      console.error('Error generating profile content:', error);
      
      // Fallback to template-based approach
      console.log('Using template-based approach as final fallback');
      
      // Create personalized intro based on profile data
      let intro = '';
      if (outputFormat === 'email') {
        intro = `Hi ${profileData.name.split(' ')[0]},\n\n`;
      } else if (outputFormat === 'linkedin') {
        intro = `Hi ${profileData.name.split(' ')[0]},\n\n`;
      } else if (outputFormat === 'phone') {
        intro = `Hello, may I speak with ${profileData.name}? \n\n`;
        intro += `Hi ${profileData.name.split(' ')[0]}, this is [Your Name] from VigilantEx. `;
      }
      
      // Add personalization based on interests
      const relevantInterests = profileData.interests ? 
        profileData.interests.filter(interest => 
          interest.toLowerCase().includes('safety') || 
          interest.toLowerCase().includes('security') ||
          interest.toLowerCase().includes('construction') ||
          interest.toLowerCase().includes('project') ||
          interest.toLowerCase().includes('management')
        ) : [];
        
      if (relevantInterests.length > 0) {
        intro += `I noticed your profile on LinkedIn and your experience as a ${profileData.title} ${profileData.company ? `at ${profileData.company}` : ''}. With your focus on ${relevantInterests.join(' and ')}, I thought you might be interested in how VigilantEx is transforming job site management.`;
      } else {
        intro += `I noticed your profile on LinkedIn and your experience as a ${profileData.title} ${profileData.company ? `at ${profileData.company}` : ''}. I thought you might be interested in how VigilantEx is transforming job site management for construction professionals like yourself.`;
      }
      
      // Core message about VigilantEx value proposition
      const coreMessage = `\n\nOur solution functions like having four additional specialized team members watching your construction sites 24/7:\n\n1. A Security Officer monitoring for unauthorized access\n2. A Project Manager tracking work progress and completion\n3. A Safety Coordinator identifying safety violations in real-time\n4. A Damage Mitigator documenting incidents and identifying responsible parties\n\n`;
      
      // Personalized value proposition based on role (template fallback)
      let valueProposition = '';
      if (profileData.title.toLowerCase().includes('project manager') || 
          profileData.title.toLowerCase().includes('operations')) {
        valueProposition = `Given your experience in project management, you'd particularly appreciate how our system has helped companies reduce safety incidents by 30% while improving operational efficiency.`;
      } else if (profileData.title.toLowerCase().includes('safety') || 
                profileData.title.toLowerCase().includes('compliance')) {
        valueProposition = `Given your focus on safety, you'd particularly appreciate how our system has helped companies reduce safety violations by 35% through real-time monitoring and alerts.`;
      } else if (profileData.title.toLowerCase().includes('executive') || 
                profileData.title.toLowerCase().includes('director')) {
        valueProposition = `Given your leadership role, you'd appreciate how our system has delivered a 22% productivity improvement and significant ROI through reduced incidents and improved site management.`;
      } else {
        valueProposition = `Given your experience in the construction industry, you'd appreciate how our system has helped companies improve safety and efficiency across their job sites.`;
      }
      
      // Call to action based on format
      let callToAction = '';
      if (outputFormat === 'email' || outputFormat === 'linkedin') {
        callToAction = `\n\nWould you be open to a quick 15-minute call next week to discuss how VigilantEx could benefit your projects${profileData.company ? ` at ${profileData.company}` : ''}?\n\nBest regards,\n[Your Name]`;
      } else if (outputFormat === 'phone') {
        callToAction = `\n\nI'd love to schedule a brief 15-minute demo to show you how our system works. Would you have some time next week to discuss how VigilantEx could benefit your projects${profileData.company ? ` at ${profileData.company}` : ''}?`;
      }
      
      // Combine all sections
      const content = intro + coreMessage + valueProposition + callToAction;
      
      // Track template-based fallback usage
      this.metrics.trackRequest('template', 'profileContent', 0, true);
      
      return content;
    }
  }

  /**
   * Generate a warm follow-up email after a phone call
   * @param {Object} profileData - LinkedIn profile data
   * @param {Object} callDetails - Details about the phone call
   * @returns {Promise<string>} - Generated follow-up email
   */
  async generateWarmFollowup(profileData, callDetails) {
    // Ensure service is initialized
    await this.initialize();
    
    console.log(`Generating warm follow-up email for: ${profileData.name}`);
    
    try {
      // Company info
      const companyInfo = profileData.company ? `at ${profileData.company}` : '';
      
      // Create the prompt
      const prompt = this.promptTemplates.warmFollowup(
        profileData.name,
        profileData.title,
        companyInfo,
        callDetails.duration || '15 minutes',
        callDetails.topics ? callDetails.topics.join(', ') : 'our surveillance system features and benefits',
        callDetails.concerns || 'price, implementation timeline, and ROI',
        callDetails.nextSteps || 'a product demonstration next week'
      );

      // Generate content with the appropriate LLM
      return await this.generateContent(prompt, 'warmFollowup', { 
        contentLength: prompt.length 
      });
    } catch (error) {
      console.error('Error generating warm follow-up email:', error);
      
      // Fallback to template-based follow-up email
      console.log('Using template-based approach as fallback for follow-up email');
      
      // Create a template-based follow-up email
      const greeting = `Hi ${profileData.name.split(' ')[0]},\n\n`;
      
      const intro = `Thank you for taking the time to speak with me today about VigilantEx's construction site surveillance solutions. I really enjoyed our conversation and appreciate your interest in how our technology could benefit your projects ${profileData.company ? `at ${profileData.company}` : ''}.`;
      
      // Summary based on call details
      const summary = `\n\nAs we discussed, our AI-powered surveillance system functions like having four additional specialized team members watching your construction sites 24/7: a Security Officer monitoring for unauthorized access, a Project Manager tracking work progress, a Safety Coordinator identifying safety violations, and a Damage Mitigator documenting incidents.`;
      
      // Address concerns from the call
      let concernsResponse = '';
      if (callDetails.concerns) {
        if (callDetails.concerns.toLowerCase().includes('price') || callDetails.concerns.toLowerCase().includes('cost')) {
          concernsResponse += `\n\nRegarding your question about pricing, our Argos system is $1,849/month with no upfront costs, which includes the complete hardware setup, solar power, and StarLink connectivity.`;
        }
        if (callDetails.concerns.toLowerCase().includes('timeline') || callDetails.concerns.toLowerCase().includes('implementation')) {
          concernsResponse += `\n\nAs for implementation, as I mentioned, our team can have the system fully operational on your site in less than a day, with no disruption to your ongoing work.`;
        }
        if (callDetails.concerns.toLowerCase().includes('roi')) {
          concernsResponse += `\n\nIn terms of ROI, our clients typically see a return within 3-6 months through reduced incidents (30% on average), improved productivity (22%), and decreased theft (40%).`;
        }
      }
      
      // Next steps
      let nextSteps = '';
      if (callDetails.nextSteps && callDetails.nextSteps.toLowerCase().includes('demo')) {
        nextSteps = `\n\nI'm looking forward to our demonstration ${callDetails.demoDate ? `on ${callDetails.demoDate}` : 'next week'}, where you'll get to see firsthand how our system works and the immediate benefits it can provide to your operations.`;
      } else {
        nextSteps = `\n\nI'd love to schedule a demonstration for you and your team to see our system in action. Would you have some time next week for a quick 30-minute demo?`;
      }
      
      // Closing
      const closing = `\n\nIf you have any questions in the meantime, please don't hesitate to reach out. I'm here to help ensure you have all the information you need.\n\nBest regards,\n[Your Name]\nVigilantEx Solutions\n[Your Phone Number]`;
      
      // Combine all sections
      const content = greeting + intro + summary + concernsResponse + nextSteps + closing;
      
      // Track template-based fallback usage
      this.metrics.trackRequest('template', 'warmFollowup', 0, true);
      
      return content;
    }
  }

  /**
   * Analyze a client message to identify key topics, sentiment, and questions
   * @param {string} clientMessage - Message from the client
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeClientMessage(clientMessage) {
    // Ensure service is initialized
    await this.initialize();
    
    console.log('Analyzing client message');

    try {
      // Create the prompt
      const prompt = this.promptTemplates.messageAnalysis(clientMessage);

      // Use the model to analyze the message
      const result = await this.generateContent(prompt, 'messageAnalysis', {});
      
      // Try to parse the result as JSON
      try {
        let jsonStr = result;
        
        // Find JSON content if it's wrapped in markdown code blocks
        const codeBlockMatch = result.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1];
        }
        
        // Clean up the string before parsing
        jsonStr = jsonStr.trim();
        
        // Try to isolate JSON if it's embedded in text
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        
        const analysisResult = JSON.parse(jsonStr);
        
        // Validate and normalize the structure
        const normalizedResult = {
          sentiment: analysisResult.sentiment || 'neutral',
          topics: Array.isArray(analysisResult.topics) ? analysisResult.topics : [],
          questions: Array.isArray(analysisResult.questions) ? analysisResult.questions : []
        };
        
        // Ensure we have valid data
        if (normalizedResult.sentiment && 
            ['positive', 'negative', 'neutral'].includes(normalizedResult.sentiment.toLowerCase())) {
          
          normalizedResult.sentiment = normalizedResult.sentiment.toLowerCase();
          
          // If no topics were found, add 'general inquiry'
          if (normalizedResult.topics.length === 0) {
            normalizedResult.topics.push('general inquiry');
          }
          
          console.log('Successfully analyzed message with LLM');
          return normalizedResult;
        } else {
          throw new Error('Invalid sentiment value in LLM response');
        }
      } catch (jsonError) {
        console.error('Error parsing LLM analysis result as JSON:', jsonError);
        console.log('Raw result from LLM:', result);
        throw jsonError;
      }
    } catch (error) {
      console.error('Error analyzing message with LLM:', error);
      
      // Fallback: Simple keyword-based topic detection
      console.log('Using keyword-based analysis as fallback');
      
      const topics = [];
      if (clientMessage.toLowerCase().includes('price') || 
          clientMessage.toLowerCase().includes('cost') || 
          clientMessage.toLowerCase().includes('pricing')) {
        topics.push('pricing');
      }
      if (clientMessage.toLowerCase().includes('feature') || 
          clientMessage.toLowerCase().includes('capability') || 
          clientMessage.toLowerCase().includes('function')) {
        topics.push('features');
      }
      if (clientMessage.toLowerCase().includes('demo') || 
          clientMessage.toLowerCase().includes('demonstration') || 
          clientMessage.toLowerCase().includes('show me')) {
        topics.push('demo request');
      }
      if (clientMessage.toLowerCase().includes('install') || 
          clientMessage.toLowerCase().includes('setup') || 
          clientMessage.toLowerCase().includes('implement')) {
        topics.push('implementation');
      }
      if (clientMessage.toLowerCase().includes('roi') || 
          clientMessage.toLowerCase().includes('return') || 
          clientMessage.toLowerCase().includes('benefit') || 
          clientMessage.toLowerCase().includes('value')) {
        topics.push('ROI');
      }
      
      // Simple sentiment analysis
      let sentiment = 'neutral';
      const positiveWords = ['interested', 'great', 'good', 'like', 'love', 'impressive', 'excited', 'yes', 'please'];
      const negativeWords = ['not interested', 'expensive', 'problem', 'issue', 'concern', 'no', 'don\'t', 'won\'t'];
      
      const positiveCount = positiveWords.filter(word => clientMessage.toLowerCase().includes(word)).length;
      const negativeCount = negativeWords.filter(word => clientMessage.toLowerCase().includes(word)).length;
      
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
      }
      
      // Simple question detection
      const questions = [];
      const sentences = clientMessage.split(/[.!?]+/).filter(s => s.trim().length > 0);
      for (const sentence of sentences) {
        if (sentence.trim().endsWith('?') || 
            sentence.toLowerCase().includes('what is') || 
            sentence.toLowerCase().includes('how much') || 
            sentence.toLowerCase().includes('can you') || 
            sentence.toLowerCase().includes('will it') || 
            sentence.toLowerCase().includes('do you')) {
          questions.push(sentence.trim());
        }
      }
      
      // If no questions were detected but topics were found, create implied questions
      if (questions.length === 0 && topics.length > 0) {
        if (topics.includes('pricing')) {
          questions.push('What is the cost?');
        }
        if (topics.includes('features')) {
          questions.push('What features does the system have?');
        }
        if (topics.includes('demo request')) {
          questions.push('Can I see a demo?');
        }
        if (topics.includes('implementation')) {
          questions.push('How is the system implemented?');
        }
        if (topics.includes('ROI')) {
          questions.push('What is the ROI?');
        }
      }
      
      // Track template-based fallback usage
      this.metrics.trackRequest('template', 'messageAnalysis', 0, true);
      
      return {
        sentiment,
        topics: topics.length > 0 ? topics : ['general inquiry'],
        questions: questions.length > 0 ? questions : []
      };
    }
  }

  /**
   * Generate a personalized response to a client message
   * @param {string} clientMessage - Original message from the client
   * @param {Object} messageAnalysis - Analysis of the client message
   * @param {string} outputFormat - Desired output format (email, linkedin, phone)
   * @returns {Promise<string>} - Generated response
   */
  async generateMessageResponse(clientMessage, messageAnalysis, outputFormat = 'email') {
    // Ensure service is initialized
    await this.initialize();
    
    console.log(`Generating ${outputFormat} response to client message`);
    
    try {
      // Determine response format
      let responseFormat = '';
      if (outputFormat === 'email' || outputFormat === 'linkedin') {
        responseFormat = 'Start with "Hello [Client Name]," and end with "Best regards,\\n[Your Name]"';
      } else {
        responseFormat = 'Start with "Hello [Client Name]," and make it conversational as for a phone call';
      }
      
      // Sentiment guidance
      let sentimentGuidance = '';
      if (messageAnalysis.sentiment === 'negative') {
        sentimentGuidance = 'Since the sentiment is negative, be especially empathetic and focus on addressing concerns.';
      }
      
      // Create the prompt
      const prompt = this.promptTemplates.messageResponse(
        clientMessage,
        messageAnalysis.sentiment,
        messageAnalysis.topics.join(', '),
        messageAnalysis.questions.join(', '),
        outputFormat === 'email' ? 'professional email' : outputFormat === 'linkedin' ? 'LinkedIn message' : 'phone script',
        responseFormat,
        sentimentGuidance
      );

      // Generate content with the appropriate LLM
      return await this.generateContent(prompt, 'messageResponse', { 
        contentLength: prompt.length 
      });
    } catch (error) {
      console.error('Error generating message response:', error);
      
      // Fallback to template-based approach
      console.log('Using template-based approach as fallback');
      
      // Create personalized greeting
      let greeting = '';
      if (outputFormat === 'email') {
        greeting = `Hello [Client Name],\n\n`;
      } else if (outputFormat === 'linkedin') {
        greeting = `Hi [Client Name],\n\n`;
      } else if (outputFormat === 'phone') {
        greeting = `Hello [Client Name], `;
      }
      
      // Create personalized intro based on sentiment
      let intro = '';
      if (messageAnalysis.sentiment === 'positive') {
        intro = `Thank you for your interest in VigilantEx's surveillance solutions. I'd be happy to provide more information about our products and services.`;
      } else if (messageAnalysis.sentiment === 'negative') {
        intro = `Thank you for reaching out about VigilantEx's surveillance solutions. I understand you have some concerns, and I'd like to address them.`;
      } else {
        intro = `Thank you for your message about VigilantEx's surveillance solutions. I'd be happy to provide more information about our products and services.`;
      }
      
      // Create content based on detected topics
      let content = '\n\n';
      
      if (messageAnalysis.topics.includes('pricing')) {
        content += `Our Argos system is priced at $1,849/month and includes:\n- Advanced AI-powered surveillance with 24/7 monitoring\n- Solar power with StarLink high-speed internet\n- Customized AI agents for real-time detection and alerts\n\nFor smaller areas or to eliminate blind spots, our LunaVue units are available at $249/month for a single unit or $199/month per unit for multi-packs.\n\n`;
      }
      
      if (messageAnalysis.topics.includes('features')) {
        content += `VigilantEx provides comprehensive site monitoring through our "4 Extra Employees" concept:\n- Security Officer: Monitors for unauthorized access and security breaches\n- Project Manager: Tracks work progress, material deliveries, and project timelines\n- Safety Coordinator: Identifies safety violations and hazards in real-time\n- Damage Mitigator: Documents incidents and identifies responsible parties\n\n`;
      }
      
      if (messageAnalysis.topics.includes('implementation')) {
        content += `Implementation is straightforward and requires minimal effort from your team. Our technicians handle the entire setup process, which typically takes less than a day. The system is solar-powered and uses StarLink for connectivity, so no hardwiring or internet connection is required.\n\n`;
      }
      
      if (messageAnalysis.topics.includes('ROI')) {
        content += `Our clients typically see significant ROI through:\n- 35% reduction in safety violations\n- 22% improvement in productivity\n- 40% decrease in theft and vandalism\n- Reduced insurance premiums due to improved site security\n- Comprehensive documentation for dispute resolution\n\n`;
      }
      
      if (messageAnalysis.topics.includes('demo request')) {
        content += `I'd be delighted to schedule a demo for you to see our system in action. Our demonstrations typically take about 30 minutes and show how our "4 Extra Employees" concept works to enhance security, project management, safety compliance, and damage mitigation.\n\n`;
      }
      
      // If only general inquiry was detected, provide overview
      if (messageAnalysis.topics.includes('general inquiry') && messageAnalysis.topics.length === 1) {
        content += `VigilantEx provides advanced AI-powered surveillance for construction sites, functioning like four additional team members watching your sites 24/7:\n\n1. A Security Officer monitoring for unauthorized access\n2. A Project Manager tracking work progress and completion\n3. A Safety Coordinator identifying safety violations in real-time\n4. A Damage Mitigator documenting incidents and identifying responsible parties\n\nOur Argos system is priced at $1,849/month and includes solar power with StarLink connectivity for a truly wireless solution. For smaller areas, our LunaVue units start at $249/month.\n\n`;
      }
      
      // Call to action based on format and topics
      let callToAction = '';
      if (messageAnalysis.topics.includes('demo request')) {
        if (outputFormat === 'email' || outputFormat === 'linkedin') {
          callToAction = `Would you be available next Tuesday or Wednesday afternoon for a demonstration? I can also answer any additional questions you might have at that time.\n\nBest regards,\n[Your Name]`;
        } else if (outputFormat === 'phone') {
          callToAction = `Would you be available next Tuesday or Wednesday afternoon for a demonstration? I can also answer any additional questions you might have at that time.`;
        }
      } else {
        if (outputFormat === 'email' || outputFormat === 'linkedin') {
          callToAction = `Would you like to schedule a brief demonstration to see our system in action? I'm available next week and would be happy to show you how VigilantEx can benefit your projects.\n\nBest regards,\n[Your Name]`;
        } else if (outputFormat === 'phone') {
          callToAction = `Would you like to schedule a brief demonstration to see our system in action? I'm available next week and would be happy to show you how VigilantEx can benefit your projects.`;
        }
      }
      
      // Combine all sections
      const response = greeting + intro + content + callToAction;
      
      // Track template-based fallback usage
      this.metrics.trackRequest('template', 'messageResponse', 0, true);
      
      return response;
    }
  }

  /**
   * Generate personalized sales content based on a company analysis
   * @param {Object} companyData - LinkedIn company data
   * @param {Array} decisionMakers - List of decision makers at the company
   * @param {string} outputFormat - Desired output format (email, linkedin, phone)
   * @returns {Promise<string>} - Generated content
   */
  async generateCompanyContent(companyData, decisionMakers, outputFormat = 'email') {
    // Ensure service is initialized
    await this.initialize();
    
    console.log(`Generating ${outputFormat} content for company: ${companyData.name}`);
    
    try {
      // Determine greeting based on output format
      let greeting = '';
      if (outputFormat === 'email') {
        greeting = `a subject line "Enhancing Safety & Efficiency at ${companyData.name}" followed by a brief greeting to "[Decision Maker Name]"`;
      } else if (outputFormat === 'linkedin') {
        greeting = `a brief greeting to "[Decision Maker Name]"`;
      } else if (outputFormat === 'phone') {
        greeting = `a brief phone introduction to "[Decision Maker Name]"`;
      }
      
      // Company specialties guidance
      let specialtyGuidance = [];
      if (companyData.specialties.some(s => s.toLowerCase().includes('safety') || s.toLowerCase().includes('compliance'))) {
        specialtyGuidance.push('- Emphasize safety violation reduction and real-time monitoring');
      }
      if (companyData.specialties.some(s => s.toLowerCase().includes('project') || s.toLowerCase().includes('management'))) {
        specialtyGuidance.push('- Emphasize productivity improvements and operational efficiency');
      }
      if (companyData.specialties.some(s => s.toLowerCase().includes('commercial') || s.toLowerCase().includes('construction'))) {
        specialtyGuidance.push('- Emphasize comprehensive monitoring and efficiency');
      }
      
      // Create the prompt
      const prompt = this.promptTemplates.companyContent(
        companyData.name,
        companyData.industry || 'construction',
        companyData.size || 'medium',
        companyData.location || 'your area',
        companyData.specialties.join(', '),
        outputFormat === 'email' ? 'email' : outputFormat === 'linkedin' ? 'LinkedIn message' : 'phone script',
        greeting,
        specialtyGuidance.join('\n')
      );

      // Generate content with the appropriate LLM
      return await this.generateContent(prompt, 'companyContent', { 
        contentLength: prompt.length 
      });
    } catch (error) {
      console.error('Error generating company content:', error);
      
      // Fallback to template-based approach
      console.log('Using template-based approach as fallback');
      
      // Create subject line for email
      let subject = '';
      if (outputFormat === 'email') {
        subject = `Subject: Enhancing Safety & Efficiency at ${companyData.name}\n\n`;
      }
      
      // Create personalized intro based on company data
      let intro = '';
      if (outputFormat === 'email') {
        intro = `Hello [Decision Maker Name],\n\n`;
        intro += `I've been following ${companyData.name}'s impressive ${companyData.specialties[0].toLowerCase()} projects in the ${companyData.location} area and wanted to reach out about a solution that's helping construction companies like yours improve safety compliance while optimizing operational efficiency.`;
      } else if (outputFormat === 'linkedin') {
        intro = `Hi [Decision Maker Name],\n\n`;
        intro += `I came across ${companyData.name} and was impressed by your work in ${companyData.specialties[0].toLowerCase()}. I wanted to connect regarding a solution that's helping construction companies in ${companyData.location} improve safety compliance while optimizing operational efficiency.`;
      } else if (outputFormat === 'phone') {
        intro = `Hello, may I speak with [Decision Maker Name]? \n\n`;
        intro += `Hi, this is [Your Name] from VigilantEx. I've been following ${companyData.name}'s projects in the ${companyData.location} area and wanted to discuss a solution that's helping construction companies like yours improve safety compliance while optimizing operational efficiency.`;
      }
      
      // Core message about VigilantEx value proposition
      const coreMessage = `\n\nVigilantEx provides an all-in-one surveillance solution that functions like having four additional specialized team members watching your construction sites 24/7:\n\n1. A Security Officer monitoring for unauthorized access\n2. A Project Manager tracking work progress and completion\n3. A Safety Coordinator identifying safety violations in real-time\n4. A Damage Mitigator documenting incidents and identifying responsible parties\n\n`;
      
      // Personalized value proposition based on company specialties
      let valueProposition = '';
      if (companyData.specialties.some(s => s.toLowerCase().includes('safety') || s.toLowerCase().includes('compliance'))) {
        valueProposition = `Given ${companyData.name}'s focus on safety compliance, you'd particularly benefit from our Safety Coordinator feature which has helped similar companies reduce safety incidents by 35% through real-time monitoring and alerts.`;
      } else if (companyData.specialties.some(s => s.toLowerCase().includes('project') || s.toLowerCase().includes('management'))) {
        valueProposition = `Given ${companyData.name}'s focus on project management, you'd particularly benefit from our Project Manager feature which has helped similar companies improve operational efficiency by 22% through better tracking and coordination.`;
      } else if (companyData.specialties.some(s => s.toLowerCase().includes('commercial') || s.toLowerCase().includes('construction'))) {
        valueProposition = `Given ${companyData.name}'s focus on commercial construction, you'd particularly benefit from our comprehensive monitoring system which has helped similar companies reduce safety incidents by 30% while improving operational efficiency.`;
      } else {
        valueProposition = `Given ${companyData.name}'s industry focus, you'd particularly benefit from our solution which has helped similar companies reduce safety incidents by 30% while improving operational efficiency.`;
      }
      
      // Call to action based on format
      let callToAction = '';
      if (outputFormat === 'email' || outputFormat === 'linkedin') {
        callToAction = `\n\nWould you be open to a quick 15-minute call next week to discuss how VigilantEx could benefit your projects?\n\nBest regards,\n[Your Name]`;
      } else if (outputFormat === 'phone') {
        callToAction = `\n\nI'd love to schedule a brief 15-minute demo to show you how our system works. Would you have some time next week to discuss how VigilantEx could benefit your projects?`;
      }
      
      // Combine all sections
      const content = subject + intro + coreMessage + valueProposition + callToAction;
      
      // Track template-based fallback usage
      this.metrics.trackRequest('template', 'companyContent', 0, true);
      
      return content;
    }
  }

  /**
   * Get usage metrics for all models
   * @returns {Object} The current metrics
   */
  getUsageMetrics() {
    return this.metrics.getMetrics();
  }
}

// Export a singleton instance
const multiLLMService = new MultiLLMService();
module.exports = multiLLMService;