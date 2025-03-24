// Rate limiting middleware for LinkedIn API requests
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Create a rate limiter for LinkedIn profile requests
const profileRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.'
  }
});

// Create a speed limiter to add delays between requests
const profileSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 10, // allow 10 requests per 15 minutes, then...
  delayMs: 500, // begin adding 500ms of delay per request
  maxDelayMs: 5000 // maximum delay is 5 seconds
});

// Authentication middleware
const authMiddleware = (req, res, next) => {
  // Get API key from request header
  const apiKey = req.headers['x-api-key'];
  
  // Check if API key is provided and valid
  // For demo purposes, we're using a simple check
  // In production, you would validate against a database of API keys
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized. Invalid or missing API key.'
    });
  }
  
  // If API key is valid, proceed to the next middleware
  next();
};

module.exports = {
  profileRateLimiter,
  profileSpeedLimiter,
  authMiddleware
};
