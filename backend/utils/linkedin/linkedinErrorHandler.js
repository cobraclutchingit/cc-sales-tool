/**
 * Enhanced LinkedIn error reporting and handling
 * This module provides detailed error reporting and recovery strategies for LinkedIn authentication issues
 */
const fs = require('fs').promises;
const path = require('path');

/**
 * LinkedIn specific error types
 */
class LinkedInError extends Error {
  constructor(message, type, details = {}) {
    super(message);
    this.name = 'LinkedInError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
  
  /**
   * Get user-friendly recovery instructions
   */
  getRecoveryInstructions() {
    switch (this.type) {
      case 'VERIFICATION_REQUIRED':
        return [
          'LinkedIn requires verification of your account.',
          '1. Run the manualLogin.js utility to log in manually',
          '2. Complete the verification process in the browser',
          '3. Once verified, the session cookies will be saved for future use'
        ].join('\n');
        
      case 'CAPTCHA_DETECTED':
        return [
          'LinkedIn CAPTCHA challenge detected.',
          '1. Set headless: false in linkedinConfig.js',
          '2. Run the script again and solve the CAPTCHA manually',
          '3. Once solved, the session cookies will be saved for future use'
        ].join('\n');
        
      case 'RATE_LIMITED':
        return [
          'LinkedIn has rate limited your requests.',
          '1. Wait at least 1 hour before trying again',
          '2. Consider reducing the number of requests in config.scraping.maxProfiles',
          '3. Use a different IP address or proxy if available'
        ].join('\n');
        
      case 'ACCOUNT_LOCKED':
        return [
          'Your LinkedIn account appears to be temporarily locked.',
          '1. Log in to LinkedIn manually in a regular browser',
          '2. Follow LinkedIn\'s instructions to unlock your account',
          '3. Once unlocked, run the manualLogin.js utility to refresh your session'
        ].join('\n');
        
      case 'INVALID_CREDENTIALS':
        return [
          'The LinkedIn credentials provided are invalid.',
          '1. Check your email and password in the .env file',
          '2. Make sure your account is active and not suspended',
          '3. Try logging in manually to verify your credentials'
        ].join('\n');
        
      case 'SESSION_EXPIRED':
        return [
          'Your LinkedIn session has expired.',
          '1. Run the manualLogin.js utility to create a new session',
          '2. Make sure to complete any verification steps in the browser',
          '3. The new session cookies will be saved for future use'
        ].join('\n');
        
      case 'NETWORK_ERROR':
        return [
          'A network error occurred while connecting to LinkedIn.',
          '1. Check your internet connection',
          '2. Verify that LinkedIn is accessible in your region',
          '3. Try again later if the issue persists'
        ].join('\n');
        
      default:
        return [
          'An unexpected error occurred with LinkedIn.',
          '1. Check the error details for more information',
          '2. Try running the manualLogin.js utility to refresh your session',
          '3. If the issue persists, check LinkedIn\'s status or try again later'
        ].join('\n');
    }
  }
}

/**
 * LinkedIn Error Logger
 */
class LinkedInErrorLogger {
  /**
   * Initialize the error logger
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      logDirectory: path.join(process.cwd(), 'logs'),
      errorLogFile: 'linkedin_errors.log',
      maxLogSize: 5 * 1024 * 1024, // 5MB
      maxLogFiles: 5,
      ...options
    };
    
    this.errorCount = 0;
    this.errorsByType = {};
  }
  
  /**
   * Log an error
   * @param {Error|LinkedInError} error - Error to log
   * @param {Object} context - Additional context information
   */
  async logError(error, context = {}) {
    try {
      // Create log directory if it doesn't exist
      await fs.mkdir(this.options.logDirectory, { recursive: true }).catch(() => {});
      
      // Increment error count
      this.errorCount++;
      
      // Track errors by type
      const errorType = error.type || 'UNKNOWN';
      this.errorsByType[errorType] = (this.errorsByType[errorType] || 0) + 1;
      
      // Format error for logging
      const logEntry = {
        timestamp: new Date().toISOString(),
        errorType,
        message: error.message,
        stack: error.stack,
        details: error.details || {},
        context
      };
      
      // Append to log file
      const logPath = path.join(this.options.logDirectory, this.options.errorLogFile);
      await fs.appendFile(
        logPath,
        JSON.stringify(logEntry) + '\n',
        'utf8'
      );
      
      // Check log file size and rotate if necessary
      await this.checkAndRotateLogs();
      
      // Log to console as well
      console.error(`[LinkedInError] ${errorType}: ${error.message}`);
      
      return true;
    } catch (loggingError) {
      console.error(`Failed to log error: ${loggingError.message}`);
      console.error('Original error:', error);
      return false;
    }
  }
  
