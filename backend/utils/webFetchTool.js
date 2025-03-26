/**
 * Web Fetch Tool
 * 
 * A utility for fetching and processing web content using LLMs.
 * Note: This is a simplified version. In production, you would use a proper
 * API for web search and content retrieval.
 */

const axios = require('axios');
const OpenAI = require('openai');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Fetch and process web content using LLMs
 * @param {string} url - The URL to fetch
 * @param {string} prompt - The prompt to process the content
 * @returns {Promise<string>} - The processed content
 */
async function WebFetchTool(url, prompt) {
  try {
    console.log(`Fetching content from URL: ${url}`);
    
    // Simple content mock for demo purposes
    // In production, you would fetch real content from the URL
    let content;
    if (url.includes('google.com/search')) {
      content = mockSearchResults(url);
    } else {
      // For non-search URLs, try to fetch content (with limitations)
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 5000
        });
        content = response.data;
      } catch (error) {
        console.warn(`Failed to fetch URL ${url}:`, error.message);
        content = `Failed to fetch content from ${url}. Error: ${error.message}`;
      }
    }
    
    // Process content with LLM
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts and summarizes information from web content.'
        },
        {
          role: 'user',
          content: `Here is content from the URL ${url}:\n\n${content}\n\n${prompt}`
        }
      ],
      max_tokens: 500,
      temperature: 0.5
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error in WebFetchTool:', error);
    return `Error processing the URL: ${error.message}`;
  }
}

/**
 * Generate mock search results based on the query
 * @param {string} url - The search URL
 * @returns {string} - Mock search results
 */
function mockSearchResults(url) {
  const decodedUrl = decodeURIComponent(url);
  const query = decodedUrl.includes('q=') ? 
    decodedUrl.split('q=')[1].split('&')[0] : 
    'unknown query';
  
  console.log(`Mock search for query: ${query}`);
  
  // Extract company name from query
  const companyMatch = query.match(/(.*?)\s+construction/i);
  const companyName = companyMatch ? companyMatch[1] : 'the company';
  
  if (query.includes('size') || query.includes('employees')) {
    return `
      ${companyName} Construction - Company Profile
      ${companyName} Construction is a ${['small', 'medium', 'large'][Math.floor(Math.random() * 3)]} construction company with approximately ${Math.floor(Math.random() * 1000) + 100} employees. Founded in ${2000 - Math.floor(Math.random() * 30)}, they specialize in ${['commercial', 'residential', 'industrial', 'infrastructure'][Math.floor(Math.random() * 4)]} construction projects.
      
      Company Overview - ${companyName} Construction
      Headquarters: ${['Phoenix, AZ', 'Austin, TX', 'Denver, CO', 'Seattle, WA'][Math.floor(Math.random() * 4)]}
      Annual Revenue: $${Math.floor(Math.random() * 900) + 100} million
      Projects Completed: ${Math.floor(Math.random() * 500) + 100}
      Safety Record: ${Math.floor(Math.random() * 3) + 3}/5 stars
    `;
  } else if (query.includes('projects')) {
    return `
      Recent Projects - ${companyName} Construction
      ${companyName} recently completed the ${['Central Plaza', 'Riverside Development', 'Metro Tower', 'Harbor Complex'][Math.floor(Math.random() * 4)]} project valued at $${Math.floor(Math.random() * 100) + 20} million. The project was completed ${Math.random() > 0.5 ? 'ahead of schedule' : 'on schedule'} and ${Math.random() > 0.7 ? 'under budget' : 'within budget'}.
      
      Upcoming Projects for ${companyName}
      ${companyName} has been awarded the contract for the new ${['City Center Revitalization', 'University Campus Expansion', 'Healthcare Facility', 'Mixed-Use Development'][Math.floor(Math.random() * 4)]} project, expected to begin in Q${Math.floor(Math.random() * 4) + 1} ${new Date().getFullYear()}.
    `;
  } else if (query.includes('news')) {
    return `
      ${companyName} Construction News
      ${companyName} recently ${['expanded operations', 'opened a new office', 'won a major contract', 'partnered with a technology provider'][Math.floor(Math.random() * 4)]} in ${['Phoenix', 'Austin', 'Denver', 'Seattle'][Math.floor(Math.random() * 4)]}.
      
      Industry News
      Construction industry faces challenges with ${['supply chain disruptions', 'labor shortages', 'rising material costs', 'regulatory compliance'][Math.floor(Math.random() * 4)]}. ${companyName} implementing ${['new technology', 'improved processes', 'strategic partnerships', 'staff training'][Math.floor(Math.random() * 4)]} to address these issues.
    `;
  } else {
    return `
      ${companyName} Construction - General Information
      ${companyName} is a ${['well-established', 'growing', 'leading', 'recognized'][Math.floor(Math.random() * 4)]} construction company specializing in ${['commercial', 'residential', 'industrial', 'infrastructure'][Math.floor(Math.random() * 4)]} projects.
      
      The company has been in business for ${Math.floor(Math.random() * 30) + 10} years and has completed over ${Math.floor(Math.random() * 500) + 100} projects. They are known for their ${['quality', 'innovation', 'reliability', 'efficiency'][Math.floor(Math.random() * 4)]} and commitment to ${['safety', 'sustainability', 'client satisfaction', 'community development'][Math.floor(Math.random() * 4)]}.
      
      Current challenges in the industry include ${['labor shortages', 'supply chain disruptions', 'rising material costs', 'regulatory compliance'][Math.floor(Math.random() * 4)]}.
    `;
  }
}

module.exports = { WebFetchTool };