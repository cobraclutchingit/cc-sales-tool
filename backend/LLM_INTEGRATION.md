# LLM Integration Guide

This document provides comprehensive information about the LLM (Large Language Model) integration in the VigilantEx application.

## Overview

The VigilantEx backend integrates with multiple LLM providers to power its content generation features:

1. **Primary provider**: Anthropic's Claude models (claude-3-sonnet-20240307)
2. **Secondary provider**: OpenAI's GPT models (gpt-4o-mini, gpt-3.5-turbo)
3. **Fallback**: Local model using transformers.js (@xenova/transformers)
4. **Final fallback**: Template-based generation

The system is designed with a cascading fallback mechanism:
- First attempts to use Claude for tasks that benefit from its capabilities
- Falls back to OpenAI for certain tasks or if Claude is unavailable
- Falls back to a local model if both cloud providers fail
- Uses template-based generation as a final fallback

## Environment Configuration

The LLM integration uses the following environment variables:

### API Keys
```
ANTHROPIC_API_KEY=sk-ant-your-claude-api-key
OPENAI_API_KEY=sk-your-openai-api-key
```

### Model Selection
```
ANTHROPIC_MODEL=claude-3-sonnet-20240307
OPENAI_MODEL=gpt-4o-mini
```

### Additional Settings
```
LLM_CACHE_TTL=86400000  # Optional: Cache TTL in milliseconds (24 hours by default)
```

## Setup Instructions

### Quick Setup

Run the provided setup script:

```bash
cd backend
chmod +x setup-llm.sh
./setup-llm.sh
```

This script will:
1. Install required dependencies
2. Create/update your .env file with LLM configuration 
3. Run diagnostics to verify your setup

### Manual Setup

1. Install dependencies:
```bash
npm install dotenv @openai/openai @anthropic-ai/sdk --save
```

2. Create a `.env` file in the backend directory with your API keys:
```
ANTHROPIC_API_KEY=sk-ant-your-claude-api-key
OPENAI_MODEL=claude-3-sonnet-20240307
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

3. Run the environment updater to ensure proper configuration:
```bash
node utils/update-env-models.js
```

4. Run the diagnostics to verify your setup:
```bash
node tests/llm-service-test.js
```

## Supported Models

### Claude Models
- claude-3-opus-20240229
- claude-3-sonnet-20240307 (recommended)
- claude-3-haiku-20240307 (fastest, cheapest)

### OpenAI Models
All OpenAI chat completion models are supported, including:
- gpt-4o-mini (recommended - best balance of speed/quality)
- gpt-4o
- gpt-3.5-turbo
- gpt-4-turbo
- o1-mini
- o1-preview
- o3-preview

The system includes dynamic model discovery that automatically configures new models as they become available.

To view, test, and select from all available models:
```bash
npm run select:model
```

To update the model configuration file with the latest models:
```bash
npm run update:models
```

### Local Models
- Xenova/distilgpt2 (used for fallback only)

## Model Selection Logic

The service automatically selects the best model for each task based on:

1. **Task characteristics**: 
   - For content generation (emails, profiles) - Prefers Claude for better creative writing
   - For structured analysis - Prefers OpenAI

2. **Content length**:
   - Long-form content (>2000 chars) - Prefers Claude

3. **Availability**:
   - Falls back based on which providers are configured

This logic can be found in the `selectModelForTask` method in the `multiLLMService.js` file.

## Caching System

The integration includes an in-memory caching system to improve performance and reduce API costs:

- **Cache key**: Generated from prompt, model, and task
- **TTL**: Configurable time-to-live (24 hours by default)
- **Stats**: Tracks hits, misses, and savings

To view cache statistics, you can use:
```javascript
const { llmCache } = require('./services/llmService');
console.log(llmCache.getStats());
```

## Error Handling

The system includes robust error handling:

1. **API authentication errors**: Provides clear messages about invalid API keys
2. **Rate limiting**: Detects and handles rate limit errors
3. **Model availability**: Falls back if a specific model is unavailable
4. **Connection issues**: Handles timeouts and connection problems

All errors are logged with context to help with troubleshooting.

## Usage Metrics

The service tracks usage metrics:

- Total requests per model
- Success/failure rates
- Average latency
- Task distribution

Metrics are stored in `logs/llm_usage_metrics.json` and can be accessed programmatically:
```javascript
const multiLLMService = require('./services/multiLLMService');
const metrics = multiLLMService.getUsageMetrics();
console.log(metrics);
```

## Testing Tools

Several test scripts are provided:

1. **api-quick-test.js**: Directly tests API connectivity
2. **llm-service-test.js**: Tests service configuration and functionality
3. **multi-llm-test.js**: Tests content generation with different tasks

To run a basic test of content generation:
```bash
node tests/multi-llm-test.js
```

## Troubleshooting

### API Keys Not Working

1. Verify key format:
   - OpenAI keys start with `sk-`
   - Claude keys start with `sk-ant-`

2. Check for rate limits:
   - Run `node tests/api-quick-test.js` to test direct API connectivity

3. Ensure correct environment variables:
   - Run `node utils/update-env-models.js` to standardize your configuration

### Model Not Found Errors

1. Verify model names:
   - Claude: Use `claude-3-sonnet-20240307` or `claude-3-haiku-20240307`
   - OpenAI: Use `gpt-4o-mini` or `gpt-3.5-turbo`

2. Check for model updates:
   - Run `node utils/update-env-models.js` to update outdated model references

### Unexpected Content Quality

If content quality is inconsistent:

1. Check which model is being selected by adding debug logs in multiLLMService.js
2. Ensure you have both OpenAI and Claude keys configured
3. Try specifying a different model in your .env file

## Architecture Overview

The LLM integration consists of several key components:

1. **multiLLMService.js**: Main service that handles model selection, generation, and fallbacks
2. **llmService.js**: Provides caching functionality
3. **promptTemplates.js**: Centralizes prompt templates
4. **enhancedContentGenerationService.js**: Wraps the original service with multi-LLM capabilities

## Best Practices

1. **API Cost Management**:
   - Use the caching system for repeated or similar requests
   - Consider the `gpt-4o-mini` and `claude-3-haiku` models for lower costs
   - Monitor usage metrics regularly

2. **Performance Optimization**:
   - Keep prompts concise and focused
   - Use the model selection logic to your advantage
   - Consider local model preprocessing for routine tasks

3. **Error Resilience**:
   - Always handle potential errors from LLM services
   - Implement appropriate fallbacks for critical features
   - Monitor the logs for recurring issues

## Support and Updates

For issues with the LLM integration:

1. Run the diagnostics tool: `node tests/llm-service-test.js`
2. Check the logs for specific error messages
3. Verify your API keys are valid and have sufficient quota
4. Update to the latest model versions using `node utils/update-env-models.js`

---

For any questions or support needs, please contact the VigilantEx team.