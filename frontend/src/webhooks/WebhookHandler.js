/**
 * Webhook handler for receiving LinkedIn data from external sources (like Zapier)
 */
import apiService from '../services/apiService';
import ProspectModel from '../models/ProspectModel';
import CompanyModel from '../models/CompanyModel';

// Function to process incoming webhook data
export const processWebhookData = async (data) => {
  try {
    // Check if the data has the expected structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid webhook data format');
    }
    
    // Determine if this is profile or company data
    let type = 'unknown';
    if (data.contactName && data.contactTitle) {
      type = 'profile';
    } else if (data.companyName && data.companyIndustry) {
      type = 'company';
    }
    
    // Process based on type
    if (type === 'profile') {
      // Create a prospect model from the data
      const prospect = ProspectModel.fromLinkedInData(data);
      
      // Store the prospect data
      await apiService.storeLinkedInData({
        type: 'profile',
        data: prospect.toJSON()
      });
      
      return {
        success: true,
        type: 'profile',
        message: `Successfully processed profile data for ${data.contactName}`,
        prospect: prospect.toJSON()
      };
    } 
    else if (type === 'company') {
      // Create a company model from the data
      const company = CompanyModel.fromLinkedInData(data);
      
      // Store the company data
      await apiService.storeLinkedInData({
        type: 'company',
        data: company.toJSON()
      });
      
      return {
        success: true,
        type: 'company',
        message: `Successfully processed company data for ${data.companyName}`,
        company: company.toJSON()
      };
    }
    else {
      throw new Error('Unable to determine data type (profile or company)');
    }
  } catch (error) {
    console.error('Error processing webhook data:', error);
    return {
      success: false,
      message: error.message || 'Failed to process webhook data',
      error: error.toString()
    };
  }
};

/**
 * Express middleware function for handling webhooks
 * (To be used on the backend)
 */
export const webhookMiddleware = (req, res, next) => {
  const data = req.body;
  
  processWebhookData(data)
    .then(result => {
      res.status(result.success ? 200 : 400).json(result);
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Server error processing webhook',
        error: error.toString()
      });
    });
};

export default {
  processWebhookData,
  webhookMiddleware
};