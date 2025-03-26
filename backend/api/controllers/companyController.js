const companyService = require('../../services/companyService');
const contentGenerationService = require('../../services/enhancedContentGenerationService');

/**
 * Controller for LinkedIn company analysis
 */
const companyController = {
  /**
   * Analyze a LinkedIn company and generate personalized sales content
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  analyzeCompany: async (req, res) => {
    try {
      const { companyUrl, outputFormat } = req.body;
      
      if (!companyUrl) {
        return res.status(400).json({
          status: 'error',
          message: 'Company URL is required'
        });
      }
      
      // Extract company data from LinkedIn
      const companyData = await companyService.extractCompanyData(companyUrl);
      
      // Identify key decision makers
      const decisionMakers = await companyService.identifyDecisionMakers(companyUrl);
      
      // Generate personalized sales content
      const content = await contentGenerationService.generateCompanyContent(
        companyData,
        decisionMakers,
        outputFormat || 'email'
      );
      
      return res.status(200).json({
        status: 'success',
        data: {
          companyData,
          decisionMakers,
          content
        }
      });
    } catch (error) {
      console.error('Company analysis error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'An error occurred during company analysis'
      });
    }
  }
};

module.exports = companyController;
