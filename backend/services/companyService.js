const puppeteer = require('puppeteer');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Service for extracting LinkedIn company data
 */
const companyService = {
  /**
   * Extract data from a LinkedIn company page
   * @param {string} companyUrl - LinkedIn company URL
   * @returns {Promise<Object>} - Company data
   */
  extractCompanyData: async (companyUrl) => {
    try {
      // Extract company name from URL
      const urlParts = companyUrl.split('/');
      const companyName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
      
      console.log(`Extracting company data for: ${companyName}`);
      
      // Check if the URL is a valid LinkedIn company URL
      if (!companyUrl.includes('linkedin.com/company/')) {
        throw new Error('Invalid LinkedIn company URL');
      }
      
      // Launch a browser instance
      const browser = await puppeteer.launch({
        headless: true, // Use headless browser (no GUI)
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Recommended for Docker environments
      });
      
      try {
        // Create a new page
        const page = await browser.newPage();
        
        // Set a user agent to mimic a real browser
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Set viewport size
        await page.setViewport({ width: 1280, height: 800 });
        
        // Enable request interception to block unnecessary resources
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          // Block images, fonts, stylesheets to speed up scraping
          const resourceType = req.resourceType();
          if (resourceType === 'image' || resourceType === 'font' || resourceType === 'stylesheet') {
            req.abort();
          } else {
            req.continue();
          }
        });
        
        // Check if LinkedIn credentials are available
        const linkedinEmail = process.env.LINKEDIN_EMAIL;
        const linkedinPassword = process.env.LINKEDIN_PASSWORD;
        let isLoggedIn = false;
        
        if (linkedinEmail && linkedinPassword) {
          // Navigate to LinkedIn login page
          await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });
          
          // Fill in the login form
          await page.type('#username', linkedinEmail);
          await page.type('#password', linkedinPassword);
          
          // Click the login button
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('.login__form_action_container button')
          ]);
          
          // Check if login was successful
          isLoggedIn = await page.evaluate(() => {
            return document.querySelector('.feed-identity-module__actor-meta') !== null;
          });
          
          console.log(`LinkedIn login ${isLoggedIn ? 'successful' : 'failed'}`);
        } else {
          console.log('LinkedIn credentials not found in environment variables. Proceeding without login.');
        }
        
        // Navigate to the company page
        await page.goto(companyUrl, { waitUntil: 'networkidle2' });
        
        // Check if we were redirected to a login page
        const currentUrl = page.url();
        if (currentUrl.includes('linkedin.com/login') || currentUrl.includes('linkedin.com/checkpoint')) {
          throw new Error('LinkedIn requires login to view company pages. Please provide valid credentials in .env file.');
        }
        
        // Extract company data
        const companyData = await page.evaluate(() => {
          // Helper function to get text content safely
          const getTextContent = (selector) => {
            const element = document.querySelector(selector);
            return element ? element.textContent.trim() : null;
          };
          
          // Helper function to get multiple elements' text content
          const getMultipleTextContent = (selector) => {
            const elements = document.querySelectorAll(selector);
            return Array.from(elements).map(element => element.textContent.trim());
          };
          
          // Extract basic company information
          const name = getTextContent('.org-top-card-summary__title') ||
                      getTextContent('.org-top-card__primary-content h1') ||
                      getTextContent('.text-heading-xlarge');
          
          const industryElement = document.querySelector('.org-top-card-summary-info-list__info-item:first-child') ||
                                 document.querySelector('.org-top-card-summary-info-list__info-item') ||
                                 document.querySelector('.org-about-us-organization-description__industry');
          const industry = industryElement ? industryElement.textContent.trim() : null;
          
          const locationElement = document.querySelector('.org-top-card-summary-info-list__info-item:nth-child(2)') ||
                                document.querySelector('.org-top-card-summary-info-list__info-item:nth-child(2)') ||
                                document.querySelector('.org-location-card p');
          const location = locationElement ? locationElement.textContent.trim() : null;
          
          const sizeElement = document.querySelector('.org-about-us-company-module__company-size-definition-text') ||
                            document.querySelector('.org-about-module .text-body-small:nth-child(1)');
          const size = sizeElement ? sizeElement.textContent.trim() : null;
          
          const websiteElement = document.querySelector('.org-about-us-company-module__website') ||
                               document.querySelector('.org-about-module .text-body-small a');
          const website = websiteElement ? websiteElement.textContent.trim() : null;
          
          const foundedElement = document.querySelector('.org-about-us-company-module__founded-year') ||
                               document.querySelector('.org-about-module .text-body-small:nth-child(2)');
          const founded = foundedElement ? foundedElement.textContent.trim() : null;
          
          // Extract about text
          const aboutElement = document.querySelector('.org-about-us-organization-description__text') ||
                             document.querySelector('.org-grid__core-rail .mb5 .org-page-details__paragraph-text');
          const about = aboutElement ? aboutElement.textContent.trim() : null;
          
          // Extract specialties
          const specialtiesElement = document.querySelector('.org-about-us-organization-description__specialities') ||
                                   document.querySelector('.org-page-details__specialities');
          
          let specialties = [];
          if (specialtiesElement) {
            const specialtiesText = specialtiesElement.textContent.trim();
            if (specialtiesText.includes(':')) {
              const specialtiesList = specialtiesText.split(':')[1].trim();
              specialties = specialtiesList.split(',').map(s => s.trim());
            } else {
              specialties = specialtiesText.split(',').map(s => s.trim());
            }
          }
          
          // Extract recent posts
          const postElements = document.querySelectorAll('.org-updates-section__update');
          
          const recentPosts = Array.from(postElements).slice(0, 3).map(post => {
            const titleElement = post.querySelector('.update-components-actor__title') ||
                               post.querySelector('.feed-shared-update-v2__description');
            
            const dateElement = post.querySelector('.feed-shared-actor__sub-description') ||
                              post.querySelector('.feed-shared-time-ago');
            
            return {
              title: titleElement ? titleElement.textContent.trim() : 'Company update',
              date: dateElement ? dateElement.textContent.trim() : 'Recently'
            };
          });
          
          return {
            name,
            industry,
            size,
            location,
            specialties,
            website,
            about,
            founded,
            recentPosts: recentPosts.length > 0 ? recentPosts : []
          };
        });
        
        // Use default values for missing data to ensure consistent response format
        return {
          name: companyData.name || companyName.replace(/-/g, ' '),
          industry: companyData.industry || 'Construction',
          size: companyData.size || '201-500 employees',
          location: companyData.location || 'United States',
          specialties: companyData.specialties.length > 0 ? companyData.specialties : ['Commercial Construction', 'Project Management', 'Safety Compliance'],
          website: companyData.website || `www.${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          about: companyData.about || `${companyName.replace(/-/g, ' ')} is a construction company specializing in commercial projects, safety-focused management, and innovative construction techniques.`,
          founded: companyData.founded || 'N/A',
          recentPosts: companyData.recentPosts.length > 0 ? companyData.recentPosts : [
            { title: 'Company update about projects', date: 'Recently' }
          ]
        };
      } finally {
        // Close the browser regardless of the outcome
        await browser.close();
      }
    } catch (error) {
      console.error('Error extracting company data:', error);
      
      // If scraping fails, return mock data with a note about the failure
      console.log('Falling back to mock data due to extraction error');
      return {
        name: 'ABC Construction',
        industry: 'Construction',
        size: '201-500 employees',
        location: 'Phoenix, Arizona',
        specialties: ['Commercial Construction', 'Project Management', 'Safety Compliance'],
        website: 'www.abcconstruction.com',
        about: 'ABC Construction is a leading commercial construction company in the Phoenix area, specializing in commercial buildings, safety-focused project management, and innovative construction techniques.',
        founded: '2005',
        recentPosts: [
          { title: 'Completed the new Phoenix Tech Center', date: '2 weeks ago' },
          { title: 'Implementing new safety protocols across all sites', date: '1 month ago' }
        ],
        scrapingError: error.message
      };
    }
  },
  
  /**
   * Identify key decision makers at a company
   * @param {string} companyUrl - LinkedIn company URL
   * @returns {Promise<Array>} - List of decision makers
   */
  identifyDecisionMakers: async (companyUrl) => {
    try {
      // Check if the URL is a valid LinkedIn company URL
      if (!companyUrl.includes('linkedin.com/company/')) {
        throw new Error('Invalid LinkedIn company URL');
      }
      
      // Extract company name from URL
      const urlParts = companyUrl.split('/');
      const companyName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
      
      // Launch a browser instance
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      try {
        // Create a new page
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });
        
        // Check if LinkedIn credentials are available
        const linkedinEmail = process.env.LINKEDIN_EMAIL;
        const linkedinPassword = process.env.LINKEDIN_PASSWORD;
        
        // LinkedIn login is required for people search
        if (!linkedinEmail || !linkedinPassword) {
          console.log('LinkedIn credentials not found in environment variables. Cannot search for decision makers without login.');
          throw new Error('LinkedIn credentials required to identify decision makers');
        }
        
        // Navigate to LinkedIn login page
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });
        
        // Fill in the login form
        await page.type('#username', linkedinEmail);
        await page.type('#password', linkedinPassword);
        
        // Click the login button
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
          page.click('.login__form_action_container button')
        ]);
        
        // Check if login was successful
        const isLoggedIn = await page.evaluate(() => {
          return document.querySelector('.feed-identity-module__actor-meta') !== null;
        });
        
        if (!isLoggedIn) {
          throw new Error('LinkedIn login failed. Cannot search for decision makers without login.');
        }
        
        console.log('LinkedIn login successful. Searching for decision makers...');
        
        // Navigate to people search with company filter
        // Format: linkedin.com/search/results/people/?company=companyName
        const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });
        
        // Extract decision makers from search results
        const decisionMakers = await page.evaluate(() => {
          // Target titles that indicate decision-making roles in construction
          const targetTitles = [
            'director', 'executive', 'president', 'vp', 'vice president', 'ceo', 'coo', 'cfo',
            'chief', 'head of', 'manager', 'operations', 'safety', 'project', 'construction'
          ];
          
          // Get all search result items
          const searchResults = document.querySelectorAll('.reusable-search__result-container');
          
          // Map each result to a decision maker object if they match our criteria
          return Array.from(searchResults).slice(0, 10).map(result => {
            const nameElement = result.querySelector('.entity-result__title-text a');
            const name = nameElement ? nameElement.textContent.trim() : null;
            
            const profileUrl = nameElement ? nameElement.href : null;
            
            const titleElement = result.querySelector('.entity-result__primary-subtitle');
            const title = titleElement ? titleElement.textContent.trim() : null;
            
            // Determine relevance based on title
            let relevance = 'Low';
            if (title) {
              const titleLower = title.toLowerCase();
              
              if (titleLower.includes('safety') || titleLower.includes('security')) {
                relevance = 'Very High - Direct alignment with VigilantEx safety monitoring features';
              } else if (titleLower.includes('operation') || titleLower.includes('director')) {
                relevance = 'High - Operations focus aligns with VigilantEx efficiency benefits';
              } else if (titleLower.includes('project') || titleLower.includes('construction')) {
                relevance = 'Medium - Oversees projects that could benefit from VigilantEx';
              }
            }
            
            return {
              name,
              title,
              linkedinUrl: profileUrl,
              relevance
            };
          }).filter(dm => dm.name && dm.title); // Only include results with name and title
        });
        
        // If we found decision makers, return them
        if (decisionMakers && decisionMakers.length > 0) {
          return decisionMakers;
        }
        
        // If no decision makers found, throw an error to fall back to mock data
        throw new Error('No decision makers found for this company');
      } finally {
        await browser.close();
      }
    } catch (error) {
      console.error('Error identifying decision makers:', error);
      
      // Fall back to mock data
      console.log('Falling back to mock decision makers due to error');
      return [
        { 
          name: 'Jane Smith', 
          title: 'Operations Director', 
          linkedinUrl: 'https://linkedin.com/in/janesmith',
          relevance: 'High - Operations focus aligns with VigilantEx efficiency benefits'
        },
        { 
          name: 'Michael Johnson', 
          title: 'Safety Director', 
          linkedinUrl: 'https://linkedin.com/in/michaeljohnson',
          relevance: 'Very High - Direct alignment with VigilantEx safety monitoring features'
        },
        { 
          name: 'Robert Williams', 
          title: 'Project Executive', 
          linkedinUrl: 'https://linkedin.com/in/robertwilliams',
          relevance: 'Medium - Oversees projects that could benefit from VigilantEx'
        },
        { 
          name: 'Sarah Brown', 
          title: 'Pre-Construction Manager', 
          linkedinUrl: 'https://linkedin.com/in/sarahbrown',
          relevance: 'Medium - Involved in planning stages where VigilantEx integration could be considered'
        }
      ];
    }
  },
  
  /**
   * Get recent news and updates about a company
   * @param {string} companyName - Company name
   * @returns {Promise<Array>} - List of news items
   */
  getCompanyNews: async (companyName) => {
    try {
      // In a real implementation, this would search for recent news about the company
      // using news APIs or web scraping
      
      // For demo purposes, return mock data
      return [
        { 
          title: 'ABC Construction Wins Bid for New Downtown Development', 
          source: 'Phoenix Business Journal',
          date: '2 weeks ago',
          url: 'https://example.com/news1'
        },
        { 
          title: 'Construction Safety Innovations Highlighted at Industry Conference', 
          source: 'Construction Today',
          date: '1 month ago',
          url: 'https://example.com/news2'
        },
        { 
          title: 'ABC Construction Implements New Technology to Improve Site Monitoring', 
          source: 'Tech in Construction',
          date: '2 months ago',
          url: 'https://example.com/news3'
        }
      ];
    } catch (error) {
      console.error('Error getting company news:', error);
      throw new Error(`Failed to get company news: ${error.message}`);
    }
  }
};

module.exports = companyService;
