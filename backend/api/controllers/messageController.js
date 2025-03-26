// Using the enhanced service that supports both Claude and OpenAI with fallbacks
const contentGenerationService = require('../../services/enhancedContentGenerationService');

/**
 * Controller for client message analysis and generation
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
      
      // Analyze the client message
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
      
      // Generate personalized response
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
      
      // Generate follow-up email
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
