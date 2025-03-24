/**
 * Enhanced LinkedIn profile scraper with improved authentication
 * Incorporates insights from joeyism/linkedin_scraper and cullenwatson/StaffSpy
 */
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');
const { LinkedInAuthHandler } = require('./LinkedInAuthHandler');
const { LinkedInError, LinkedInErrorLogger } = require('./linkedinErrorHandler');
const config = require('./linkedinConfig');

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

/**
 * LinkedIn Profile Scraper with enhanced authentication
 */
class LinkedInProfileScraper {
  /**
   * Initialize the profile scraper
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      headless: config.auth.headless,
      cookiesPath: config.auth.cookiesPath,
      debug: config.auth.debug,
      screenshotsPath: config.auth.screenshotsPath,
      ...options
    };
    
    this.authHandler = new LinkedInAuthHandler(this.options);
    this.errorLogger = new LinkedInErrorLogger({
      logDirectory: path.join(process.cwd(), 'logs')
    });
    
    this.isInitialized = false;
  }
  
  /**
   * Initialize the scraper
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Initialize auth handler
      await this.authHandler.initialize();
      
      // Check for existing cookies
      const cookiesExist = await fs.access(this.options.cookiesPath)
        .then(() => true)
        .catch(() => false);
      
      if (cookiesExist) {
        console.log('Found existing cookies, verifying...');
        const cookiesValid = await this.authHandler.verifyCookies();
        
        if (cookiesValid) {
          console.log('✅ Session cookies are valid, already logged in!');
          this.isInitialized = true;
          return true;
        } else {
          console.log('❌ Session cookies are invalid or expired.');
          return false;
        }
      } else {
        console.log('No existing cookies found.');
        return false;
      }
    } catch (error) {
      await this.errorLogger.logError(error, {
        operation: 'initialize',
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }
  
  /**
   * Login to LinkedIn
   * @param {string} email - LinkedIn email
   * @param {string} password - LinkedIn password
   */
  async login(email, password) {
    try {
      if (!this.authHandler) {
        throw new Error('Auth handler not initialized');
      }
      
      const loginSuccess = await this.authHandler.login(email, password);
      
      if (loginSuccess) {
        console.log('✅ Successfully logged in to LinkedIn!');
        this.isInitialized = true;
        return true;
      } else {
        console.log('❌ Failed to log in to LinkedIn.');
        
        const status = this.authHandler.getStatus();
        if (status.captchaDetected) {
          throw new LinkedInError(
            'CAPTCHA detected during login',
            'CAPTCHA_DETECTED',
            { url: 'https://www.linkedin.com/login' }
          );
        }
        
        if (status.verificationRequired) {
          throw new LinkedInError(
            'Verification required during login',
            'VERIFICATION_REQUIRED',
            { url: 'https://www.linkedin.com/login' }
          );
        }
        
        throw new LinkedInError(
          'Failed to log in to LinkedIn',
          'LOGIN_FAILED',
          { lastError: status.lastError }
        );
      }
    } catch (error) {
      await this.errorLogger.logError(error, {
        operation: 'login',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
  
  /**
   * Scrape a LinkedIn profile
   * @param {string} profileUrl - LinkedIn profile URL or username
   * @returns {Promise<Object>} Profile data
   */
  async scrapeProfile(profileUrl) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      if (!this.authHandler.isLoggedIn) {
        throw new LinkedInError(
          'Not logged in to LinkedIn',
          'NOT_LOGGED_IN',
          { operation: 'scrapeProfile' }
        );
      }
      
      // Normalize profile URL
      const normalizedUrl = this.normalizeProfileUrl(profileUrl);
      console.log(`Scraping profile: ${normalizedUrl}`);
      
      // Navigate to profile
      await this.authHandler.page.goto(normalizedUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Take screenshot if debug is enabled
      await this.authHandler.takeScreenshot('profile_scraping');
      
      // Check for challenges
      const challenge = await this.authHandler.detectChallenges();
      if (challenge.detected) {
        console.log(`${challenge.type} detected while scraping profile.`);
        const handled = await this.authHandler.handleChallenge(challenge);
        if (!handled) {
          throw new LinkedInError(
            `${challenge.type} detected while scraping profile`,
            challenge.type === 'captcha' ? 'CAPTCHA_DETECTED' : 'VERIFICATION_REQUIRED',
            { url: normalizedUrl }
          );
        }
      }
      
      // Extract profile data
      const profileData = await this.extractProfileData();
      
      return profileData;
    } catch (error) {
      await this.errorLogger.logError(error, {
        operation: 'scrapeProfile',
        profileUrl,
        timestamp: new Date().toISOString()
      });
      
      // Return mock data if scraping fails
      console.log('Falling back to mock data due to error:', error.message);
      return this.getMockProfileData(profileUrl);
    }
  }
  
  /**
   * Extract profile data from the current page
   * @returns {Promise<Object>} Profile data
   */
  async extractProfileData() {
    try {
      // First try to extract data from JSON-LD
      const jsonLdData = await this.extractJsonLdData();
      if (jsonLdData) {
        return jsonLdData;
      }
      
      // Fall back to HTML extraction
      return await this.extractProfileFromHtml();
    } catch (error) {
      console.error('Error extracting profile data:', error.message);
      throw error;
    }
  }
  
  /**
   * Extract profile data from JSON-LD script tags
   * @returns {Promise<Object|null>} Profile data or null if not found
   */
  async extractJsonLdData() {
    try {
      const jsonLd = await this.authHandler.page.evaluate(() => {
        const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
        return jsonLdScript ? jsonLdScript.textContent : null;
      });
      
      if (!jsonLd) return null;
      
      const data = JSON.parse(jsonLd);
      
      // Transform JSON-LD data to our format
      return {
        profileId: this.getProfileIdFromUrl(data.url),
        name: data.name,
        headline: data.description || data.jobTitle || '',
        location: data.address ? data.address.addressLocality : '',
        connections: null, // Not available in JSON-LD
        about: data.description || '',
        experiences: data.worksFor ? [
          {
            title: data.jobTitle || '',
            company: data.worksFor.name || '',
            location: data.address ? data.address.addressLocality : '',
            dateRange: '',
            description: ''
          }
        ] : [],
        education: data.alumniOf ? [
          {
            school: typeof data.alumniOf === 'string' ? data.alumniOf : data.alumniOf.name || '',
            degree: '',
            field: '',
            dateRange: ''
          }
        ] : [],
        skills: [],
        source: 'json-ld'
      };
    } catch (error) {
      console.warn('Error extracting JSON-LD data:', error.message);
      return null;
    }
  }
  
  /**
   * Extract profile data from HTML
   * @returns {Promise<Object>} Profile data
   */
  async extractProfileFromHtml() {
    try {
      // Extract basic profile information
      const profileData = await this.authHandler.page.evaluate(() => {
        // Helper function to safely extract text
        const getText = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : '';
        };
        
        // Helper function to safely extract multiple elements
        const getMultipleElements = (selector, transform = (el) => el.textContent.trim()) => {
          const elements = Array.from(document.querySelectorAll(selector));
          return elements.map(transform).filter(Boolean);
        };
        
        // Extract name (try multiple selectors)
        const name = 
          getText('.text-heading-xlarge') || 
          getText('.pv-top-card-section__name') ||
          getText('.pv-top-card--list li:first-child');
        
        // Extract headline
        const headline = 
          getText('.text-body-medium.break-words') || 
          getText('.pv-top-card-section__headline') ||
          getText('.ph5.pb5 .mt2');
        
        // Extract location
        const location = 
          getText('.text-body-small.inline.t-black--light.break-words') || 
          getText('.pv-top-card-section__location') ||
          getText('.pv-top-card--list.pv-top-card--list-bullet.mt1 li');
        
        // Extract connections
        const connectionsText = 
          getText('.pv-top-card--list.pv-top-card--list-bullet.mt1 li:first-child') ||
          getText('.pv-top-card-v2-section__connections');
        
        const connectionsMatch = connectionsText.match(/(\d+)/);
        const connections = connectionsMatch ? parseInt(connectionsMatch[1], 10) : null;
        
        // Extract about section
        const about = 
          getText('#about ~ .display-flex .pv-shared-text-with-see-more .visually-hidden') ||
          getText('.pv-about__summary-text .lt-line-clamp__raw-line') ||
          getText('.pv-about-section .pv-about__summary-text');
        
        // Extract experiences
        const experienceElements = document.querySelectorAll('#experience ~ .pvs-list__outer-container .pvs-entity, .experience-section .pv-entity');
        const experiences = Array.from(experienceElements).map(el => {
          const title = 
            getText('.t-bold span', el) || 
            getText('.pv-entity__summary-info h3', el) ||
            getText('.pv-entity__summary-info-margin-top h3', el);
          
          const company = 
            getText('.t-14.t-normal span', el) || 
            getText('.pv-entity__secondary-title', el);
          
          const dateRange = 
            getText('.t-14.t-normal.t-black--light span', el) || 
            getText('.pv-entity__date-range span:nth-child(2)', el);
          
          const location = 
            getText('.pv-entity__location span:nth-child(2)', el);
          
          const description = 
            getText('.pv-entity__description', el);
          
          return {
            title,
            company,
            location,
            dateRange,
            description
          };
        });
        
        // Extract education
        const educationElements = document.querySelectorAll('#education ~ .pvs-list__outer-container .pvs-entity, .education-section .pv-entity');
        const education = Array.from(educationElements).map(el => {
          const school = 
            getText('.t-bold span', el) || 
            getText('.pv-entity__school-name', el);
          
          const degree = 
            getText('.t-14.t-normal span', el) || 
            getText('.pv-entity__degree-name .pv-entity__comma-item', el);
          
          const field = 
            getText('.pv-entity__fos .pv-entity__comma-item', el);
          
          const dateRange = 
            getText('.t-14.t-normal.t-black--light span', el) || 
            getText('.pv-entity__dates span:nth-child(2)', el);
          
          return {
            school,
            degree,
            field,
            dateRange
          };
        });
        
        // Extract skills
        const skillElements = document.querySelectorAll('.pv-skill-categories-section__top-skills .pv-skill-category-entity__name-text, .pv-skill-category-list__skills-container .pv-skill-category-entity .pv-skill-category-entity__name-text');
        const skills = Array.from(skillElements).map(el => el.textContent.trim());
        
        return {
          name,
          headline,
          location,
          connections,
          about,
          experiences,
          education,
          skills,
          source: 'html'
        };
      });
      
      // Extract profile ID from URL
      const url = this.authHandler.page.url();
      profileData.profileId = this.getProfileIdFromUrl(url);
      profileData.profileUrl = url;
      
      return profileData;
    } catch (error) {
      console.error('Error extracting profile from HTML:', error.message);
      throw error;
    }
  }
  
  /**
   * Normalize profile URL
   * @param {string} profileUrl - LinkedIn profile URL or username
   * @returns {string} Normalized profile URL
   */
  normalizeProfileUrl(profileUrl) {
    if (profileUrl.startsWith('http')) {
      return profileUrl;
    }
    
    // Handle username format
    if (!profileUrl.includes('linkedin.com')) {
      return `https://www.linkedin.com/in/${profileUrl}/`;
    }
    
    return profileUrl;
  }
  
  /**
   * Extract profile ID from URL
   * @param {string} url - LinkedIn profile URL
   * @returns {string} Profile ID
   */
  getProfileIdFromUrl(url) {
    try {
      const match = url.match(/linkedin\.com\/in\/([^\/]+)/);
      return match ? match[1] : '';
    } catch (error) {
      return '';
    }
  }
  
  /**
   * Get mock profile data when scraping fails
   * @param {string} profileUrl - LinkedIn profile URL or username
   * @returns {Object} Mock profile data
   */
  getMockProfileData(profileUrl) {
    const profileId = this.getProfileIdFromUrl(this.normalizeProfileUrl(profileUrl));
    
    return {
      profileId,
      name: 'Sample User',
      headline: 'Professional at Sample Company',
      location: 'San Francisco Bay Area',
      connections: 500,
      about: 'This is mock data generated when profile scraping failed.',
      experiences: [
        {
          title: 'Software Engineer',
          company: 'Sample Company',
          location: 'San Francisco, CA',
          dateRange: '2020 - Present',
          description: 'Working on innovative projects.'
        },
        {
          title: 'Junior Developer',
          company: 'Previous Company',
          location: 'San Francisco, CA',
          dateRange: '2018 - 2020',
          description: 'Developed web applications.'
        }
      ],
      education: [
        {
          school: 'Sample University',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          dateRange: '2014 - 2018'
        }
      ],
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      source: 'mock',
      profileUrl: this.normalizeProfileUrl(profileUrl)
    };
  }
  
  /**
   * Close the scraper and clean up
   */
  async close() {
    if (this.authHandler) {
      await this.authHandler.close();
    }
  }
}

module.exports = LinkedInProfileScraper;
