/**
 * Configuration options for LinkedIn scraping
 */
const config = {
  // LinkedIn authentication settings
  auth: {
    // Whether to run browser in headless mode (true) or visible mode (false)
    // Set to false when you need to manually solve CAPTCHA or verification challenges
    headless: false,
    
    // Path to store LinkedIn session cookies
    cookiesPath: './linkedin_cookies.json',
    
    // Enable debug mode with screenshots for troubleshooting
    debug: true,
    
    // Path to store debug screenshots
    screenshotsPath: './debug_screenshots',
    
    // Maximum time to wait for manual CAPTCHA/verification solving (in milliseconds)
    manualSolveTimeout: 120000
  },
  
  // Browser settings
  browser: {
    // Browser viewport settings
    viewport: {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1
    },
    
    // User agent to use (leave empty for default)
    userAgent: '',
    
    // Resources to block for faster loading (image, font, stylesheet, media, other)
    blockResources: ['image', 'font', 'stylesheet', 'media'],
    
    // Additional browser launch arguments
    launchArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certificate-errors',
      '--disable-gpu'
    ]
  },
  
  // Request settings
  request: {
    // Timeout for page navigation (in milliseconds)
    navigationTimeout: 60000,
    
    // Wait until condition for page navigation
    // Options: 'networkidle0', 'networkidle2', 'domcontentloaded', 'load'
    waitUntil: 'networkidle2',
    
    // Delay between actions to appear more human-like (in milliseconds)
    // Set to 0 to disable delays
    actionDelay: {
      min: 500,  // Minimum delay
      max: 2000  // Maximum delay (random value between min and max will be used)
    }
  },
  
  // Retry settings for failed operations
  retry: {
    // Maximum number of login attempts
    maxLoginAttempts: 3,
    
    // Delay between retry attempts (in milliseconds)
    retryDelay: 5000,
    
    // Whether to retry on CAPTCHA detection
    retryOnCaptcha: false
  },
  
  // LinkedIn profile scraping settings
  scraping: {
    // Maximum number of profiles to scrape in one session
    maxProfiles: 10,
    
    // Delay between profile scraping (in milliseconds)
    profileDelay: 3000
  }
};

module.exports = config;
