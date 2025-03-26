/**
 * Enhanced Content Generation Service
 * 
 * This service wraps the original contentGenerationService but uses the new multiLLMService
 * under the hood, providing multiple LLM providers (Claude and OpenAI) with intelligent routing.
 */

const multiLLMService = require('./multiLLMService');
const originalService = require('./contentGenerationService');

/**
 * Enhanced service for AI-powered content generation
 * with multiple LLM providers (Claude and OpenAI)
 */
const enhancedContentGenerationService = {
  /**
   * Generate a warm follow-up email after a phone call
   * @param {Object} profileData - LinkedIn profile data
   * @param {Object} callDetails - Details about the phone call
   * @returns {Promise<string>} - Generated follow-up email
   */
  generateWarmFollowup: async (profileData, callDetails) => {
    try {
      console.log(`[Enhanced] Generating warm follow-up email for: ${profileData.name}`);
      
      // Use the multi-LLM service
      return await multiLLMService.generateWarmFollowup(profileData, callDetails);
    } catch (error) {
      console.error('Error in enhanced warm follow-up generation, falling back to original service:', error);
      
      // Fallback to the original service if the enhanced one fails
      return await originalService.generateWarmFollowup(profileData, callDetails);
    }
  },

  /**
   * Generate personalized sales content based on a LinkedIn profile
   * @param {Object} profileData - LinkedIn profile data
   * @param {string} outputFormat - Desired output format (email, linkedin, phone)
   * @returns {Promise<string>} - Generated content
   */
  generateProfileContent: async (profileData, outputFormat = 'email') => {
    try {
      console.log(`[Enhanced] Generating ${outputFormat} content for profile: ${profileData.name}`);
      
      // Use the multi-LLM service
      return await multiLLMService.generateProfileContent(profileData, outputFormat);
    } catch (error) {
      console.error('Error in enhanced profile content generation, falling back to original service:', error);
      
      // Fallback to the original service if the enhanced one fails
      return await originalService.generateProfileContent(profileData, outputFormat);
    }
  },
  
  /**
   * Generate personalized sales content based on a company analysis
   * @param {Object} companyData - LinkedIn company data
   * @param {Array} decisionMakers - List of decision makers at the company
   * @param {string} outputFormat - Desired output format (email, linkedin, phone)
   * @returns {Promise<string>} - Generated content
   */
  generateCompanyContent: async (companyData, decisionMakers, outputFormat = 'email') => {
    try {
      console.log(`[Enhanced] Generating ${outputFormat} content for company: ${companyData.name}`);
      
      // Use the multi-LLM service
      return await multiLLMService.generateCompanyContent(companyData, decisionMakers, outputFormat);
    } catch (error) {
      console.error('Error in enhanced company content generation, falling back to original service:', error);
      
      // Fallback to the original service if the enhanced one fails
      return await originalService.generateCompanyContent(companyData, decisionMakers, outputFormat);
    }
  },
  
  /**
   * Analyze a client message to identify key topics, sentiment, and questions
   * @param {string} clientMessage - Message from the client
   * @returns {Promise<Object>} - Analysis results
   */
  analyzeClientMessage: async (clientMessage) => {
    try {
      console.log('[Enhanced] Analyzing client message');
      
      // Use the multi-LLM service
      return await multiLLMService.analyzeClientMessage(clientMessage);
    } catch (error) {
      console.error('Error in enhanced message analysis, falling back to original service:', error);
      
      // Fallback to the original service if the enhanced one fails
      return await originalService.analyzeClientMessage(clientMessage);
    }
  },
  
  /**
   * Generate a personalized response to a client message
   * @param {string} clientMessage - Original message from the client
   * @param {Object} messageAnalysis - Analysis of the client message
   * @param {string} outputFormat - Desired output format (email, linkedin, phone)
   * @returns {Promise<string>} - Generated response
   */
  generateMessageResponse: async (clientMessage, messageAnalysis, outputFormat = 'email') => {
    try {
      console.log(`[Enhanced] Generating ${outputFormat} response to client message`);
      
      // Use the multi-LLM service
      return await multiLLMService.generateMessageResponse(clientMessage, messageAnalysis, outputFormat);
    } catch (error) {
      console.error('Error in enhanced message response generation, falling back to original service:', error);
      
      // Fallback to the original service if the enhanced one fails
      return await originalService.generateMessageResponse(clientMessage, messageAnalysis, outputFormat);
    }
  }
};

module.exports = enhancedContentGenerationService;