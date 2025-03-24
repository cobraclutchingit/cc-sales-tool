const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

/**
 * LinkedIn CAPTCHA and verification detection and handling
 */
class LinkedInAuthHandler {
  /**
   * Initialize the auth handler
   * @param {Object} options - Configuration options
   * @param {boolean} options.headless - Whether to run browser in headless mode
   * @param {string} options.cookiesPath - Path to store cookies
   * @param {boolean} options.debug - Enable debug mode with screenshots
   * @param {string} options.screenshotsPath - Path to store debug screenshots
   */
  constructor(options = {}) {
    this.options = {
      headless: true,
      cookiesPath: path.join(process.cwd(), 'linkedin_cookies.json'),
      debug: false,
      screenshotsPath: path.join(process.cwd(), 'debug_screenshots'),
      ...options
    };
    
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
    this.captchaDetected = false;
    this.verificationRequired = false;
    this.lastError = null;
  }
  
  /**
   * Initialize browser and page
   */
  async initialize() {
    try {
      // Create screenshots directory if it doesn't exist and debug is enabled
      if (this.options.debug) {
        try {
          await fs.mkdir(this.options.screenshotsPath, { recursive: true });
        } catch (error) {
          console.warn(`Failed to create screenshots directory: ${error.message}`);
        }
      }
      
      // Launch browser with appropriate options
      this.browser = await puppeteer.launch({
        headless: this.options.headless ? 'new' : false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-infobars',
          '--window-position=0,0',
          '--ignore-certificate-errors',
          '--ignore-certificate-errors-spki-list',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-accelerated-2d-canvas',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ],
        ignoreHTTPSErrors: true
      });
      
      // Create a new page
      this.page = await this.browser.newPage();
      
      // Set a more realistic viewport size
      await this.page.setViewport({
        width: 1366,
        height: 768,
        deviceScaleFactor: 1
      });
      
      // Set extra headers to appear more like a real browser
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.google.com/'
      });
      
      // Enable request interception to block unnecessary resources
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        // Block images, fonts, stylesheets, and other non-essential resources to speed up scraping
        const resourceType = req.resourceType();
        if (
          resourceType === 'image' ||
          resourceType === 'font' ||
          resourceType === 'stylesheet' ||
          resourceType === 'media' ||
          resourceType === 'other' ||
          req.url().includes('ads') ||
          req.url().includes('analytics')
        ) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      // Try to load cookies if they exist
      try {
        const cookiesString = await fs.readFile(this.options.cookiesPath, 'utf8');
        const cookies = JSON.parse(cookiesString);
        if (cookies.length > 0) {
          await this.page.setCookie(...cookies);
          this.log('Loaded cookies from file');
        }
      } catch (error) {
        this.log('No saved cookies found or error loading cookies', 'warn');
      }
      
