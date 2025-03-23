import axios from 'axios';

const API_URL = 'http://localhost:5007/api';

/**
 * Service for making API calls to the backend
 */
const apiService = {
  /**
   * Analyze a LinkedIn profile
   * @param {string} profileUrl - LinkedIn profile URL
   * @param {string} outputFormat - Desired output format (email, linkedin, phone)
   * @returns {Promise<Object>} - Analysis results
   */
  analyzeProfile: async (profileUrl, outputFormat) => {
    try {
      const response = await axios.post(`${API_URL}/profile/analyze`, {
        profileUrl,
        outputFormat
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to analyze profile');
    }
  },

  /**
   * Analyze a LinkedIn company
   * @param {string} companyUrl - LinkedIn company URL
   * @param {string} outputFormat - Desired output format (email, linkedin, phone)
   * @returns {Promise<Object>} - Analysis results
   */
  analyzeCompany: async (companyUrl, outputFormat) => {
    try {
      const response = await axios.post(`${API_URL}/company/analyze`, {
        companyUrl,
        outputFormat
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing company:', error);
      throw new Error(error.response?.data?.message || 'Failed to analyze company');
    }
  },

  /**
   * Analyze a client message
   * @param {string} clientMessage - Message from the client
   * @param {string} outputFormat - Desired output format (email, linkedin, phone)
   * @returns {Promise<Object>} - Analysis results
   */
  analyzeMessage: async (clientMessage, outputFormat) => {
    try {
      const response = await axios.post(`${API_URL}/message/analyze`, {
        clientMessage,
        outputFormat
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing message:', error);
      throw new Error(error.response?.data?.message || 'Failed to analyze message');
    }
  },

  /**
   * Check API health
   * @returns {Promise<Object>} - Health status
   */
  checkHealth: async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Error checking API health:', error);
      throw new Error('API is not available');
    }
  },

  /**
   * Send LinkedIn URL and context to AI processor
   * @param {string} linkedinUrl - LinkedIn profile/company URL
   * @param {string} context - Additional context about the prospect/customer
   * @param {string} type - Type of URL ('profile' or 'company')
   * @returns {Promise<Object>} - Job ID and status
   */
  sendToAIProcessor: async (linkedinUrl, context, type) => {
    try {
      // This would be a webhook URL or API endpoint for your AI processor
      const response = await axios.post(`${API_URL}/ai-processor`, {
        linkedinUrl,
        context,
        type
      });
      return response.data;
    } catch (error) {
      console.error('Error sending to AI processor:', error);
      throw new Error(error.response?.data?.message || 'Failed to send data to AI processor');
    }
  },

  /**
   * Store LinkedIn data from AI processor (webhook handler)
   * @param {Object} data - Structured LinkedIn data
   * @returns {Promise<Object>} - Stored data
   */
  storeLinkedInData: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/store-linkedin-data`, data);
      return response.data;
    } catch (error) {
      console.error('Error storing LinkedIn data:', error);
      throw new Error(error.response?.data?.message || 'Failed to store LinkedIn data');
    }
  },

  /**
   * Optimize user prompt for AI research context
   * @param {string} originalPrompt - User's original input
   * @returns {Promise<Object>} - Optimized prompt
   */
  optimizePrompt: async (originalPrompt) => {
    try {
      const response = await axios.post(`${API_URL}/optimize-prompt`, {
        prompt: originalPrompt
      });
      return response.data;
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      throw new Error(error.response?.data?.message || 'Failed to optimize prompt');
    }
  },

  /**
   * Get all prospects
   * @returns {Promise<Array>} - List of prospects
   */
  getProspects: async () => {
    try {
      const response = await axios.get(`${API_URL}/prospects`);
      return response.data;
    } catch (error) {
      console.error('Error fetching prospects:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch prospects');
    }
  },

  /**
   * Get all companies
   * @returns {Promise<Array>} - List of companies
   */
  getCompanies: async () => {
    try {
      const response = await axios.get(`${API_URL}/companies`);
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch companies');
    }
  },

  /**
   * Get saved analyses
   * @returns {Promise<Array>} - List of saved analyses
   */
  getSavedAnalyses: async () => {
    try {
      const response = await axios.get(`${API_URL}/analyses`);
      return response.data;
    } catch (error) {
      console.error('Error fetching saved analyses:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch saved analyses');
    }
  }
};

export default apiService;