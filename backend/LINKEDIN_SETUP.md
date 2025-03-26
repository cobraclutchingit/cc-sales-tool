# LinkedIn Profile Scraping Setup Guide

This guide will help you set up the LinkedIn scraping functionality in the VigilantEx application.

## Prerequisites

- LinkedIn account with valid login credentials
- Properly configured `.env` file

## LinkedIn Credentials Setup

1. Create a dedicated LinkedIn account for scraping purposes:
   - Using your primary LinkedIn account might lead to account restrictions or blocks
   - A premium LinkedIn account may have better access to profile data

2. Add your LinkedIn credentials to the `.env` file:
   ```
   LINKEDIN_EMAIL=your_linkedin_email@example.com
   LINKEDIN_PASSWORD=your_secure_password
   ```

3. Configure additional LinkedIn settings in `.env`:
   ```
   # Set to false to see browser during scraping (useful for debugging)
   LINKEDIN_HEADLESS=false
   
   # Enable debug mode for more logging and screenshots
   LINKEDIN_DEBUG=true
   
   # Adjust timeout for network requests (in milliseconds)
   LINKEDIN_TIMEOUT=60000
   ```

## How LinkedIn Scraping Works

The application uses Puppeteer and StealthPlugin to interact with LinkedIn profiles:

1. Login Process:
   - First checks for saved cookies to avoid frequent logins
   - If cookies are invalid, logs in with provided credentials
   - Saves session cookies for future use

2. Profile Data Extraction:
   - Multiple selector strategies to handle LinkedIn's changing UI
   - Fallback mechanisms when scraping fails
   - Screenshot capture for debugging

3. Fallback Mechanisms:
   - URL pattern analysis to extract basic information
   - Pre-defined fallback data for known profiles
   - Graceful error handling

## Troubleshooting

If profile scraping is failing:

1. Check for valid cookies:
   - Delete the `linkedin_cookies.json` file to force a new login

2. Verify credentials:
   - Ensure your LinkedIn email and password are correct
   - Try logging in manually with the same credentials

3. Review debug information:
   - Check the `logs` directory for screenshots and HTML dumps
   - Look for specific error messages in the console

4. Adjust settings:
   - Set `LINKEDIN_HEADLESS=false` to see what's happening
   - Increase `LINKEDIN_TIMEOUT` for slow connections

5. LinkedIn Login Challenges:
   - If LinkedIn requires CAPTCHA or verification, manually log in once
   - LinkedIn sometimes blocks automated access, reduce scraping frequency

## Maintaining Scraping Reliability

LinkedIn frequently changes its UI and anti-scraping measures. To maintain reliability:

1. Keep selectors updated:
   - Regularly check and update the DOM selectors in `profileService.js`
   - Add new selector variations as LinkedIn changes their UI

2. Rotate user agents:
   - The code already implements user agent rotation
   - Consider adding more recent user agents periodically

3. Respect rate limits:
   - Avoid excessive scraping in short time periods
   - Implement delays between requests

4. Enhance fallback data:
   - For key profiles, add custom fallback data 
   - Consider using a database to store previously scraped profiles

## Example Usage

```javascript
const profileService = require('./services/profileService');

// Extract profile data
const profileData = await profileService.extractProfileData('https://www.linkedin.com/in/john-doe-123456/');

// Get company information from profile
const companyData = await profileService.getCompanyFromProfile(profileData);
```

## Testing

Run the profile extraction test to verify your setup:

```bash
node tests/profileTest.js
```

This will test the extraction for a specific profile and show detailed results.