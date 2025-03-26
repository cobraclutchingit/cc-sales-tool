/**
 * Agent Controller
 * 
 * This controller handles API requests for the two-agent system.
 */

const twoAgentService = require('../../services/twoAgentService');

/**
 * Agent controller for handling two-agent system API requests
 */
const agentController = {
  /**
   * Generate personalized content using the two-agent system
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  generateContent: async (req, res) => {
    try {
      // Extract data from request
      const { profileData, additionalContext, outputType, options } = req.body;
      
      // Validate required fields
      if (!profileData) {
        return res.status(400).json({
          success: false,
          message: 'Profile data is required'
        });
      }
      
      // Set default output type if not provided
      const type = outputType || 'sales_email';
      
      // Generate content using the two-agent service
      const result = await twoAgentService.generatePersonalizedContent(
        profileData,
        additionalContext || {},
        type,
        options || {}
      );
      
      // Return the result
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error generating content:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate content',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },
  
  /**
   * Generate content using only the fine-tuning agent (for testing)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  testFineTuningAgent: async (req, res) => {
    try {
      // Extract data from request
      const { profileData, additionalContext, outputType } = req.body;
      
      // Validate required fields
      if (!profileData) {
        return res.status(400).json({
          success: false,
          message: 'Profile data is required'
        });
      }
      
      // Set default output type if not provided
      const type = outputType || 'sales_email';
      
      // Test the fine-tuning agent
      const result = await twoAgentService.testFineTuningAgent(
        profileData,
        additionalContext || {},
        type
      );
      
      // Return the result
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error testing fine-tuning agent:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to test fine-tuning agent',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },
  
  /**
   * Generate content using only the sales copy agent (for testing)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  testSalesCopyAgent: async (req, res) => {
    try {
      // Extract data from request
      const { prompt } = req.body;
      
      // Validate required fields
      if (!prompt) {
        return res.status(400).json({
          success: false,
          message: 'Prompt is required'
        });
      }
      
      // Test the sales copy agent
      const result = await twoAgentService.testSalesCopyAgent(prompt);
      
      // Return the result
      return res.status(200).json({
        success: true,
        data: {
          content: result
        }
      });
    } catch (error) {
      console.error('Error testing sales copy agent:', error);
      
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to test sales copy agent',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};

module.exports = agentController;