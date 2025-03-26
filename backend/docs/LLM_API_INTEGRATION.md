# API Integration Guide for Enhanced LLM Service

This guide explains how to integrate the enhanced LLM service with Claude and LangChain into the VigilantEx API controllers.

## Overview

The enhanced LLM service provides access to multiple language models (Claude and OpenAI) through a unified interface. This integration can be done gradually, allowing you to compare results and ensure quality before fully transitioning.

## Updating API Controllers

### Step 1: Import the Enhanced Service

In your controller files, update imports to use the enhanced service:

```javascript
// Before: Original service
const contentGenerationService = require('../../services/contentGenerationService');

// After: Enhanced service 
const contentGenerationService = require('../../services/enhancedContentGenerationService');
```

For a side-by-side comparison during testing:

```javascript
const originalService = require('../../services/contentGenerationService');
const enhancedService = require('../../services/enhancedContentGenerationService');
```

### Step 2: Update Controller Methods

The enhanced service is a drop-in replacement with identical method signatures:

```javascript
// Using the enhanced service
async analyzeMessage(req, res) {
  try {
    const { clientMessage } = req.body;
    
    // The method signature is identical
    const messageAnalysis = await contentGenerationService.analyzeClientMessage(clientMessage);
    
    return res.status(200).json({
      status: 'success',
      data: { messageAnalysis }
    });
  } catch (error) {
    console.error('Message analysis error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred during message analysis'
    });
  }
}
```

### Step 3: Gradual Migration (Optional)

For testing or phased rollout, you can introduce feature flags or A/B testing:

```javascript
async generateWarmFollowup(req, res) {
  try {
    const { profileData, callDetails } = req.body;
    
    // A/B testing based on feature flag or random selection
    let followupContent;
    
    if (req.query.useEnhanced === 'true' || Math.random() < 0.5) {
      console.log('Using enhanced service (Claude/LangChain)');
      followupContent = await enhancedService.generateWarmFollowup(profileData, callDetails);
    } else {
      console.log('Using original service (OpenAI)');
      followupContent = await originalService.generateWarmFollowup(profileData, callDetails);
    }
    
    return res.status(200).json({
      status: 'success',
      data: { followupContent }
    });
  } catch (error) {
    console.error('Warm follow-up generation error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred during warm follow-up generation'
    });
  }
}
```

## Example: Message Controller

Here's an updated example of the message controller with the enhanced service:

```javascript
const contentGenerationService = require('../../services/enhancedContentGenerationService');

/**
 * Controller for client message analysis and generation using enhanced LLM service
 */
const messageController = {
  /**
   * Analyze a client message
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  analyzeMessage: async (req, res) => {
    try {
      const { clientMessage } = req.body;
      
      if (!clientMessage) {
        return res.status(400).json({
          status: 'error',
          message: 'Client message is required'
        });
      }
      
      // Analyze the client message using Claude with OpenAI fallback
      const messageAnalysis = await contentGenerationService.analyzeClientMessage(clientMessage);
      
      return res.status(200).json({
        status: 'success',
        data: {
          messageAnalysis
        }
      });
    } catch (error) {
      console.error('Message analysis error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred during message analysis'
      });
    }
  },
  
  /**
   * Generate a response to a client message
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  generateResponse: async (req, res) => {
    try {
      const { clientMessage, messageAnalysis, outputFormat } = req.body;
      
      if (!clientMessage || !messageAnalysis) {
        return res.status(400).json({
          status: 'error',
          message: 'Client message and message analysis are required'
        });
      }
      
      // Generate personalized response using Claude with OpenAI fallback
      const responseContent = await contentGenerationService.generateMessageResponse(
        clientMessage,
        messageAnalysis,
        outputFormat || 'email'
      );
      
      return res.status(200).json({
        status: 'success',
        data: {
          responseContent
        }
      });
    } catch (error) {
      console.error('Response generation error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred during response generation'
      });
    }
  },
  
  /**
   * Generate a warm follow-up email after a phone call
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  generateWarmFollowup: async (req, res) => {
    try {
      const { profileData, callDetails } = req.body;
      
      if (!profileData) {
        return res.status(400).json({
          status: 'error',
          message: 'Profile data is required'
        });
      }
      
      // Ensure required profile fields exist
      if (!profileData.name || !profileData.title) {
        return res.status(400).json({
          status: 'error',
          message: 'Profile data must include at least name and title'
        });
      }
      
      // Set default call details if not provided
      const callDetailsWithDefaults = callDetails || {
        duration: '15 minutes',
        topics: ['surveillance system features', 'pricing', 'implementation'],
        concerns: 'pricing and implementation timeline',
        nextSteps: 'a product demonstration'
      };
      
      // Generate follow-up email using Claude with OpenAI fallback
      const followupContent = await contentGenerationService.generateWarmFollowup(
        profileData,
        callDetailsWithDefaults
      );
      
      return res.status(200).json({
        status: 'success',
        data: {
          followupContent
        }
      });
    } catch (error) {
      console.error('Warm follow-up generation error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred during warm follow-up generation'
      });
    }
  }
};

module.exports = messageController;
```

## Model Usage Guidance

The enhanced service intelligently routes tasks to the most appropriate model:

1. **Claude (Primary)**: Used for longer, nuanced content generation
   - Warm follow-up emails
   - Complex personalized messages
   - Detailed company outreach

2. **OpenAI (Secondary)**: Used for structured analysis or when Claude is unavailable
   - Message analysis and classification
   - Topic extraction
   - Short, structured responses

3. **Local Model/Templates (Fallback)**: Used when cloud services are unavailable
   - Always available fallback options
   - Template-based generation as final fallback

## Monitoring and Logging

The enhanced service includes detailed logging for monitoring:

- All service method calls log their progress
- Service initialization logs API readiness
- Model fallbacks are logged with specific error details
- Successful generations include model information

Look for console logs prefixed with `[Enhanced]` to identify the enhanced service activity.

## Error Handling

The enhanced service provides robust error handling:

1. If the enhanced service fails, it automatically falls back to the original service
2. Specific error types are logged for debugging
3. API keys and credentials are validated on initialization
4. All errors maintain the same format as the original service

## Testing

Before deploying in production, test the enhanced service using:

```bash
node tests/multi-llm-test.js
```

This will run a side-by-side comparison of the enhanced and original services across all content types.

## Migration Assistance

A migration helper script is available to assist with the transition:

```bash
node utils/migrateToEnhancedLLM.js
```

The helper will check your environment, dependencies, and provide guidance on code changes.