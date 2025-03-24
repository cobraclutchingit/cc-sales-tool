/**
 * Test script for LinkedIn authentication with enhanced features
 * This script tests the improved LinkedIn login functionality with:
 * - CAPTCHA detection and handling
 * - Headless browser toggle
 * - Manual login with session cookies
 * - Enhanced error reporting
 */
const LinkedInAuthHandler = require('./LinkedInAuthHandler');
const { LinkedInError, LinkedInErrorLogger } = require('./linkedinErrorHandler');
const config = require('./linkedinConfig');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Create error logger
const errorLogger = new LinkedInErrorLogger({
  logDirectory: path.join(process.cwd(), 'logs')
});

/**
 * Test LinkedIn authentication
 */
async function testLinkedInAuth() {
  console.log('=== LinkedIn Authentication Test ===');
  
  // Check for LinkedIn credentials
  const email = process.env.LINKEDIN_EMAIL;
  const password = process.env.LINKEDIN_PASSWORD;
  
  if (!email || !password) {
    console.error('ERROR: LinkedIn credentials not found in environment variables.');
    console.error('Please set LINKEDIN_EMAIL and LINKEDIN_PASSWORD in your .env file.');
    return;
  }
  
  console.log(`Using LinkedIn account: ${email}`);
  console.log(`Headless mode: ${config.auth.headless ? 'Enabled' : 'Disabled'}`);
  
  // Create auth handler
  const authHandler = new LinkedInAuthHandler({
    headless: config.auth.headless,
    cookiesPath: config.auth.cookiesPath,
    debug: config.auth.debug,
    screenshotsPath: config.auth.screenshotsPath
  });
  
  try {
    // Initialize browser
    console.log('Initializing browser...');
    await authHandler.initialize();
    
    // Check for existing cookies
    console.log('Checking for existing session cookies...');
    const cookiesExist = await fs.access(config.auth.cookiesPath)
      .then(() => true)
      .catch(() => false);
    
    if (cookiesExist) {
      console.log('Found existing cookies, verifying...');
      const cookiesValid = await authHandler.verifyCookies();
      
      if (cookiesValid) {
        console.log('✅ Session cookies are valid, already logged in!');
      } else {
        console.log('❌ Session cookies are invalid or expired.');
        console.log('Attempting to login with credentials...');
        await performLogin(authHandler, email, password);
      }
    } else {
      console.log('No existing cookies found.');
      console.log('Attempting to login with credentials...');
      await performLogin(authHandler, email, password);
    }
    
    // Test profile access
    if (authHandler.isLoggedIn) {
      console.log('\nTesting profile access...');
      await testProfileAccess(authHandler);
    }
    
    // Get final status
    const status = authHandler.getStatus();
    console.log('\nFinal status:', status);
    
    if (status.captchaDetected) {
      console.log('\n⚠️ CAPTCHA was detected during the process.');
      console.log('Consider using the manualLogin.js utility to log in manually and save cookies.');
    }
    
    if (status.verificationRequired) {
      console.log('\n⚠️ Verification was required during the process.');
      console.log('Use the manualLogin.js utility to complete verification and save cookies.');
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
    
    // Log the error
    await errorLogger.logError(error, {
      test: 'linkedin_auth_test',
      timestamp: new Date().toISOString()
    });
    
    // Show recovery instructions if it's a LinkedIn error
    if (error instanceof LinkedInError) {
      console.log('\nRecovery instructions:');
      console.log(error.getRecoveryInstructions());
    }
  } finally {
    // Close the browser
    await authHandler.close();
  }
}

/**
 * Perform login with credentials
 * @param {LinkedInAuthHandler} authHandler - Auth handler instance
 * @param {string} email - LinkedIn email
 * @param {string} password - LinkedIn password
 */
async function performLogin(authHandler, email, password) {
  const loginSuccess = await authHandler.login(email, password);
  
  if (loginSuccess) {
    console.log('✅ Successfully logged in to LinkedIn!');
  } else {
    console.log('❌ Failed to log in to LinkedIn.');
    
    const status = authHandler.getStatus();
    if (status.captchaDetected) {
      console.log('CAPTCHA was detected during login.');
      throw new LinkedInError(
        'CAPTCHA detected during login',
        'CAPTCHA_DETECTED',
        { url: 'https://www.linkedin.com/login' }
      );
    }
    
    if (status.verificationRequired) {
      console.log('Verification was required during login.');
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
}

/**
 * Test accessing a LinkedIn profile
 * @param {LinkedInAuthHandler} authHandler - Auth handler instance
 */
async function testProfileAccess(authHandler) {
  try {
    // Navigate to Bill Gates' profile
    await authHandler.page.goto('https://www.linkedin.com/in/williamhgates/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Take screenshot if debug is enabled
    await authHandler.takeScreenshot('profile_access_test');
    
    // Check if profile loaded successfully
    const profileName = await authHandler.page.evaluate(() => {
      const nameElement = document.querySelector('.text-heading-xlarge');
      return nameElement ? nameElement.textContent.trim() : null;
    });
    
    if (profileName) {
      console.log(`✅ Successfully accessed profile: ${profileName}`);
    } else {
      console.log('❌ Failed to access profile or extract name.');
      
      // Check for challenges
      const challenge = await authHandler.detectChallenges();
      if (challenge.detected) {
        console.log(`${challenge.type} detected while accessing profile.`);
        throw new LinkedInError(
          `${challenge.type} detected while accessing profile`,
          challenge.type === 'captcha' ? 'CAPTCHA_DETECTED' : 'VERIFICATION_REQUIRED',
          { url: 'https://www.linkedin.com/in/williamhgates/' }
        );
      }
    }
  } catch (error) {
    console.error('Error accessing profile:', error.message);
    throw error;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testLinkedInAuth().catch(console.error);
}

module.exports = { testLinkedInAuth };
