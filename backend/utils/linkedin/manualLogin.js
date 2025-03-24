/**
 * Manual LinkedIn login utility with session cookie management
 * This script allows you to manually log in to LinkedIn once and save the session cookies
 * for future automated use, avoiding the need to handle verification codes repeatedly.
 */
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const config = require('./linkedinConfig');

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Manual LinkedIn login process
 */
async function manualLogin() {
  console.log('\n=== LinkedIn Manual Login Utility ===');
  console.log('This utility will help you log in to LinkedIn manually and save your session cookies.');
  console.log('These cookies will be used for automated scraping to avoid verification challenges.\n');
  
  // Get LinkedIn credentials
  const email = await question('Enter your LinkedIn email: ');
  const password = await question('Enter your LinkedIn password: ');
  
  console.log('\nLaunching browser for manual login...');
  
  // Launch browser in non-headless mode
  const browser = await puppeteer.launch({
    headless: false,
    args: config.browser.launchArgs,
    defaultViewport: config.browser.viewport
  });
  
  try {
    // Open a new page
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport(config.browser.viewport);
    
    // Set user agent if specified
    if (config.browser.userAgent) {
      await page.setUserAgent(config.browser.userAgent);
    }
    
    console.log('Navigating to LinkedIn login page...');
    
    // Navigate to LinkedIn login page
    await page.goto('https://www.linkedin.com/login', {
      waitUntil: config.request.waitUntil,
      timeout: config.request.navigationTimeout
    });
    
    console.log('Filling in login credentials...');
    
    // Fill in the login form
    await page.type('#username', email);
    await page.type('#password', password);
    
    // Click the login button
    await Promise.all([
      page.waitForNavigation({ waitUntil: config.request.waitUntil }).catch(() => {}),
      page.click('.login__form_action_container button')
    ]);
    
    console.log('\n=== IMPORTANT INSTRUCTIONS ===');
    console.log('1. Complete any verification steps or CAPTCHA challenges in the browser window');
    console.log('2. Make sure you are fully logged in to LinkedIn');
    console.log('3. Once logged in, return to this terminal and press Enter to continue');
    console.log('=================================\n');
    
    await question('Press Enter when you have successfully logged in...');
    
    // Check if logged in
    const isLoggedIn = await page.evaluate(() => {
      return Boolean(
        document.querySelector('.feed-identity-module__actor-meta') ||
        document.querySelector('.profile-rail-card__actor-link') ||
        document.querySelector('.global-nav__me-photo') ||
        document.querySelector('.share-box-feed-entry__avatar') ||
        document.querySelector('[data-control-name="identity_welcome_message"]')
      );
    });
    
    if (isLoggedIn) {
      console.log('Successfully logged in to LinkedIn!');
      
      // Create directory for cookies if it doesn't exist
      const cookiesDir = path.dirname(config.auth.cookiesPath);
      await fs.mkdir(cookiesDir, { recursive: true }).catch(() => {});
      
      // Get all cookies
      const cookies = await page.cookies();
      
      // Save cookies to file
      await fs.writeFile(
        config.auth.cookiesPath,
        JSON.stringify(cookies, null, 2)
      );
      
      console.log(`Saved ${cookies.length} cookies to ${config.auth.cookiesPath}`);
      console.log('\nYou can now use these cookies for automated LinkedIn scraping.');
      console.log('The cookies will remain valid until LinkedIn logs you out or they expire.');
    } else {
      console.log('ERROR: Not logged in to LinkedIn. Please try again.');
    }
  } catch (error) {
    console.error(`Error during manual login: ${error.message}`);
  } finally {
    // Close the browser
    await browser.close();
    
    // Close readline interface
    rl.close();
  }
}

// Run the manual login process if this script is executed directly
if (require.main === module) {
  manualLogin().catch(console.error);
}

module.exports = { manualLogin };
