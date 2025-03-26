/**
 * Prompt Formatter
 * 
 * Utility for formatting prompts for the fine-tuning and sales copy agents
 */

const agentPrompts = require('../config/agent-prompts');

/**
 * Format LinkedIn profile data for the fine-tuning agent
 * @param {Object} profileData - LinkedIn profile data
 * @param {Object} additionalContext - Additional context provided
 * @param {Object} companyResearch - Company research results
 * @param {Object} roleAnalysis - Role analysis results
 * @param {Array} industryTrends - Industry trends
 * @param {string} outputType - The desired output type
 * @returns {Object} - Formatted prompt data
 */
function formatFineTuningPrompt(profileData, additionalContext, companyResearch, roleAnalysis, industryTrends, outputType) {
  // Extract key information from profile data
  const name = profileData.name || 'Unknown';
  const jobTitle = profileData.title || 'Unknown';
  const company = profileData.company || 'Unknown';
  
  // Get role category and associated information
  const roleCategory = roleAnalysis.roleCategory || 'operations_director';
  const rolePainPoints = roleAnalysis.painPoints || [];
  const roleResponsibilities = roleAnalysis.responsibilities || [];
  
  // Extract company information
  const companySize = companyResearch.companySize || 'Unknown';
  const industryFocus = companyResearch.industryFocus || 'construction';
  const recentProjects = companyResearch.recentProjects || [];
  const recentNews = companyResearch.recentNews || [];
  
  // Get recent industry trends
  const relevantTrends = industryTrends.slice(0, 3).map(t => t.trend);
  
  // Determine output format
  const outreachType = mapOutputType(outputType);
  
  // Format context for the fine-tuning agent
  const contextForAgent = `
Profile Information:
- Name: ${name}
- Job Title: ${jobTitle}
- Company: ${company}
- Location: ${profileData.location || 'Unknown'}

Company Research:
- Size: ${companySize}
- Industry Focus: ${industryFocus}
- Recent Projects: ${formatList(recentProjects)}
- Recent News: ${formatList(recentNews)}

Role Analysis:
- Category: ${roleCategory}
- Pain Points: ${formatList(rolePainPoints)}
- Responsibilities: ${formatList(roleResponsibilities)}

Industry Trends:
${relevantTrends.map(trend => `- ${trend}`).join('\n')}

Additional Context and Instructions:
${additionalContext.notes ? `IMPORTANT: ${additionalContext.notes}` : 'No additional context provided.'}
${additionalContext.scrapingResult ? `Note: ${additionalContext.scrapingResult}` : ''}

Output Type Requested: ${outreachType}

SPECIAL INSTRUCTIONS:
1. If additional context mentions a previous demo or meeting, focus on FOLLOW-UP content rather than offering a new demo.
2. If additional context mentions specific next steps (like site proposals), make those the central focus of the message.
3. Keep the message concise and direct, focusing on the most relevant pain points for a ${jobTitle}.
  `;
  
  return {
    systemPrompt: agentPrompts.fineTuningAgentPrompt,
    userPrompt: contextForAgent,
    profileData: {
      name,
      jobTitle,
      company,
      roleCategory,
      painPoints: rolePainPoints
    },
    companyInfo: {
      size: companySize,
      industry: industryFocus,
      recentProjects,
      recentNews
    },
    outputType: outreachType
  };
}

/**
 * Format the output from the fine-tuning agent for the sales copy agent
 * @param {string} fineTuningOutput - Output from the fine-tuning agent
 * @param {Object} profileData - The original profile data
 * @param {string} outputType - The desired output type
 * @returns {Object} - Formatted data for the sales copy agent
 */
function formatSalesCopyPrompt(fineTuningOutput, profileData, outputType) {
  // Extract key information from profile
  const name = profileData.name || 'Unknown';
  const jobTitle = profileData.title || 'Unknown';
  const company = profileData.company || 'Unknown';
  
  // Process the fine-tuning output
  // This will already be a prompted instruction for the sales copy agent
  const prompt = fineTuningOutput.trim();
  
  return {
    systemPrompt: agentPrompts.salesCopyAgentPrompt,
    userPrompt: prompt,
    profileData: {
      name,
      jobTitle,
      company
    },
    outputType: mapOutputType(outputType)
  };
}

/**
 * Map output type to a standardized format
 * @param {string} outputType - The output type string
 * @returns {string} - Standardized output type
 */
function mapOutputType(outputType) {
  const type = outputType.toLowerCase();
  
  if (type.includes('email') && type.includes('follow')) {
    return 'follow-up email';
  } else if (type.includes('email') && type.includes('demo')) {
    return 'after-demo email';
  } else if (type.includes('email')) {
    return 'sales email';
  } else if (type.includes('linkedin') && type.includes('connect')) {
    return 'LinkedIn connection request';
  } else if (type.includes('linkedin') && type.includes('post')) {
    return 'LinkedIn post';
  } else if (type.includes('linkedin')) {
    return 'LinkedIn message';
  } else if (type.includes('text') || type.includes('sms')) {
    return 'text message';
  }
  
  // Default to sales email
  return 'sales email';
}

/**
 * Format an array into a readable list string
 * @param {Array} arr - The array to format
 * @returns {string} - Formatted list string
 */
function formatList(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return 'None available';
  }
  
  return arr.join(', ');
}

module.exports = {
  formatFineTuningPrompt,
  formatSalesCopyPrompt
};