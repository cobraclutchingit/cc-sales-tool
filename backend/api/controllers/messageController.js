const contentGenerationService = require('../../services/contentGenerationService');

/**
 * Controller for client message analysis
 */
const messageController = {
  /**
   * Analyze a client message and generate a personalized response
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  analyzeMessage: async (req, res) => {
    try {
      const { clientMessage, outputFormat } = req.body;
      
      if (!clientMessage) {
        return res.status(400).json({
          status: 'error',
          message: 'Client message is required'
        });
      }
      
      // Analyze the client message
      const messageAnalysis = await contentGenerationService.analyzeClientMessage(clientMessage);
      
      // Generate personalized response
      const responseContent = await contentGenerationService.generateMessageResponse(
        clientMessage,
        messageAnalysis,
        outputFormat || 'email'
      );
      
      return res.status(200).json({
        status: 'success',
        data: {
          messageAnalysis,
          responseContent
        }
      });
    } catch (error) {
      console.error('Message analysis error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred during message analysis'
      });
    }
  }
};

module.exports = messageController;
