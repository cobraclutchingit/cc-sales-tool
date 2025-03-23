# VigilantEx Sales Automation App - Installation and Usage Guide

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

4. Configure LinkedIn credentials:
   ```
   cd backend
   cp .env.example .env
   ```
   Edit the `.env` file to add your LinkedIn email and password:
   ```
   LINKEDIN_EMAIL=your-linkedin-email@example.com
   LINKEDIN_PASSWORD=your-linkedin-password
   ```
   These credentials are used for accessing LinkedIn profiles and companies. Without valid credentials, the application will use mock data instead.

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

## AI Text Generation

The application uses Transformers.js with the distilgpt2 model to generate personalized sales content. The model is downloaded automatically on first use and cached for subsequent runs. If the AI model fails to load or generate content, the application will fall back to template-based content generation.

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
- AI Text Generation: Transformers.js (distilgpt2 model)
- Data Extraction: Puppeteer for LinkedIn scraping
- State Management: Zustand (frontend)
- 3D Visualizations: Three.js with react-three-fiber

## Contact

For any questions or issues, please contact your developer.
