/**
 * Research Service
 * 
 * This service handles web research for company information and role-specific insights
 * to support the two-agent system.
 */

const { WebFetchTool } = require('../utils/webFetchTool');
const agentPrompts = require('../config/agent-prompts');
const multiLLMService = require('./multiLLMService');

/**
 * Research service for gathering information about companies and roles
 */
const researchService = {
  /**
   * Research company information using web sources
   * @param {string} companyName - The name of the company to research
   * @returns {Promise<Object>} - Information about the company
   */
  researchCompany: async (companyName) => {
    try {
      console.log(`Researching company: ${companyName}`);
      
      // Generate search queries
      const queries = [
        `${companyName} construction company`,
        `${companyName} construction projects`,
        `${companyName} construction news`,
        `${companyName} company size employees`
      ];
      
      // Execute queries and collect results
      const results = [];
      for (const query of queries) {
        try {
          // Construct a URL for search
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          
          // Use WebFetchTool to get search results
          // Note: In a production environment, you would use a proper search API
          const result = await WebFetchTool(
            searchUrl,
            `Extract key information about ${companyName} from these search results. Focus on company size, industry focus, recent projects, and news.`
          );
          
          results.push(result);
        } catch (error) {
          console.error(`Error researching query "${query}":`, error);
        }
      }
      
      // Process results with LLM to extract structured information
      const researchPrompt = `Analyze the following search results about ${companyName} and extract key information:
      
      ${results.join('\n\n')}
      
      Please provide a structured summary with these sections:
      1. Company Size (small/medium/large)
      2. Industry Focus
      3. Recent Projects
      4. Recent News
      5. Challenges or Opportunities
      
      Format as JSON.`;
      
      const structuredInfo = await multiLLMService.generateContent(
        researchPrompt,
        'analysis',
        { model: 'gpt-4o-mini' }
      );
      
      // Try to parse as JSON, fallback to text if parsing fails
      try {
        return JSON.parse(structuredInfo);
      } catch (error) {
        console.warn('Could not parse research results as JSON, returning text');
        return { 
          rawResearch: structuredInfo,
          companyName
        };
      }
    } catch (error) {
      console.error('Error in company research:', error);
      
      // Return basic information if research fails
      return {
        companyName,
        companySize: 'unknown',
        industryFocus: 'construction',
        recentProjects: [],
        recentNews: [],
        challengesOpportunities: []
      };
    }
  },
  
  /**
   * Get role-specific information using the multiLLM service
   * @param {string} jobTitle - The job title to analyze
   * @returns {Promise<Object>} - Role-specific information
   */
  analyzeRole: async (jobTitle) => {
    try {
      console.log(`Analyzing role: ${jobTitle}`);
      
      // Map the job title to a standardized role category
      const roleCategory = mapToRoleCategory(jobTitle);
      
      // Get role analysis prompt
      const rolePrompt = `As an expert in construction industry roles, analyze the position of ${jobTitle}.
      
      Please provide:
      1. Primary responsibilities
      2. Key pain points and challenges
      3. Metrics they typically care about
      4. How VigilantEx's surveillance and monitoring solutions could specifically help them
      5. Best approach for personalized outreach
      
      Format as JSON with these exact fields: responsibilities, painPoints, metrics, vigilantExBenefits, outreachApproach`;
      
      const roleAnalysis = await multiLLMService.generateContent(
        rolePrompt,
        'analysis',
        { model: 'gpt-4o-mini' }
      );
      
      // Try to parse as JSON, fallback to text if parsing fails
      try {
        const parsedAnalysis = JSON.parse(roleAnalysis);
        return {
          ...parsedAnalysis,
          roleCategory
        };
      } catch (error) {
        console.warn('Could not parse role analysis as JSON, returning text');
        return { 
          rawAnalysis: roleAnalysis,
          roleCategory,
          jobTitle
        };
      }
    } catch (error) {
      console.error('Error in role analysis:', error);
      
      // Return basic information if analysis fails
      return {
        jobTitle,
        roleCategory: mapToRoleCategory(jobTitle),
        responsibilities: [],
        painPoints: [],
        metrics: [],
        vigilantExBenefits: [],
        outreachApproach: "Focus on the '4 Extra Employees' concept and role-specific benefits"
      };
    }
  },
  
  /**
   * Research industry trends related to construction
   * @returns {Promise<Array>} - List of industry trends
   */
  getIndustryTrends: async () => {
    try {
      console.log('Researching construction industry trends');
      
      // Use multiLLM to generate industry trends based on common knowledge
      const trendsPrompt = `Provide 5 current trends in the construction industry related to security, safety, and project management. 
      Format as a JSON array of trend objects, each with 'trend' and 'relevance' properties showing how it relates to construction site surveillance.`;
      
      const trendsResult = await multiLLMService.generateContent(
        trendsPrompt,
        'analysis',
        { model: 'gpt-4o-mini' }
      );
      
      // Try to parse as JSON, fallback to array if parsing fails
      try {
        return JSON.parse(trendsResult);
      } catch (error) {
        console.warn('Could not parse trends as JSON, returning default trends');
        return [
          {
            trend: "Increasing construction site theft and vandalism",
            relevance: "Creates urgent need for advanced surveillance systems"
          },
          {
            trend: "Rising OSHA penalties for safety violations",
            relevance: "Makes proactive safety monitoring more important than ever"
          },
          {
            trend: "Labor shortages in construction",
            relevance: "Creates need for efficiency tools that maximize worker productivity"
          },
          {
            trend: "Adoption of digital documentation for dispute resolution",
            relevance: "Highlights value of continuous video documentation"
          },
          {
            trend: "Remote site management becoming standard",
            relevance: "Increases demand for solutions with remote monitoring capabilities"
          }
        ];
      }
    } catch (error) {
      console.error('Error getting industry trends:', error);
      
      // Return default trends if research fails
      return [
        {
          trend: "Increasing construction site theft and vandalism",
          relevance: "Creates urgent need for advanced surveillance systems"
        },
        {
          trend: "Rising OSHA penalties for safety violations",
          relevance: "Makes proactive safety monitoring more important than ever"
        }
      ];
    }
  }
};

/**
 * Map a job title to a standardized role category
 * @param {string} jobTitle - The job title to map
 * @returns {string} - The standardized role category
 */
function mapToRoleCategory(jobTitle) {
  const title = jobTitle.toLowerCase();
  
  if (title.includes('pre-construction') || title.includes('preconstruction') || title.includes('planning')) {
    return 'pre_construction_manager';
  } else if (title.includes('operations') || title.includes('director') || title.includes('coo')) {
    return 'operations_director';
  } else if (title.includes('safety') || title.includes('compliance') || title.includes('osha')) {
    return 'safety_director';
  } else if (title.includes('executive') || title.includes('ceo') || title.includes('president') || title.includes('owner')) {
    return 'project_executive';
  } else if (title.includes('superintendent') || title.includes('foreman') || title.includes('supervisor')) {
    return 'site_superintendent';
  } else if (title.includes('project manager') || title.includes('pm')) {
    return 'project_executive';
  }
  
  // Default to operations_director if no match is found
  return 'operations_director';
}

module.exports = researchService;