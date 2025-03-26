const { pipeline, env } = require('@xenova/transformers');
const OpenAI = require('openai');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize OpenAI with API key
// Environment variables:
// - OPENAI_API_KEY: Your OpenAI API key
// - OPENAI_MODEL: (Optional) Model to use (e.g., "gpt-3.5-turbo", "gpt-4", "gpt-4o")
let openai = null;
try {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('Warning: OpenAI API key not found in environment variables. OpenAI integration will be disabled.');
  } else {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
    console.log(`OpenAI client initialized successfully with model: ${model}`);
  }
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
}

// Configure the transformers.js environment (kept as a fallback)
env.useBrowserCache = false; // Disable browser cache (we're in Node.js)
env.allowLocalModels = true; // Allow loading local models
env.cacheDir = './models'; // Set cache directory for downloaded models

// Define our model
const MODEL_NAME = 'Xenova/distilgpt2'; // A smaller model for faster inference
let generator = null;

// Initialize the transformers model (as a fallback)
const initializeModel = async () => {
  if (!generator) {
    console.log('Initializing text generation model...');
    try {
      generator = await pipeline('text-generation', MODEL_NAME);
      console.log('Model initialized successfully');
    } catch (error) {
      console.error('Error initializing model:', error);
      throw new Error(`Failed to initialize model: ${error.message}`);
    }
  }
  return generator;
};

// Don't automatically initialize the local model, we'll prefer OpenAI
// initializeModel().catch(console.error);

/**
 * Use OpenAI to generate content
 * @param {string} prompt - The prompt to send to OpenAI
 * @returns {Promise<string>} - Generated content
 */