  /**
   * Check log file size and rotate if necessary
   */
  async checkAndRotateLogs() {
    try {
      const logPath = path.join(this.options.logDirectory, this.options.errorLogFile);
      
      // Check if log file exists
      const stats = await fs.stat(logPath).catch(() => null);
      if (!stats) return;
      
      // Check if log file exceeds max size
      if (stats.size < this.options.maxLogSize) return;
      
      // Rotate logs
      for (let i = this.options.maxLogFiles - 1; i > 0; i--) {
        const oldPath = path.join(
          this.options.logDirectory,
          `${this.options.errorLogFile}.${i}`
        );
        const newPath = path.join(
          this.options.logDirectory,
          `${this.options.errorLogFile}.${i + 1}`
        );
        
        // Move existing rotated logs
        await fs.rename(oldPath, newPath).catch(() => {});
      }
      
      // Move current log to .1
      const rotatedPath = path.join(
        this.options.logDirectory,
        `${this.options.errorLogFile}.1`
      );
      await fs.rename(logPath, rotatedPath).catch(() => {});
      
      // Create new empty log file
      await fs.writeFile(logPath, '', 'utf8');
    } catch (error) {
      console.error(`Failed to rotate logs: ${error.message}`);
    }
  }
  
  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    return {
      totalErrors: this.errorCount,
      errorsByType: this.errorsByType,
      lastChecked: new Date().toISOString()
    };
  }
  
  /**
   * Analyze errors to detect patterns
   * @returns {Object} Error analysis
   */
  analyzeErrors() {
    const analysis = {
      mostCommonError: null,
      mostCommonCount: 0,
      recommendedAction: null,
      errorTrend: 'stable'
    };
    
    // Find most common error type
    for (const [type, count] of Object.entries(this.errorsByType)) {
      if (count > analysis.mostCommonCount) {
        analysis.mostCommonCount = count;
        analysis.mostCommonError = type;
      }
    }
    
    // Generate recommended action based on most common error
    if (analysis.mostCommonError) {
      const dummyError = new LinkedInError(
        'Dummy error for recovery instructions',
        analysis.mostCommonError
      );
      analysis.recommendedAction = dummyError.getRecoveryInstructions();
    }
    
    return analysis;
  }
}

/**
 * Detect LinkedIn error type from error message or page content
 * @param {string} content - Error message or page content
 * @returns {string} Error type
 */
function detectErrorType(content) {
  const lowerContent = content.toLowerCase();
  
  // Verification patterns
  if (
    lowerContent.includes('verification') ||
    lowerContent.includes('verify your identity') ||
    lowerContent.includes('security check') ||
    lowerContent.includes('confirm your identity') ||
    lowerContent.includes('enter the pin') ||
    lowerContent.includes('enter the code') ||
    lowerContent.includes('sent you a code') ||
    lowerContent.includes('sent a code to your email')
  ) {
    return 'VERIFICATION_REQUIRED';
  }
  
  // CAPTCHA patterns
  if (
    lowerContent.includes('captcha') ||
    lowerContent.includes('prove you\'re not a robot') ||
    lowerContent.includes('security challenge') ||
    lowerContent.includes('i\'m not a robot') ||
    lowerContent.includes('human verification')
  ) {
    return 'CAPTCHA_DETECTED';
  }
  
  // Rate limiting patterns
  if (
    lowerContent.includes('rate limit') ||
    lowerContent.includes('too many requests') ||
    lowerContent.includes('try again later') ||
    lowerContent.includes('temporarily restricted')
  ) {
    return 'RATE_LIMITED';
  }
  
  // Account locked patterns
  if (
    lowerContent.includes('account locked') ||
    lowerContent.includes('account restricted') ||
    lowerContent.includes('suspicious activity') ||
    lowerContent.includes('unusual activity')
  ) {
    return 'ACCOUNT_LOCKED';
  }
  
  // Invalid credentials patterns
  if (
    lowerContent.includes('incorrect email') ||
    lowerContent.includes('incorrect password') ||
    lowerContent.includes('invalid username') ||
    lowerContent.includes('invalid password') ||
    lowerContent.includes('doesn\'t match')
  ) {
    return 'INVALID_CREDENTIALS';
  }
  
  // Session expired patterns
  if (
    lowerContent.includes('session expired') ||
    lowerContent.includes('please sign in again') ||
    lowerContent.includes('signed out') ||
    lowerContent.includes('login again')
  ) {
    return 'SESSION_EXPIRED';
  }
  
  // Network error patterns
  if (
    lowerContent.includes('network error') ||
    lowerContent.includes('connection failed') ||
    lowerContent.includes('cannot reach') ||
    lowerContent.includes('timeout')
  ) {
    return 'NETWORK_ERROR';
  }
  
  // Default to unknown
  return 'UNKNOWN';
}

module.exports = {
  LinkedInError,
  LinkedInErrorLogger,
  detectErrorType
};
