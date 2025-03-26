/**
 * Two-Agent Service
 * 
 * This service coordinates the workflow between the fine-tuning agent and the
 * sales copy generation agent to create personalized outreach content.
 */

const multiLLMService = require('./multiLLMService');
const researchService = require('./researchService');
const { formatFineTuningPrompt, formatSalesCopyPrompt } = require('../utils/prompt-formatter');
const agentPrompts = require('../config/agent-prompts');

/**
 * Two-Agent service for personalized content generation
 */
const twoAgentService = {
  /**
   * Run the complete two-agent process to generate personalized sales copy
   * @param {Object} profileData - LinkedIn profile data
   * @param {Object} additionalContext - Additional context provided by the user
   * @param {string} outputType - Desired output format (email, linkedin, etc.)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - The generated content and metadata
   */
  generatePersonalizedContent: async (profileData, additionalContext, outputType, options = {}) => {
    try {
      console.log(`Starting two-agent process for ${profileData.name || 'Unknown'}`);
      
      // Step 1: Gather research information
      console.log('Step 1: Gathering research information');
      const [companyResearch, roleAnalysis, industryTrends] = await Promise.all([
        researchService.researchCompany(profileData.company || ''),
        researchService.analyzeRole(profileData.title || ''),
        researchService.getIndustryTrends()
      ]);
      
      // Step 2: Format data for the fine-tuning agent
      console.log('Step 2: Preparing data for fine-tuning agent');
      const fineTuningPromptData = formatFineTuningPrompt(
        profileData,
        additionalContext || {},
        companyResearch,
        roleAnalysis,
        industryTrends,
        outputType
      );
      
      // Log the prepared prompt data to help with debugging
      console.log('Fine-tuning agent prompt prepared:', {
        profileData: fineTuningPromptData.profileData,
        companyInfo: fineTuningPromptData.companyInfo,
        outputType: fineTuningPromptData.outputType
      });
      
      // Step 3: Run the fine-tuning agent to generate a tailored prompt
      console.log('Step 3: Running fine-tuning agent');
      // Use system prompt + user prompt for the fine-tuning agent
      const fineTuningSystemPrompt = fineTuningPromptData.systemPrompt;
      const fineTuningUserPrompt = fineTuningPromptData.userPrompt;
      
      // Generate content using the fine-tuning agent (gpt-4o-mini)
      const fineTuningOutput = await multiLLMService.generateWithOpenAI(
        fineTuningUserPrompt,
        {
          systemPrompt: fineTuningSystemPrompt,
          model: options.fineTuningModel || 'gpt-4o-mini',
          task: 'fine-tuning'
        }
      );
      
      console.log('Fine-tuning agent completed successfully');
      
      // Step 4: Format the fine-tuning output for the sales copy agent
      console.log('Step 4: Preparing data for sales copy agent');
      const salesCopyPromptData = formatSalesCopyPrompt(
        fineTuningOutput,
        profileData,
        outputType
      );
      
      // Step 5: Run the sales copy agent to generate the final content
      console.log('Step 5: Running sales copy agent');
      // Use system prompt + user prompt for the sales copy agent
      const salesCopySystemPrompt = salesCopyPromptData.systemPrompt;
      const salesCopyUserPrompt = salesCopyPromptData.userPrompt;
      
      // Generate content using the sales copy agent (claude-3-opus)
      const salesCopyOutput = await multiLLMService.generateWithClaude(
        salesCopyUserPrompt,
        {
          systemPrompt: salesCopySystemPrompt,
          model: options.salesCopyModel || 'claude-3-opus-20240229',
          task: 'sales_copy'
        }
      );
      
      console.log('Sales copy agent completed successfully');
      
      // Step 6: Return the final content and metadata
      return {
        content: salesCopyOutput,
        metadata: {
          profile: {
            name: profileData.name,
            title: profileData.title,
            company: profileData.company
          },
          researchSummary: {
            companySize: companyResearch.companySize,
            industryFocus: companyResearch.industryFocus,
            roleCategory: roleAnalysis.roleCategory,
            painPoints: roleAnalysis.painPoints
          },
          outputType: outputType,
          process: {
            fineTuningPrompt: fineTuningUserPrompt,
            fineTuningOutput: fineTuningOutput,
            salesCopyPrompt: salesCopyUserPrompt
          }
        }
      };
    } catch (error) {
      console.error('Error in two-agent process:', error);
      
      // Implement fallback generation if needed
      if (error.message.includes('fine-tuning') || options.skipFineTuning) {
        // Try direct generation with the sales copy agent
        return twoAgentService.generateWithSalesCopyAgentOnly(profileData, additionalContext, outputType, options);
      }
      
      throw error;
    }
  },
  
  /**
   * Fallback: Generate content using only the sales copy agent
   * @param {Object} profileData - LinkedIn profile data
   * @param {Object} additionalContext - Additional context provided by the user
   * @param {string} outputType - Desired output format
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - The generated content and metadata
   */
  generateWithSalesCopyAgentOnly: async (profileData, additionalContext, outputType, options = {}) => {
    try {
      console.log('Falling back to sales copy agent only generation');
      
      // Create a direct prompt for the sales copy agent
      const name = profileData.name || 'Unknown';
      const jobTitle = profileData.title || 'Unknown';
      const company = profileData.company || 'Unknown';
      const notes = (additionalContext && additionalContext.notes) ? additionalContext.notes : '';
      const outreachType = outputType || 'sales email';
      
      const directPrompt = `
Generate a ${outreachType} for ${name}, ${jobTitle} at ${company}.

The message should showcase VigilantEx's "4 Extra Employees" concept, highlight relevant benefits for a ${jobTitle}, and conclude with a clear call to action. 

Make it professional, conversational, and under 300 words.

Additional context: ${notes}
      `;
      
      // Generate content using the sales copy agent
      const salesCopyOutput = await multiLLMService.generateWithClaude(
        directPrompt,
        {
          systemPrompt: agentPrompts.salesCopyAgentPrompt,
          model: options.salesCopyModel || 'claude-3-opus-20240229',
          task: 'sales_copy_direct'
        }
      );
      
      console.log('Direct sales copy generation completed successfully');
      
      // Return the result
      return {
        content: salesCopyOutput,
        metadata: {
          profile: {
            name: profileData.name,
            title: profileData.title,
            company: profileData.company
          },
          researchSummary: {
            companySize: 'unknown',
            industryFocus: 'construction',
            roleCategory: 'unknown',
            painPoints: []
          },
          outputType: outputType,
          process: {
            directPrompt: directPrompt,
            fineTuningSkipped: true
          }
        }
      };
    } catch (error) {
      console.error('Error in direct sales copy generation:', error);
      throw error;
    }
  },
  
  /**
   * Run only the fine-tuning agent for testing
   * @param {Object} profileData - LinkedIn profile data
   * @param {Object} additionalContext - Additional context
   * @param {string} outputType - Desired output format
   * @returns {Promise<string>} - The fine-tuning agent's output
   */
  testFineTuningAgent: async (profileData, additionalContext, outputType) => {
    try {
      console.log(`Testing fine-tuning agent for ${profileData.name || 'Unknown'}`);
      
      // Gather research information
      const [companyResearch, roleAnalysis, industryTrends] = await Promise.all([
        researchService.researchCompany(profileData.company || ''),
        researchService.analyzeRole(profileData.title || ''),
        researchService.getIndustryTrends()
      ]);
      
      // Format data for the fine-tuning agent
      const fineTuningPromptData = formatFineTuningPrompt(
        profileData,
        additionalContext || {},
        companyResearch,
        roleAnalysis,
        industryTrends,
        outputType
      );
      
      // Run the fine-tuning agent
      const fineTuningSystemPrompt = fineTuningPromptData.systemPrompt;
      const fineTuningUserPrompt = fineTuningPromptData.userPrompt;
      
      const fineTuningOutput = await multiLLMService.generateWithOpenAI(
        fineTuningUserPrompt,
        {
          systemPrompt: fineTuningSystemPrompt,
          model: 'gpt-4o-mini',
          task: 'fine-tuning_test'
        }
      );
      
      return {
        output: fineTuningOutput,
        promptData: fineTuningPromptData
      };
    } catch (error) {
      console.error('Error testing fine-tuning agent:', error);
      throw error;
    }
  },
  
  /**
   * Run only the sales copy agent for testing
   * @param {string} prompt - The prompt for the sales copy agent
   * @returns {Promise<string>} - The sales copy agent's output
   */
  testSalesCopyAgent: async (prompt) => {
    try {
      console.log('Testing sales copy agent');
      
      const salesCopyOutput = await multiLLMService.generateWithClaude(
        prompt,
        {
          systemPrompt: agentPrompts.salesCopyAgentPrompt,
          model: 'claude-3-opus-20240229',
          task: 'sales_copy_test'
        }
      );
      
      return salesCopyOutput;
    } catch (error) {
      console.error('Error testing sales copy agent:', error);
      throw error;
    }
  }
};

module.exports = twoAgentService;