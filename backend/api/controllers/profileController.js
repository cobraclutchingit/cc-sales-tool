const profileService = require('../../services/profileService');
const contentGenerationService = require('../../services/enhancedContentGenerationService');
const multiLLMService = require('../../services/multiLLMService');
const { llmCache } = require('../../services/llmService');

/**
 * Controller for LinkedIn profile analysis
 */
const profileController = {
  /**
   * Analyze a LinkedIn profile and generate personalized sales content
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  analyzeProfile: async (req, res) => {
    try {
      const { profileUrl, outputFormat } = req.body;
      
      if (!profileUrl) {
        return res.status(400).json({
          status: 'error',
          message: 'Profile URL is required'
        });
      }
      
      // Extract profile data from LinkedIn
      const profileData = await profileService.extractProfileData(profileUrl);
      
      // Generate personalized sales content
      const content = await contentGenerationService.generateProfileContent(
        profileData,
        outputFormat || 'email'
      );
      
      return res.status(200).json({
        status: 'success',
        data: {
          profileData,
          content
        }
      });
    } catch (error) {
      console.error('Profile analysis error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred during profile analysis'
      });
    }
  },

  /**
   * Get LLM usage metrics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getLLMMetrics: async (req, res) => {
    try {
      // Get metrics from the multiLLMService
      const metrics = multiLLMService.getUsageMetrics();
      
      // Get cache statistics
      const cacheStats = llmCache.getStats();
      
      // Calculate success rate percentage
      const totalRequests = metrics.successRate.success + metrics.successRate.failure;
      const successRatePercentage = totalRequests > 0 
        ? (metrics.successRate.success / totalRequests * 100).toFixed(2) 
        : 0;
      
      // Add calculated success rate percentage and cache stats to the response
      const enhancedMetrics = {
        ...metrics,
        successRatePercentage: parseFloat(successRatePercentage),
        cache: cacheStats
      };
      
      return res.status(200).json({
        status: 'success',
        data: enhancedMetrics
      });
    } catch (error) {
      console.error('Error retrieving LLM metrics:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred retrieving LLM metrics'
      });
    }
  },

  /**
   * Clear the LLM cache
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  clearLLMCache: async (req, res) => {
    try {
      // Get cache stats before clearing
      const beforeStats = llmCache.getStats();
      
      // Clear the cache
      llmCache.clear();
      
      // Get cache stats after clearing
      const afterStats = llmCache.getStats();
      
      return res.status(200).json({
        status: 'success',
        message: 'Cache cleared successfully',
        data: {
          before: beforeStats,
          after: afterStats
        }
      });
    } catch (error) {
      console.error('Error clearing LLM cache:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred clearing the LLM cache'
      });
    }
  }
};

module.exports = profileController;