const generateWithOpenAI = async (prompt) => {
  try {
    console.log('Generating content with OpenAI...');

    if (!openai) {
      throw new Error('OpenAI client not initialized - check API key in environment variables');
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini", // Use env variable to specify which model to use
      messages: [
        { 
          role: "system", 
          content: "You are an expert sales copywriter specializing in B2B construction technology. Your task is to create persuasive, concise, and professional content for VigilantEx, a company providing AI-powered surveillance for construction sites. Focus on benefits, ROI, and personalization. Use a confident but not aggressive tone." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 600, // Increased to allow for more detailed responses
      top_p: 0.9, // Added for more focused outputs while maintaining some creativity
    });

    const generatedText = completion.choices[0].message.content.trim();
    console.log('OpenAI content generated successfully');
    return generatedText;
  } catch (error) {
    console.error('Error using OpenAI:', error);
    // For quota errors, provide a more specific message
    if (error.code === 'insufficient_quota') {
      console.warn('OpenAI API quota exceeded. Falling back to alternative generation method.');
    }
    throw error;
  }
};

/**
 * Service for AI-powered content generation
 */
const contentGenerationService = {
  /**
   * Generate a warm follow-up email after a phone call
   * @param {Object} profileData - LinkedIn profile data
   * @param {Object} callDetails - Details about the phone call
   * @returns {Promise<string>} - Generated follow-up email
   */
  generateWarmFollowup: async (profileData, callDetails) => {
    try {
      console.log(`Generating warm follow-up email for: ${profileData.name}`);
      
      // Extract company information
      const companyInfo = profileData.company ? `at ${profileData.company}` : '';
      
      // Create a prompt for OpenAI
      const prompt = `
Create a warm, personalized follow-up email to ${profileData.name}, who works as a ${profileData.title} ${companyInfo}.

I just had a phone call with them regarding VigilantEx's AI-powered surveillance system for construction sites. 

Call details:
- Call duration: ${callDetails.duration || '15 minutes'}
- Main topics discussed: ${callDetails.topics ? callDetails.topics.join(', ') : 'our surveillance system features and benefits'}
- Their primary concerns: ${callDetails.concerns || 'price, implementation timeline, and ROI'}
- Next steps discussed: ${callDetails.nextSteps || 'a product demonstration next week'}

VigilantEx provides an advanced AI-powered surveillance system for construction sites that functions like having four additional specialized team members:
1. Security Officer: Monitors for unauthorized access and security breaches
2. Project Manager: Tracks work progress and completion
3. Safety Coordinator: Identifies safety violations in real-time
4. Damage Mitigator: Documents incidents and identifying responsible parties

Key statistics to use:
- Companies using our system have reduced safety incidents by 30%
- Safety violations have decreased by 35% through real-time monitoring
- Productivity has improved by 22% 
- Theft and vandalism have decreased by 40%

Email format:
- Start with a warm, personalized greeting referencing our phone conversation
- Express appreciation for their time
- Provide a brief summary of what we discussed
- Address any specific questions or concerns they raised
- Confirm the next steps we agreed on (like scheduling a demo)
- Offer to answer any additional questions they might have
- End with a friendly, professional sign-off

The email should be professional, warm, concise (250 words max), and conversational.
`;

      try {
        // Try to generate with OpenAI first
        const openAIContent = await generateWithOpenAI(prompt);
        
        if (openAIContent && openAIContent.length > 50) {
          return openAIContent;
        }
      } catch (openaiError) {
        console.error('Error using OpenAI for follow-up email, falling back to template:', openaiError);
      }
      
      // Fallback to template-based follow-up email
      console.log('Using template-based approach as fallback for follow-up email');
      
      // Create a template-based follow-up email
      const greeting = `Hi ${profileData.name.split(' ')[0]},\n\n`;
      
      const intro = `Thank you for taking the time to speak with me today about VigilantEx's construction site surveillance solutions. I really enjoyed our conversation and appreciate your interest in how our technology could benefit your projects ${companyInfo}.\n\n`;
      
      // Summary based on call details
      const summary = `As we discussed, our AI-powered surveillance system functions like having four additional specialized team members watching your construction sites 24/7: a Security Officer monitoring for unauthorized access, a Project Manager tracking work progress, a Safety Coordinator identifying safety violations, and a Damage Mitigator documenting incidents.\n\n`;
      
      // Address concerns from the call
      let concernsResponse = '';
      if (callDetails.concerns) {
        if (callDetails.concerns.toLowerCase().includes('price') || callDetails.concerns.toLowerCase().includes('cost')) {
          concernsResponse += `Regarding your question about pricing, our Argos system is $1,849/month with no upfront costs, which includes the complete hardware setup, solar power, and StarLink connectivity.\n\n`;
        }
        if (callDetails.concerns.toLowerCase().includes('timeline') || callDetails.concerns.toLowerCase().includes('implementation')) {
          concernsResponse += `As for implementation, as I mentioned, our team can have the system fully operational on your site in less than a day, with no disruption to your ongoing work.\n\n`;
        }
        if (callDetails.concerns.toLowerCase().includes('roi')) {
          concernsResponse += `In terms of ROI, our clients typically see a return within 3-6 months through reduced incidents (30% on average), improved productivity (22%), and decreased theft (40%).\n\n`;
        }
      }
      
      // Next steps
      let nextSteps = '';
      if (callDetails.nextSteps && callDetails.nextSteps.toLowerCase().includes('demo')) {
        nextSteps = `I'm looking forward to our demonstration ${callDetails.demoDate ? `on ${callDetails.demoDate}` : 'next week'}, where you'll get to see firsthand how our system works and the immediate benefits it can provide to your operations.\n\n`;
      } else {
        nextSteps = `I'd love to schedule a demonstration for you and your team to see our system in action. Would you have some time next week for a quick 30-minute demo?\n\n`;
      }
      
      // Closing
      const closing = `If you have any questions in the meantime, please don't hesitate to reach out. I'm here to help ensure you have all the information you need.\n\nBest regards,\n[Your Name]\nVigilantEx Solutions\n[Your Phone Number]`;
      
      // Combine all sections
      return greeting + intro + summary + concernsResponse + nextSteps + closing;
    } catch (error) {
      console.error('Error generating warm follow-up email:', error);
      throw new Error(`Failed to generate warm follow-up email: ${error.message}`);
    }
  },

  /**
   * Generate personalized sales content based on a LinkedIn profile
   * @param {Object} profileData - LinkedIn profile data
   * @param {string} outputFormat - Desired output format (email, linkedin, phone)
   * @returns {Promise<string>} - Generated content
   */
  generateProfileContent: async (profileData, outputFormat = 'email') => {
    try {
      console.log(`Generating ${outputFormat} content for profile: ${profileData.name}`);
      
      // Get company information to enrich the content
      const companyInfo = profileData.company ? 
        `at ${profileData.company}` : '';
      
      // Extract relevant interests and experience for personalization
      const interests = profileData.interests || [];
      const relevantInterests = interests.filter(interest => 
        interest.toLowerCase().includes('safety') || 
        interest.toLowerCase().includes('security') ||
        interest.toLowerCase().includes('construction') ||
        interest.toLowerCase().includes('project') ||
        interest.toLowerCase().includes('management')
      );
      
      // Create personalized intro based on profile data
      let intro = '';
      if (outputFormat === 'email') {
        intro = `Hi ${profileData.name.split(' ')[0]},\n\n`;
      } else if (outputFormat === 'linkedin') {
        intro = `Hi ${profileData.name.split(' ')[0]},\n\n`;
      } else if (outputFormat === 'phone') {
        intro = `Hello, may I speak with ${profileData.name}? \n\n`;
        intro += `Hi ${profileData.name.split(' ')[0]}, this is [Your Name] from VigilantEx. `;
      }
      
      // Create a prompt for OpenAI
      const prompt = `
Create a personalized ${outputFormat === 'email' ? 'email' : outputFormat === 'linkedin' ? 'LinkedIn message' : 'phone script'} for ${profileData.name}, who works as a ${profileData.title} ${companyInfo}.

Their interests include: ${interests.join(', ')}
Their experience: ${profileData.experience.map(exp => `${exp.title} at ${exp.company}`).join(', ')}

VigilantEx provides an advanced AI-powered surveillance system for construction sites that functions like having four additional specialized team members:
1. Security Officer: Monitors for unauthorized access and security breaches
2. Project Manager: Tracks work progress and completion
3. Safety Coordinator: Identifies safety violations in real-time
4. Damage Mitigator: Documents incidents and identifies responsible parties

Key statistics to use:
- Companies using our system have reduced safety incidents by 30%
- Safety violations have decreased by 35% through real-time monitoring
- Productivity has improved by 22% 
- Theft and vandalism have decreased by 40%

Personalize the message based on their role:
${profileData.title.toLowerCase().includes('project manager') || profileData.title.toLowerCase().includes('operations') ? 
'- Emphasize productivity improvements and operational efficiency' : ''}
${profileData.title.toLowerCase().includes('safety') || profileData.title.toLowerCase().includes('compliance') ? 
'- Emphasize safety violation reduction and real-time monitoring' : ''}
${profileData.title.toLowerCase().includes('executive') || profileData.title.toLowerCase().includes('director') ? 
'- Emphasize ROI and overall business impact' : ''}

Format:
- Start with ${outputFormat === 'email' || outputFormat === 'linkedin' ? 'a brief greeting' : 'a brief phone introduction'}
- Include a personal connection to their work experience
- Briefly explain our "4 Extra Employees" concept 
- Add personalized value proposition for their specific role
- End with a call to action for a 15-minute demo

The message should be professional, concise (250-300 words), and conversational.
`;

      try {
        // Try to generate with OpenAI first
        const openAIContent = await generateWithOpenAI(prompt);
        
        if (openAIContent && openAIContent.length > 50) {
          return openAIContent;
        }
      } catch (openaiError) {
        console.error('Error using OpenAI, falling back to transformers.js or templates:', openaiError);
      }
      
      // Prepare the context for transformers.js generation as fallback
      try {
        // Initialize the model if not already initialized
        await initializeModel();
        
        // Prepare a prompt for the local AI model
        const localPrompt = `
Write a personalized sales pitch paragraph for a construction professional named ${profileData.name} who works as a ${profileData.title} ${companyInfo}. 
The pitch should explain how VigilantEx's construction site surveillance system would benefit them based on their role.
VigilantEx's system provides 24/7 monitoring with four key functions:
1. Security Officer: Monitors for unauthorized access
2. Project Manager: Tracks work progress and completion
3. Safety Coordinator: Identifies safety violations in real-time
4. Damage Mitigator: Documents incidents and identifies responsible parties

The pitch should be personalized based on their interests (${relevantInterests.join(', ')}) and job role. 
If they're in project management, highlight efficiency and 30% safety incident reduction.
If they're in safety, highlight 35% reduction in safety violations through real-time monitoring.
If they're an executive, highlight 22% productivity improvement and ROI.
Otherwise, highlight general safety and efficiency improvements.

The pitch should be concise (100-150 words), professional, and convincing without being too sales-heavy.

Personalized value proposition:
`;
        
        // Generate content using the AI model
        console.log('Generating content with the transformers.js model...');
        const result = await generator(localPrompt, {
          max_length: 200,
          num_return_sequences: 1,
          temperature: 0.7,
          top_k: 50,
          top_p: 0.9,
          do_sample: true,
        });
        
        // Extract the generated text and clean it up
        let aiGenerated = result[0].generated_text;
        
        // Remove the prompt from the generated text
        aiGenerated = aiGenerated.replace(localPrompt, '').trim();
        
        // Remove any incomplete sentences at the end
        if (aiGenerated.charAt(aiGenerated.length - 1) !== '.') {
          const lastPeriodIndex = aiGenerated.lastIndexOf('.');
          if (lastPeriodIndex !== -1) {
            aiGenerated = aiGenerated.substring(0, lastPeriodIndex + 1);
          }
        }
        
        // Combine with template sections if AI generation was successful
        if (aiGenerated.length > 20) {
          console.log('Transformers.js content generated successfully');
          
          // Add personalization based on interests
          if (relevantInterests.length > 0) {
            intro += `I noticed your profile on LinkedIn and your experience as a ${profileData.title} ${companyInfo}. With your focus on ${relevantInterests.join(' and ')}, I thought you might be interested in how VigilantEx is transforming job site management.`;
          } else {
            intro += `I noticed your profile on LinkedIn and your experience as a ${profileData.title} ${companyInfo}. I thought you might be interested in how VigilantEx is transforming job site management for construction professionals like yourself.`;
          }
          
          // Core message about VigilantEx value proposition
          const coreMessage = `\n\nOur solution functions like having four additional specialized team members watching your construction sites 24/7:\n\n1. A Security Officer monitoring for unauthorized access\n2. A Project Manager tracking work progress and completion\n3. A Safety Coordinator identifying safety violations in real-time\n4. A Damage Mitigator documenting incidents and identifying responsible parties\n\n`;
          
          // Call to action based on format
          let callToAction = '';
          if (outputFormat === 'email' || outputFormat === 'linkedin') {
            callToAction = `\n\nWould you be open to a quick 15-minute call next week to discuss how VigilantEx could benefit your projects${companyInfo ? ` at ${profileData.company}` : ''}?\n\nBest regards,\n[Your Name]`;
          } else if (outputFormat === 'phone') {
            callToAction = `\n\nI'd love to schedule a brief 15-minute demo to show you how our system works. Would you have some time next week to discuss how VigilantEx could benefit your projects${companyInfo ? ` at ${profileData.company}` : ''}?`;
          }
          
          // Combine all sections
          return intro + coreMessage + aiGenerated + callToAction;
        }
      } catch (aiError) {
        console.error('Error using transformers.js model, falling back to template:', aiError);
      }
      
      // Fallback to template-based approach if all AI methods fail
      console.log('Using template-based approach as fallback');
      
      // Add personalization based on interests
      if (relevantInterests.length > 0) {
        intro += `I noticed your profile on LinkedIn and your experience as a ${profileData.title} ${companyInfo}. With your focus on ${relevantInterests.join(' and ')}, I thought you might be interested in how VigilantEx is transforming job site management.`;
      } else {
        intro += `I noticed your profile on LinkedIn and your experience as a ${profileData.title} ${companyInfo}. I thought you might be interested in how VigilantEx is transforming job site management for construction professionals like yourself.`;
      }
      
      // Core message about VigilantEx value proposition
      const coreMessage = `\n\nOur solution functions like having four additional specialized team members watching your construction sites 24/7:\n\n1. A Security Officer monitoring for unauthorized access\n2. A Project Manager tracking work progress and completion\n3. A Safety Coordinator identifying safety violations in real-time\n4. A Damage Mitigator documenting incidents and identifying responsible parties\n\n`;
      
      // Personalized value proposition based on role (template fallback)
      let valueProposition = '';
      if (profileData.title.toLowerCase().includes('project manager') || 
          profileData.title.toLowerCase().includes('operations')) {
        valueProposition = `Given your experience in project management, you'd particularly appreciate how our system has helped companies reduce safety incidents by 30% while improving operational efficiency.`;
      } else if (profileData.title.toLowerCase().includes('safety') || 
                profileData.title.toLowerCase().includes('compliance')) {
        valueProposition = `Given your focus on safety, you'd particularly appreciate how our system has helped companies reduce safety violations by 35% through real-time monitoring and alerts.`;
      } else if (profileData.title.toLowerCase().includes('executive') || 
                profileData.title.toLowerCase().includes('director')) {
        valueProposition = `Given your leadership role, you'd appreciate how our system has delivered a 22% productivity improvement and significant ROI through reduced incidents and improved site management.`;
      } else {
        valueProposition = `Given your experience in the construction industry, you'd appreciate how our system has helped companies improve safety and efficiency across their job sites.`;
      }
      
      // Call to action based on format
      let callToAction = '';
      if (outputFormat === 'email' || outputFormat === 'linkedin') {
        callToAction = `\n\nWould you be open to a quick 15-minute call next week to discuss how VigilantEx could benefit your projects${companyInfo ? ` at ${profileData.company}` : ''}?\n\nBest regards,\n[Your Name]`;
      } else if (outputFormat === 'phone') {
        callToAction = `\n\nI'd love to schedule a brief 15-minute demo to show you how our system works. Would you have some time next week to discuss how VigilantEx could benefit your projects${companyInfo ? ` at ${profileData.company}` : ''}?`;
      }
      
      // Combine all sections
      const content = intro + coreMessage + valueProposition + callToAction;
      
      return content;
    } catch (error) {
      console.error('Error generating profile content:', error);
      throw new Error(`Failed to generate profile content: ${error.message}`);
    }
  },
  
  /**
   * Generate personalized sales content based on a company analysis
   * @param {Object} companyData - LinkedIn company data
   * @param {Array} decisionMakers - List of decision makers at the company
   * @param {string} outputFormat - Desired output format (email, linkedin, phone)
   * @returns {Promise<string>} - Generated content
   */
  generateCompanyContent: async (companyData, decisionMakers, outputFormat = 'email') => {
    try {
      console.log(`Generating ${outputFormat} content for company: ${companyData.name}`);
      
      // Create a prompt for OpenAI
      const prompt = `
Create a personalized ${outputFormat === 'email' ? 'email' : outputFormat === 'linkedin' ? 'LinkedIn message' : 'phone script'} for a decision maker at ${companyData.name}.

Company details:
- Industry: ${companyData.industry}
- Size: ${companyData.size}
- Location: ${companyData.location}
- Specialties: ${companyData.specialties.join(', ')}

VigilantEx provides an advanced AI-powered surveillance system for construction sites that functions like having four additional specialized team members:
1. Security Officer: Monitors for unauthorized access and security breaches
2. Project Manager: Tracks work progress and completion
3. Safety Coordinator: Identifies safety violations in real-time
4. Damage Mitigator: Documents incidents and identifies responsible parties

Key statistics to use:
- Companies using our system have reduced safety incidents by 30%
- Safety violations have decreased by 35% through real-time monitoring
- Productivity has improved by 22% 
- Theft and vandalism have decreased by 40%

Personalize the message based on the company's specialties:
${companyData.specialties.some(s => s.toLowerCase().includes('safety') || s.toLowerCase().includes('compliance')) ? 
'- Emphasize safety violation reduction and real-time monitoring' : ''}
${companyData.specialties.some(s => s.toLowerCase().includes('project') || s.toLowerCase().includes('management')) ? 
'- Emphasize productivity improvements and operational efficiency' : ''}
${companyData.specialties.some(s => s.toLowerCase().includes('commercial') || s.toLowerCase().includes('construction')) ? 
'- Emphasize comprehensive monitoring and efficiency' : ''}

Format:
- Start with ${outputFormat === 'email' ? 'a subject line "Enhancing Safety & Efficiency at ' + companyData.name + '" followed by' : ''} a brief greeting to "[Decision Maker Name]"
- Include a reference to the company's projects or specialties
- Briefly explain our "4 Extra Employees" concept
- Add personalized value proposition based on company specialties
- End with a call to action for a 15-minute demo

The message should be professional, concise (250-300 words), and conversational.
`;

      try {
        // Try to generate with OpenAI first
        const openAIContent = await generateWithOpenAI(prompt);
        
        if (openAIContent && openAIContent.length > 50) {
          return openAIContent;
        }
      } catch (openaiError) {
        console.error('Error using OpenAI, falling back to template:', openaiError);
      }
      
      // Fallback to template-based approach
      console.log('Using template-based approach as fallback');
      
      // Create subject line for email
      let subject = '';
      if (outputFormat === 'email') {
        subject = `Subject: Enhancing Safety & Efficiency at ${companyData.name}\n\n`;
      }
      
      // Create personalized intro based on company data
      let intro = '';
      if (outputFormat === 'email') {
        intro = `Hello [Decision Maker Name],\n\n`;
        intro += `I've been following ${companyData.name}'s impressive ${companyData.specialties[0].toLowerCase()} projects in the ${companyData.location} area and wanted to reach out about a solution that's helping construction companies like yours improve safety compliance while optimizing operational efficiency.`;
      } else if (outputFormat === 'linkedin') {
        intro = `Hi [Decision Maker Name],\n\n`;
        intro += `I came across ${companyData.name} and was impressed by your work in ${companyData.specialties[0].toLowerCase()}. I wanted to connect regarding a solution that's helping construction companies in ${companyData.location} improve safety compliance while optimizing operational efficiency.`;
      } else if (outputFormat === 'phone') {
        intro = `Hello, may I speak with [Decision Maker Name]? \n\n`;
        intro += `Hi, this is [Your Name] from VigilantEx. I've been following ${companyData.name}'s projects in the ${companyData.location} area and wanted to discuss a solution that's helping construction companies like yours improve safety compliance while optimizing operational efficiency.`;
      }
      
      // Core message about VigilantEx value proposition
      const coreMessage = `\n\nVigilantEx provides an all-in-one surveillance solution that functions like having four additional specialized team members watching your construction sites 24/7:\n\n1. A Security Officer monitoring for unauthorized access\n2. A Project Manager tracking work progress and completion\n3. A Safety Coordinator identifying safety violations in real-time\n4. A Damage Mitigator documenting incidents and identifying responsible parties\n\n`;
      
      // Personalized value proposition based on company specialties
      let valueProposition = '';
      if (companyData.specialties.some(s => s.toLowerCase().includes('safety') || s.toLowerCase().includes('compliance'))) {
        valueProposition = `Given ${companyData.name}'s focus on safety compliance, you'd particularly benefit from our Safety Coordinator feature which has helped similar companies reduce safety incidents by 35% through real-time monitoring and alerts.`;
      } else if (companyData.specialties.some(s => s.toLowerCase().includes('project') || s.toLowerCase().includes('management'))) {
        valueProposition = `Given ${companyData.name}'s focus on project management, you'd particularly benefit from our Project Manager feature which has helped similar companies improve operational efficiency by 22% through better tracking and coordination.`;
      } else if (companyData.specialties.some(s => s.toLowerCase().includes('commercial') || s.toLowerCase().includes('construction'))) {
        valueProposition = `Given ${companyData.name}'s focus on commercial construction, you'd particularly benefit from our comprehensive monitoring system which has helped similar companies reduce safety incidents by 30% while improving operational efficiency.`;
      } else {
        valueProposition = `Given ${companyData.name}'s industry focus, you'd particularly benefit from our solution which has helped similar companies reduce safety incidents by 30% while improving operational efficiency.`;
      }
      
      // Call to action based on format
      let callToAction = '';
      if (outputFormat === 'email' || outputFormat === 'linkedin') {
        callToAction = `\n\nWould you be open to a quick 15-minute call next week to discuss how VigilantEx could benefit your projects?\n\nBest regards,\n[Your Name]`;
      } else if (outputFormat === 'phone') {
        callToAction = `\n\nI'd love to schedule a brief 15-minute demo to show you how our system works. Would you have some time next week to discuss how VigilantEx could benefit your projects?`;
      }
      
      // Combine all sections
      const content = subject + intro + coreMessage + valueProposition + callToAction;
      
      return content;
    } catch (error) {
      console.error('Error generating company content:', error);
      throw new Error(`Failed to generate company content: ${error.message}`);
    }
  },
  
  /**
   * Analyze a client message to identify key topics, sentiment, and questions
   * @param {string} clientMessage - Message from the client
   * @returns {Promise<Object>} - Analysis results
   */
  analyzeClientMessage: async (clientMessage) => {
    try {
      console.log('Analyzing client message');
      
      // Try to use OpenAI for message analysis
      try {
        const prompt = `
Analyze the following client message regarding VigilantEx's construction site surveillance system:

"""
${clientMessage}
"""

Provide the analysis in JSON format with these fields:
1. sentiment: Classify as "positive", "negative", or "neutral"
2. topics: Identify main topics discussed (e.g., pricing, features, demo request, implementation, ROI, or general inquiry)
3. questions: Extract explicit or implied questions that need answers

Note that VigilantEx provides:
- Advanced surveillance systems for construction sites
- Core features: security monitoring, project progress tracking, safety violation detection, and incident documentation
- Pricing: Argos system at $1,849/month, LunaVue units at $249/month
- Implementation: Solar-powered with StarLink connectivity, setup in less than a day

Return ONLY the JSON data without any explanations.
`;

        const result = await generateWithOpenAI(prompt);
        
        // Try to parse the result as JSON
        try {
          let jsonStr = result;
          
          // Find JSON content if it's wrapped in markdown code blocks
          const codeBlockMatch = result.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1];
          }
          
          // Clean up the string before parsing
          jsonStr = jsonStr.trim();
          
          // Try to isolate JSON if it's embedded in text
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonStr = jsonMatch[0];
          }
          
          const analysisResult = JSON.parse(jsonStr);
          
          // Validate and normalize the structure
          const normalizedResult = {
            sentiment: analysisResult.sentiment || 'neutral',
            topics: Array.isArray(analysisResult.topics) ? analysisResult.topics : [],
            questions: Array.isArray(analysisResult.questions) ? analysisResult.questions : []
          };
          
          // Ensure we have valid data
          if (normalizedResult.sentiment && 
              ['positive', 'negative', 'neutral'].includes(normalizedResult.sentiment.toLowerCase())) {
            
            normalizedResult.sentiment = normalizedResult.sentiment.toLowerCase();
            
            // If no topics were found, add 'general inquiry'
            if (normalizedResult.topics.length === 0) {
              normalizedResult.topics.push('general inquiry');
            }
            
            console.log('Successfully analyzed message with OpenAI');
            return normalizedResult;
          } else {
            throw new Error('Invalid sentiment value in OpenAI response');
          }
        } catch (jsonError) {
          console.error('Error parsing OpenAI analysis result as JSON:', jsonError);
          console.log('Raw result from OpenAI:', result);
        }
      } catch (openaiError) {
        console.error('Error using OpenAI for message analysis, falling back to basic analysis:', openaiError);
      }
      
      // Fallback: Simple keyword-based topic detection
      const topics = [];
      if (clientMessage.toLowerCase().includes('price') || 
          clientMessage.toLowerCase().includes('cost') || 
          clientMessage.toLowerCase().includes('pricing')) {
        topics.push('pricing');
      }
      if (clientMessage.toLowerCase().includes('feature') || 
          clientMessage.toLowerCase().includes('capability') || 
          clientMessage.toLowerCase().includes('function')) {
        topics.push('features');
      }
      if (clientMessage.toLowerCase().includes('demo') || 
          clientMessage.toLowerCase().includes('demonstration') || 
          clientMessage.toLowerCase().includes('show me')) {
        topics.push('demo request');
      }
      if (clientMessage.toLowerCase().includes('install') || 
          clientMessage.toLowerCase().includes('setup') || 
          clientMessage.toLowerCase().includes('implement')) {
        topics.push('implementation');
      }
      if (clientMessage.toLowerCase().includes('roi') || 
          clientMessage.toLowerCase().includes('return') || 
          clientMessage.toLowerCase().includes('benefit') || 
          clientMessage.toLowerCase().includes('value')) {
        topics.push('ROI');
      }
      
      // Simple sentiment analysis
      let sentiment = 'neutral';
      const positiveWords = ['interested', 'great', 'good', 'like', 'love', 'impressive', 'excited', 'yes', 'please'];
      const negativeWords = ['not interested', 'expensive', 'problem', 'issue', 'concern', 'no', 'don\'t', 'won\'t'];
      
      const positiveCount = positiveWords.filter(word => clientMessage.toLowerCase().includes(word)).length;
      const negativeCount = negativeWords.filter(word => clientMessage.toLowerCase().includes(word)).length;
      
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
      }
      
      // Simple question detection
      const questions = [];
      const sentences = clientMessage.split(/[.!?]+/).filter(s => s.trim().length > 0);
      for (const sentence of sentences) {
        if (sentence.trim().endsWith('?') || 
            sentence.toLowerCase().includes('what is') || 
            sentence.toLowerCase().includes('how much') || 
            sentence.toLowerCase().includes('can you') || 
            sentence.toLowerCase().includes('will it') || 
            sentence.toLowerCase().includes('do you')) {
          questions.push(sentence.trim());
        }
      }
      
      // If no questions were detected but topics were found, create implied questions
      if (questions.length === 0 && topics.length > 0) {
        if (topics.includes('pricing')) {
          questions.push('What is the cost?');
        }
        if (topics.includes('features')) {
          questions.push('What features does the system have?');
        }
        if (topics.includes('demo request')) {
          questions.push('Can I see a demo?');
        }
        if (topics.includes('implementation')) {
          questions.push('How is the system implemented?');
        }
        if (topics.includes('ROI')) {
          questions.push('What is the ROI?');
        }
      }
      
      return {
        sentiment,
        topics: topics.length > 0 ? topics : ['general inquiry'],
        questions: questions.length > 0 ? questions : []
      };
    } catch (error) {
      console.error('Error analyzing client message:', error);
      throw new Error(`Failed to analyze client message: ${error.message}`);
    }
  },
  
  /**
   * Generate a personalized response to a client message
   * @param {string} clientMessage - Original message from the client
   * @param {Object} messageAnalysis - Analysis of the client message
   * @param {string} outputFormat - Desired output format (email, linkedin, phone)
   * @returns {Promise<string>} - Generated response
   */
  generateMessageResponse: async (clientMessage, messageAnalysis, outputFormat = 'email') => {
    try {
      console.log(`Generating ${outputFormat} response to client message`);
      
      // Create a prompt for OpenAI
      const prompt = `
Create a personalized response to the following client message about VigilantEx's construction site surveillance system:

CLIENT MESSAGE:
"""
${clientMessage}
"""

MESSAGE ANALYSIS:
- Sentiment: ${messageAnalysis.sentiment}
- Topics: ${messageAnalysis.topics.join(', ')}
- Questions: ${messageAnalysis.questions.join(', ')}

VigilantEx provides an advanced AI-powered surveillance system for construction sites that functions like having four additional specialized team members:
1. Security Officer: Monitors for unauthorized access and security breaches
2. Project Manager: Tracks work progress and completion
3. Safety Coordinator: Identifies safety violations in real-time
4. Damage Mitigator: Documents incidents and identifies responsible parties

Product Information:
- Argos system: $1,849/month, includes AI-powered surveillance, solar power, StarLink connectivity
- LunaVue units: $249/month per unit or $199/month for multi-packs
- Implementation: Solar-powered with StarLink connectivity, setup in less than a day
- ROI: 35% reduction in safety violations, 22% productivity improvement, 40% decrease in theft

Format the response as a ${outputFormat === 'email' ? 'professional email' : outputFormat === 'linkedin' ? 'LinkedIn message' : 'phone script'}.

${outputFormat === 'email' || outputFormat === 'linkedin' ? 
'Start with "Hello [Client Name]," and end with "Best regards,\\n[Your Name]"' : 
'Start with "Hello [Client Name]," and make it conversational as for a phone call'}

The response should:
- Acknowledge their inquiry with an appropriate tone based on sentiment
- Address specific topics they mentioned (${messageAnalysis.topics.join(', ')})
- Answer their questions (${messageAnalysis.questions.join(', ')})
- Include a call to action to schedule a 15-minute demo
- Be professional, helpful, and conversational
- Be 250-300 words in length

${messageAnalysis.sentiment === 'negative' ? 'Since the sentiment is negative, be especially empathetic and focus on addressing concerns.' : ''}
`;

      try {
        // Try to generate with OpenAI first
        const openAIContent = await generateWithOpenAI(prompt);
        
        if (openAIContent && openAIContent.length > 50) {
          return openAIContent;
        }
      } catch (openaiError) {
        console.error('Error using OpenAI, falling back to template:', openaiError);
      }
      
      // Fallback to template-based approach
      console.log('Using template-based approach as fallback');
      
      // Create personalized greeting
      let greeting = '';
      if (outputFormat === 'email') {
        greeting = `Hello [Client Name],\n\n`;
      } else if (outputFormat === 'linkedin') {
        greeting = `Hi [Client Name],\n\n`;
      } else if (outputFormat === 'phone') {
        greeting = `Hello [Client Name], `;
      }
      
      // Create personalized intro based on sentiment
      let intro = '';
      if (messageAnalysis.sentiment === 'positive') {
        intro = `Thank you for your interest in VigilantEx's surveillance solutions. I'd be happy to provide more information about our products and services.`;
      } else if (messageAnalysis.sentiment === 'negative') {
        intro = `Thank you for reaching out about VigilantEx's surveillance solutions. I understand you have some concerns, and I'd like to address them.`;
      } else {
        intro = `Thank you for your message about VigilantEx's surveillance solutions. I'd be happy to provide more information about our products and services.`;
      }
      
      // Create content based on detected topics
      let content = '\n\n';
      
      if (messageAnalysis.topics.includes('pricing')) {
        content += `Our Argos system is priced at $1,849/month and includes:\n- Advanced AI-powered surveillance with 24/7 monitoring\n- Solar power with StarLink high-speed internet\n- Customized AI agents for real-time detection and alerts\n\nFor smaller areas or to eliminate blind spots, our LunaVue units are available at $249/month for a single unit or $199/month per unit for multi-packs.\n\n`;
      }
      
      if (messageAnalysis.topics.includes('features')) {
        content += `VigilantEx provides comprehensive site monitoring through our "4 Extra Employees" concept:\n- Security Officer: Monitors for unauthorized access and security breaches\n- Project Manager: Tracks work progress, material deliveries, and project timelines\n- Safety Coordinator: Identifies safety violations and hazards in real-time\n- Damage Mitigator: Documents incidents and identifies responsible parties\n\n`;
      }
      
      if (messageAnalysis.topics.includes('implementation')) {
        content += `Implementation is straightforward and requires minimal effort from your team. Our technicians handle the entire setup process, which typically takes less than a day. The system is solar-powered and uses StarLink for connectivity, so no hardwiring or internet connection is required.\n\n`;
      }
      
      if (messageAnalysis.topics.includes('ROI')) {
        content += `Our clients typically see significant ROI through:\n- 35% reduction in safety violations\n- 22% improvement in productivity\n- 40% decrease in theft and vandalism\n- Reduced insurance premiums due to improved site security\n- Comprehensive documentation for dispute resolution\n\n`;
      }
      
      if (messageAnalysis.topics.includes('demo request')) {
        content += `I'd be delighted to schedule a demo for you to see our system in action. Our demonstrations typically take about 30 minutes and show how our "4 Extra Employees" concept works to enhance security, project management, safety compliance, and damage mitigation.\n\n`;
      }
      
      // If only general inquiry was detected, provide overview
      if (messageAnalysis.topics.includes('general inquiry') && messageAnalysis.topics.length === 1) {
        content += `VigilantEx provides advanced AI-powered surveillance for construction sites, functioning like four additional team members watching your sites 24/7:\n\n1. A Security Officer monitoring for unauthorized access\n2. A Project Manager tracking work progress and completion\n3. A Safety Coordinator identifying safety violations in real-time\n4. A Damage Mitigator documenting incidents and identifying responsible parties\n\nOur Argos system is priced at $1,849/month and includes solar power with StarLink connectivity for a truly wireless solution. For smaller areas, our LunaVue units start at $249/month.\n\n`;
      }
      
      // Call to action based on format and topics
      let callToAction = '';
      if (messageAnalysis.topics.includes('demo request')) {
        if (outputFormat === 'email' || outputFormat === 'linkedin') {
          callToAction = `Would you be available next Tuesday or Wednesday afternoon for a demonstration? I can also answer any additional questions you might have at that time.\n\nBest regards,\n[Your Name]`;
        } else if (outputFormat === 'phone') {
          callToAction = `Would you be available next Tuesday or Wednesday afternoon for a demonstration? I can also answer any additional questions you might have at that time.`;
        }
      } else {
        if (outputFormat === 'email' || outputFormat === 'linkedin') {
          callToAction = `Would you like to schedule a brief demonstration to see our system in action? I'm available next week and would be happy to show you how VigilantEx can benefit your projects.\n\nBest regards,\n[Your Name]`;
        } else if (outputFormat === 'phone') {
          callToAction = `Would you like to schedule a brief demonstration to see our system in action? I'm available next week and would be happy to show you how VigilantEx can benefit your projects.`;
        }
      }
      
      // Combine all sections
      const response = greeting + intro + content + callToAction;
      
      return response;
    } catch (error) {
      console.error('Error generating message response:', error);
      throw new Error(`Failed to generate message response: ${error.message}`);
    }
  }
};

module.exports = contentGenerationService;