      return true;
    } catch (error) {
      this.lastError = error;
      this.log(`Failed to initialize browser: ${error.message}`, 'error');
      return false;
    }
  }
  
  /**
   * Take a screenshot for debugging
   * @param {string} name - Name of the screenshot
   */
  async takeScreenshot(name) {
    if (!this.options.debug || !this.page) return;
    
    try {
      const screenshotPath = path.join(this.options.screenshotsPath, `${name}_${Date.now()}.png`);
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      this.log(`Screenshot saved: ${screenshotPath}`);
    } catch (error) {
      this.log(`Failed to take screenshot: ${error.message}`, 'warn');
    }
  }
  
  /**
   * Log messages with different levels
   * @param {string} message - Message to log
   * @param {string} level - Log level (log, warn, error)
   */
  log(message, level = 'log') {
    const prefix = '[LinkedInAuthHandler]';
    switch (level) {
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
  
  /**
   * Detect CAPTCHA or verification screens
   * @returns {Object} Detection result with type and confidence
   */
  async detectChallenges() {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    
    try {
      // Take screenshot for analysis
      const screenshotBuffer = await this.page.screenshot({ encoding: 'binary' });
      
      // Check for verification code input field
      const verificationInputExists = await this.page.evaluate(() => {
        return Boolean(
          document.querySelector('input[name="verification-code"]') ||
          document.querySelector('input[name="pin"]') ||
          document.querySelector('input[id*="verification"]') ||
          document.querySelector('input[id*="code"]')
        );
      });
      
      // Check for CAPTCHA elements
      const captchaExists = await this.page.evaluate(() => {
        return Boolean(
          document.querySelector('iframe[src*="recaptcha"]') ||
          document.querySelector('iframe[src*="captcha"]') ||
          document.querySelector('div[class*="captcha"]') ||
          document.querySelector('img[src*="captcha"]')
        );
      });
      
      // Check for specific text patterns
      const pageText = await this.page.evaluate(() => document.body.innerText);
      const verificationTextPatterns = [
        'verification code',
        'verify your identity',
        'security check',
        'confirm your identity',
        'enter the pin',
        'enter the code',
        'sent you a code',
        'sent a code to your email'
      ];
      
      const captchaTextPatterns = [
        'captcha',
        'prove you\'re not a robot',
        'security challenge',
        'i\'m not a robot',
        'human verification'
      ];
      
      const hasVerificationText = verificationTextPatterns.some(pattern => 
        pageText.toLowerCase().includes(pattern.toLowerCase())
      );
      
      const hasCaptchaText = captchaTextPatterns.some(pattern => 
        pageText.toLowerCase().includes(pattern.toLowerCase())
      );
      
      // Determine challenge type
      let challengeType = null;
      let confidence = 0;
      
      if (verificationInputExists || hasVerificationText) {
        challengeType = 'verification';
        confidence = verificationInputExists ? 0.9 : 0.7;
        this.verificationRequired = true;
      } else if (captchaExists || hasCaptchaText) {
        challengeType = 'captcha';
        confidence = captchaExists ? 0.9 : 0.7;
        this.captchaDetected = true;
      }
      
      // Take a debug screenshot if a challenge is detected
      if (challengeType && this.options.debug) {
        await this.takeScreenshot(`${challengeType}_detected`);
      }
      
      return {
        detected: Boolean(challengeType),
        type: challengeType,
        confidence,
        needsUserAction: Boolean(challengeType)
      };
    } catch (error) {
      this.log(`Error detecting challenges: ${error.message}`, 'error');
      return {
        detected: false,
        type: null,
        confidence: 0,
        needsUserAction: false,
        error: error.message
      };
    }
  }
  
  /**
   * Handle CAPTCHA or verification challenges
   * @param {Object} challenge - Challenge detection result
   * @returns {Promise<boolean>} Whether the challenge was handled successfully
   */
  async handleChallenge(challenge) {
    if (!challenge.detected) return true;
    
    this.log(`Detected ${challenge.type} challenge (confidence: ${challenge.confidence})`, 'warn');
    
    // If not in headless mode, prompt user to solve manually
    if (!this.options.headless) {
      this.log('Please solve the challenge manually in the browser window', 'warn');
      
      // Wait for navigation or timeout after 2 minutes
      try {
        await Promise.race([
          this.page.waitForNavigation({ timeout: 120000 }),
          new Promise(resolve => setTimeout(resolve, 120000))
        ]);
        
        // Check if we're still on a challenge page
        const newChallenge = await this.detectChallenges();
        if (!newChallenge.detected) {
          this.log('Challenge appears to be solved successfully');
          return true;
        } else {
          this.log('Challenge still detected after timeout', 'error');
          return false;
        }
      } catch (error) {
        this.log(`Error waiting for challenge resolution: ${error.message}`, 'error');
        return false;
      }
    } else {
      // In headless mode, we can't solve the challenge automatically
      this.log('Challenge detected in headless mode. Consider using non-headless mode or implementing a CAPTCHA solving service.', 'error');
      return false;
    }
  }
  
  /**
   * Login to LinkedIn
   * @param {string} email - LinkedIn email
   * @param {string} password - LinkedIn password
   * @returns {Promise<boolean>} Whether login was successful
   */
  async login(email, password) {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    
    try {
      this.log('Attempting to login to LinkedIn');
      
      // Navigate to LinkedIn login page
      await this.page.goto('https://www.linkedin.com/login', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Take screenshot before login attempt
      await this.takeScreenshot('before_login');
      
      // Check if already logged in
      const isAlreadyLoggedIn = await this.checkIfLoggedIn();
      if (isAlreadyLoggedIn) {
        this.log('Already logged in to LinkedIn');
        this.isLoggedIn = true;
        return true;
      }
      
      // Fill in the login form
      await this.page.type('#username', email, { delay: 50 });
      await sleep(Math.floor(Math.random() * 500) + 200);
      await this.page.type('#password', password, { delay: 50 });
      
      // Add random delay before clicking
      await sleep(Math.floor(Math.random() * 1000) + 500);
      
      // Click the login button and wait for navigation
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}),
        this.page.click('.login__form_action_container button')
      ]);
      
      // Take screenshot after login attempt
      await this.takeScreenshot('after_login_attempt');
      
      // Check for challenges
      const challenge = await this.detectChallenges();
      if (challenge.detected) {
        const handled = await this.handleChallenge(challenge);
        if (!handled) {
          this.log(`Failed to handle ${challenge.type} challenge`, 'error');
          return false;
        }
      }
      
      // Verify login success
      const loginSuccess = await this.checkIfLoggedIn();
      if (loginSuccess) {
        this.log('Successfully logged in to LinkedIn');
        this.isLoggedIn = true;
        
        // Save cookies for future use
        await this.saveCookies();
        return true;
      } else {
        this.log('Login failed - not logged in after attempt', 'error');
        return false;
      }
    } catch (error) {
      this.lastError = error;
      this.log(`Login error: ${error.message}`, 'error');
      return false;
    }
  }
  
  /**
   * Check if currently logged in to LinkedIn
   * @returns {Promise<boolean>} Whether currently logged in
   */
  async checkIfLoggedIn() {
    try {
      return await this.page.evaluate(() => {
        return Boolean(
          document.querySelector('.feed-identity-module__actor-meta') ||
          document.querySelector('.profile-rail-card__actor-link') ||
          document.querySelector('.global-nav__me-photo') ||
          document.querySelector('.share-box-feed-entry__avatar') ||
          document.querySelector('[data-control-name="identity_welcome_message"]')
        );
      });
    } catch (error) {
      this.log(`Error checking login status: ${error.message}`, 'error');
      return false;
    }
  }
  
  /**
   * Save cookies to file for future use
   */
  async saveCookies() {
    try {
      const cookies = await this.page.cookies();
      await fs.writeFile(this.options.cookiesPath, JSON.stringify(cookies, null, 2));
      this.log(`Saved ${cookies.length} cookies to ${this.options.cookiesPath}`);
    } catch (error) {
      this.log(`Failed to save cookies: ${error.message}`, 'warn');
    }
  }
  
  /**
   * Load cookies from file
   * @returns {Promise<boolean>} Whether cookies were loaded successfully
   */
  async loadCookies() {
    try {
      const cookiesString = await fs.readFile(this.options.cookiesPath, 'utf8');
      const cookies = JSON.parse(cookiesString);
      if (cookies.length > 0) {
        await this.page.setCookie(...cookies);
        this.log(`Loaded ${cookies.length} cookies from file`);
        return true;
      }
      return false;
    } catch (error) {
      this.log(`Failed to load cookies: ${error.message}`, 'warn');
      return false;
    }
  }
  
  /**
   * Verify if cookies are valid by visiting LinkedIn
   * @returns {Promise<boolean>} Whether cookies are valid
   */
  async verifyCookies() {
    try {
      await this.page.goto('https://www.linkedin.com/feed/', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      await this.takeScreenshot('cookie_verification');
      
      const isLoggedIn = await this.checkIfLoggedIn();
      if (isLoggedIn) {
        this.log('Cookies are valid - logged in successfully');
        this.isLoggedIn = true;
        return true;
      } else {
        this.log('Cookies are invalid or expired', 'warn');
        return false;
      }
    } catch (error) {
      this.log(`Error verifying cookies: ${error.message}`, 'error');
      return false;
    }
  }
  
  /**
   * Close browser and clean up
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.log('Browser closed');
    }
  }
  
  /**
   * Get the current status of the auth handler
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      initialized: Boolean(this.browser && this.page),
      isLoggedIn: this.isLoggedIn,
      captchaDetected: this.captchaDetected,
      verificationRequired: this.verificationRequired,
      headless: this.options.headless,
      lastError: this.lastError ? this.lastError.message : null
    };
  }
}

module.exports = LinkedInAuthHandler;
