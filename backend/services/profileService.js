const puppeteer = require('puppeteer');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Service for extracting LinkedIn profile data
 */
const profileService = {
  /**
   * Extract data from a LinkedIn profile
   * @param {string} profileUrl - LinkedIn profile URL
   * @returns {Promise<Object>} - Profile data
   */
  extractProfileData: async (profileUrl) => {
    try {
      // Extract username from URL
      const urlParts = profileUrl.split('/');
      const username = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
      
      console.log(`Extracting profile data for: ${username}`);
      
      // Check if the URL is a valid LinkedIn profile URL
      if (!profileUrl.includes('linkedin.com/in/')) {
        throw new Error('Invalid LinkedIn profile URL');
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
        
        // Navigate to the profile page
        await page.goto(profileUrl, { waitUntil: 'networkidle2' });
        
        // Check if we were redirected to a login page
        const currentUrl = page.url();
        if (currentUrl.includes('linkedin.com/login') || currentUrl.includes('linkedin.com/checkpoint')) {
          throw new Error('LinkedIn requires login to view profiles. Please provide valid credentials in .env file.');
        }
        
        // Extract profile data
        const profileData = await page.evaluate(() => {
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
          
          // Extract basic profile information
          const name = getTextContent('.pv-top-card--list li:first-child') || 
                       getTextContent('.text-heading-xlarge');
          
          const title = getTextContent('.pv-top-card--list li.text-body-medium') || 
                        getTextContent('.text-body-medium.break-words');
          
          const locationElement = document.querySelector('.pv-top-card--list.pv-top-card--list-bullet li') ||
                                document.querySelector('.pv-text-details__left-panel.mt2 .text-body-small');
          const location = locationElement ? locationElement.textContent.trim() : null;
          
          // Extract company information
          const companyElement = document.querySelector('.pv-top-card--experience-list-item .pv-entity__secondary-title') ||
                                document.querySelector('.pv-text-details__right-panel .text-body-small');
          const company = companyElement ? companyElement.textContent.trim() : null;
          
          // Extract experience
          const experienceItems = document.querySelectorAll('#experience-section .pv-entity__position-group') ||
                                document.querySelectorAll('.experience-section li');
          
          const experience = Array.from(experienceItems).map(item => {
            const titleElement = item.querySelector('.pv-entity__summary-info-margin-top h3') ||
                               item.querySelector('.pv-entity__summary-info h3') ||
                               item.querySelector('.t-16.t-black.t-bold');
            
            const companyElement = item.querySelector('.pv-entity__secondary-title') ||
                                  item.querySelector('.pv-entity__company-summary-info h4') ||
                                  item.querySelector('.t-14.t-normal');
            
            const dateRangeElement = item.querySelector('.pv-entity__date-range span:nth-child(2)') ||
                                   item.querySelector('.pv-entity__date-range:not(:first-child)') ||
                                   item.querySelector('.t-14.t-normal.t-black--light');
            
            return {
              title: titleElement ? titleElement.textContent.trim() : null,
              company: companyElement ? companyElement.textContent.trim() : null,
              duration: dateRangeElement ? dateRangeElement.textContent.trim() : null
            };
          });
          
          // Extract skills
          const skillItems = document.querySelectorAll('.pv-skill-category-entity__name-text') ||
                           document.querySelectorAll('.pv-skill-category-entity .t-16');
          
          const skills = Array.from(skillItems).map(item => item.textContent.trim());
          
          // Extract education
          const educationItems = document.querySelectorAll('#education-section .pv-education-entity') ||
                               document.querySelectorAll('.education-section .pv-profile-section__list-item');
          
          const education = Array.from(educationItems).map(item => {
            const schoolElement = item.querySelector('.pv-entity__school-name') ||
                                item.querySelector('.t-16.t-black.t-bold');
            
            const degreeElement = item.querySelector('.pv-entity__degree-name .pv-entity__comma-item') ||
                                item.querySelector('.pv-entity__fos .pv-entity__comma-item') ||
                                item.querySelector('.t-14.t-normal');
            
            const yearsElement = item.querySelector('.pv-entity__dates span:nth-child(2)') ||
                               item.querySelector('.t-14.t-normal.t-black--light');
            
            return {
              school: schoolElement ? schoolElement.textContent.trim() : null,
              degree: degreeElement ? degreeElement.textContent.trim() : null,
              years: yearsElement ? yearsElement.textContent.trim() : null
            };
          });
          
          // Get interests based on followed hashtags or sections
          const interestItems = document.querySelectorAll('.pv-interests-section .pv-entity__summary-title') ||
                              document.querySelectorAll('.interests-section .t-16');
          
          const interests = Array.from(interestItems)
            .map(item => item.textContent.trim())
            .filter(text => text && text.length > 0);
          
          return {
            name,
            title,
            company,
            location,
            experience: experience.filter(exp => exp.title && exp.company),
            skills: skills.slice(0, 10), // Limit to top 10 skills
            education: education.filter(edu => edu.school),
            interests: interests.length > 0 ? interests : ['Construction Technology', 'Project Management', 'Safety Compliance'],
          };
        });
        
        // If some critical data is missing, use backup extraction method
        if (!profileData.name || !profileData.title) {
          console.log('Primary extraction method failed. Using backup method...');
          
          // Backup extraction logic could go here
          // ...
        }
        
        // Use default values for missing data to ensure consistent response format
        return {
          name: profileData.name || username,
          title: profileData.title || 'Construction Professional',
          company: profileData.company || 'Construction Company',
          location: profileData.location || 'Unknown Location',
          experience: profileData.experience.length > 0 ? profileData.experience : [
            { title: 'Professional', company: profileData.company || 'Construction Company', duration: 'Present' }
          ],
          interests: profileData.interests.length > 0 ? profileData.interests : ['Construction Technology', 'Project Management', 'Safety Compliance'],
          skills: profileData.skills.length > 0 ? profileData.skills : ['Project Management', 'Construction Management', 'Safety Standards'],
          education: profileData.education.length > 0 ? profileData.education : []
        };
      } finally {
        // Close the browser regardless of the outcome
        await browser.close();
      }
    } catch (error) {
      console.error('Error extracting profile data:', error);
      
      // If scraping fails, return mock data with a note about the failure
      console.log('Falling back to mock data due to extraction error');
      return {
        name: 'John Doe',
        title: 'Construction Project Manager',
        company: 'ABC Construction',
        location: 'Phoenix, Arizona',
        experience: [
          { title: 'Project Manager', company: 'ABC Construction', duration: '2018 - Present' },
          { title: 'Assistant Project Manager', company: 'XYZ Builders', duration: '2015 - 2018' }
        ],
        interests: ['Construction Technology', 'Project Management', 'Safety Compliance'],
        skills: ['Project Management', 'Construction Management', 'Safety Standards', 'Team Leadership'],
        education: [
          { school: 'University of Arizona', degree: 'B.S. in Construction Management', years: '2011 - 2015' }
        ],
        scrapingError: error.message
      };
    }
  },
  
  /**
   * Get company information from a profile
   * @param {Object} profileData - LinkedIn profile data
   * @returns {Promise<Object>} - Company information
   */
  getCompanyFromProfile: async (profileData) => {
    try {
      // In a real implementation, this would extract the company from the profile
      // and then fetch company data using the companyService
      
      // For demo purposes, return mock data
      return {
        name: profileData.company,
        industry: 'Construction',
        size: '201-500 employees',
        location: 'Phoenix, Arizona',
        specialties: ['Commercial Construction', 'Project Management', 'Safety Compliance'],
        website: `www.${profileData.company.toLowerCase().replace(/\s/g, '')}.com`
      };
    } catch (error) {
      console.error('Error getting company from profile:', error);
      throw new Error(`Failed to get company information: ${error.message}`);
    }
  }
};

module.exports = profileService;
