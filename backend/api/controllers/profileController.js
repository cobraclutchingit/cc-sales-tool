const profileService = require('../../services/profileService');
const contentGenerationService = require('../../services/contentGenerationService');

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
  }
};

module.exports = profileController;
