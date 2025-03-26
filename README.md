# Sales Automation App - Installation and Usage Guide

This guide will help you set up and run the VigilantEx Sales Automation App on your MacBook Pro M1.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- MacBook Pro with M1 chip
- LinkedIn account (optional, but required for full functionality)

## Installation

1. Unzip the application package:
   ```
   unzip vigilantex_sales_app.zip -d vigilantex_sales_app
   cd vigilantex_sales_app
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

4. Configure credentials:
   ```
   cd backend
   cp .env.example .env
   ```
   
   You can run the setup script to configure your LLM API keys:
   ```
   ./setup-llm.sh
   ```
   
   Or using npm:
   ```
   npm run setup:llm
   ```
   
   Or manually edit the `.env` file to add your credentials:
   ```
   # LinkedIn credentials (optional)
   LINKEDIN_EMAIL=your-linkedin-email@example.com
   LINKEDIN_PASSWORD=your-linkedin-password
   
   # OpenAI configuration
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_MODEL=gpt-4o-mini  # Options: gpt-3.5-turbo, gpt-4o, gpt-4o-mini, o1-mini, o3-mini
   
   # Anthropic (Claude) configuration
   ANTHROPIC_API_KEY=your-anthropic-api-key
   ANTHROPIC_MODEL=claude-3-sonnet-20240307  # Optional: defaults to claude-3-sonnet-20240307 if not specified
   ```
   
   These credentials are used for accessing LinkedIn profiles and companies, and for AI-powered content generation. At least one LLM API key (OpenAI or Anthropic) is recommended for best results, but the application will use fallback mechanisms if none are provided.
   
   After setting up your API keys, you can test them with:
   ```
   npm run test:api
   ```
   
   If you encounter API key issues, use the diagnostic tool:
   ```
   npm run test:llm
   ```

## Running the Application

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```
   The backend server will run on http://localhost:5007

2. In a new terminal window, start the frontend application:
   ```
   cd frontend
   npm run dev
   ```
   The frontend application will run on http://localhost:3000

3. Open your browser and navigate to http://localhost:3000 to use the application

## Features

### 1. LinkedIn Profile Analysis
- Enter a LinkedIn profile URL to analyze an individual
- The app will extract information about their role, company, and interests using Puppeteer
- Generates personalized sales outreach content using AI (Transformers.js) based on VigilantEx's "4 Extra Employees" value proposition
- Output available in three formats: email, LinkedIn message, and phone script

### 2. Company Analysis
- Enter a LinkedIn company URL to analyze a company
- The app will extract company information and identify key decision-makers using Puppeteer
- Generates personalized outreach content for decision-makers
- Includes relevance scoring to prioritize outreach efforts

### 3. Message Analysis
- Paste a client message or email to analyze
- The app will identify sentiment, topics, and questions
- Generates appropriate response content based on the analysis
- Tailors responses to address specific concerns and questions

### 4. Warm Follow-up Emails
- Generate personalized follow-up emails after phone calls with prospects
- Include details from the conversation for a more personal touch
- Address specific concerns raised during the call
- Confirm next steps and scheduled demos
- Perfect for maintaining momentum after initial contact

## AI Text Generation

The application features a multi-level AI content generation system:

1. **Multi-LLM Integration**: The application can use both Claude (Anthropic) and OpenAI models:
   - **Claude (Primary for long-form content)**: Used for warm follow-ups, personalized messages, and detailed company outreach
   - **OpenAI (Primary for structured analysis)**: Used for message analysis, topic extraction, and short responses
   - Modern mini models supported (gpt-4o-mini, o1-mini, o3-mini)
   - Model selection is automatic based on the task requirements

2. **Transformers.js (Secondary Fallback)**: If cloud LLMs are unavailable or encounter errors, the application falls back to a local Transformers.js implementation using the distilgpt2 model. This model is downloaded automatically on first use and cached for subsequent runs.

3. **Template-Based (Final Fallback)**: If both cloud and local AI methods fail, the application will use template-based content generation with role-specific personalization.

This tiered approach ensures robust content generation even when API services are unavailable.

You can run the enhanced LLM integration test to see a side-by-side comparison:
```
npm run test:content
```

And to migrate to the enhanced LLM service if you've been using the original service:
```
node utils/migrateToEnhancedLLM.js
```

## LinkedIn Data Extraction

The application uses Puppeteer to extract data from LinkedIn profiles and companies. This requires valid LinkedIn credentials in the `.env` file. If credentials are not provided or are invalid, the application will use mock data instead. Note that LinkedIn's terms of service may restrict automated access to their platform, so use this feature responsibly.

## Troubleshooting

- If you encounter CORS issues, ensure both the backend and frontend are running
- If the ThreeJS visualization doesn't appear, try refreshing the page
- If LinkedIn data extraction fails, check your credentials in the `.env` file
- If you see "Failed to initialize model" errors, check your internet connection and try again
- For any dependency issues, try running `npm install` again in the respective directories

## Technical Details

- Frontend: React, ThreeJS (via react-three-fiber), TailwindCSS, Chakra UI
- Backend: Node.js, Express
- AI Text Generation: 
  - Primary: Multi-LLM Integration
    - Claude API (Anthropic) for long-form, nuanced content
    - OpenAI API (GPT models) for structured analysis and short content
  - Secondary: Transformers.js (distilgpt2 model)
  - Fallback: Template-based generation
- LLM Caching: In-memory cache with TTL expiration for cost savings
- Data Extraction: Puppeteer for LinkedIn scraping
- State Management: Zustand (frontend)
- 3D Visualizations: Three.js with react-three-fiber

## Contact

For any questions or issues, please contact your developer.
