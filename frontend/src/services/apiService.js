import axios from 'axios';

// Create an axios instance with a longer timeout
const apiClient = axios.create({
  baseURL: 'http://localhost:5007/api',
  timeout: 60000, // 60 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

const API_URL = 'http://localhost:5007/api';

/**
 * Service for making API calls to the backend
 */
const apiService = {
  /**
   * Analyze a LinkedIn profile
   * @param {string} profileUrl - LinkedIn profile URL
   * @param {string} outputFormat - Desired output format (email, linkedin, phone)
   * @param {string} additionalContext - Additional context about the prospect
   * @param {Object} modelOptions - Model options for the agents
   * @returns {Promise<Object>} - Analysis results
   */
  analyzeProfile: async (profileUrl, outputFormat, additionalContext = '', modelOptions = {}) => {
    try {
      console.log(`Analyzing profile: ${profileUrl} with format: ${outputFormat}`);
      
      // Extract profile name from the URL
      const urlParts = profileUrl.split('/');
      const username = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
      
      // First, get profile data from the LinkedIn URL
      const profileResponse = await apiClient.post('/profile/analyze', {
        profileUrl,
        outputFormat
      });
      
      console.log("Profile data received:", profileResponse.data);
      
      if (profileResponse.data.status !== 'success') {
        throw new Error(profileResponse.data.message || 'Failed to analyze profile');
      }
      
      // Get the profile data from the API response
      const profileData = profileResponse.data.data.profileData;
      
      // Check if we have any indicators that scraping didn't get complete data
      const scrapingSuccess = profileData.scrapingSuccess !== false;
      
      // Then use the two-agent system to generate personalized content
      const mappedOutputType = mapOutputFormat(outputFormat);
      console.log(`Mapped output type: ${mappedOutputType}`);
      
      // Prepare context with more detail
      let enhancedContext = {
        notes: additionalContext ? additionalContext : ''
      };
      
      try {
        console.log("Calling agent/generate endpoint with:", {
          profileData,
          additionalContext: enhancedContext,
          outputType: mappedOutputType,
          options: modelOptions
        });
        
        const agentResponse = await apiClient.post('/agent/generate', {
          profileData,
          additionalContext: enhancedContext,
          outputType: mappedOutputType,
          options: modelOptions
        });
        
        console.log("Agent response received:", agentResponse.data);
        
        // Combine responses for backward compatibility
        return {
          status: 'success',
          data: {
            profileData: profileData,
            content: agentResponse.data.data.content,
            metadata: agentResponse.data.data.metadata
          }
        };
      } catch (agentError) {
        console.error("Agent generation failed:", agentError);
        
        // Fallback to just returning the profile data without agent-generated content
        return {
          status: 'success',
          data: {
            profileData: profileData,
            content: "Content generation with the two-agent system is currently unavailable. Please try again later.",
            metadata: null
          }
        };
      }
    } catch (error) {
      console.error('Error analyzing profile:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to analyze profile');
    }
  },
  
  /**
   * Generate content using the two-agent system
   * @param {Object} profileData - LinkedIn profile data
   * @param {Object} additionalContext - Additional context
   * @param {string} outputType - Desired output type
   * @param {Object} options - Model options
   * @returns {Promise<Object>} - Generated content
   */
  generateAgentContent: async (profileData, additionalContext = {}, outputType = 'sales_email', options = {}) => {
    try {
      console.log("Generating agent content for:", profileData.name);
      const response = await apiClient.post('/agent/generate', {
        profileData,
        additionalContext,
        outputType,
        options
      });
      return response.data;
    } catch (error) {
      console.error('Error generating agent content:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to generate content');
    }
  },
  
  /**
   * Test the fine-tuning agent
   * @param {Object} profileData - LinkedIn profile data
   * @param {Object} additionalContext - Additional context
   * @param {string} outputType - Desired output type
   * @returns {Promise<Object>} - Fine-tuning agent output
   */
  testFineTuningAgent: async (profileData, additionalContext = {}, outputType = 'sales_email') => {
    try {
      const response = await apiClient.post('/agent/test-fine-tuning', {
        profileData,
        additionalContext,
        outputType
      });
      return response.data;
    } catch (error) {
      console.error('Error testing fine-tuning agent:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to test fine-tuning agent');
    }
  },
  
  /**
   * Test the sales copy agent
   * @param {string} prompt - Prompt for the sales copy agent
   * @returns {Promise<Object>} - Sales copy agent output
   */
  testSalesCopyAgent: async (prompt) => {
    try {
      const response = await apiClient.post('/agent/test-sales-copy', {
        prompt
      });
      return response.data;
    } catch (error) {
      console.error('Error testing sales copy agent:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to test sales copy agent');
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
      const response = await apiClient.post('/company/analyze', {
        companyUrl,
        outputFormat
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing company:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to analyze company');
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
      const response = await apiClient.post('/message/analyze', {
        clientMessage,
        outputFormat
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing message:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to analyze message');
    }
  },

  /**
   * Check API health
   * @returns {Promise<Object>} - Health status
   */
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/health');
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

/**
 * Map UI output format to API output type
 * @param {string} outputFormat - UI output format (email, linkedin, phone)
 * @returns {string} - API output type
 */
const mapOutputFormat = (outputFormat) => {
  switch (outputFormat) {
    case 'email':
      return 'sales_email';
    case 'linkedin':
      return 'linkedin_message';
    case 'phone':
      return 'text_message';
    default:
      return 'sales_email';
  }
};

export default apiService;