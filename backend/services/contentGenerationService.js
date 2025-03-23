const { pipeline, env } = require('@xenova/transformers');

// Configure the transformers.js environment
env.useBrowserCache = false; // Disable browser cache (we're in Node.js)
env.allowLocalModels = true; // Allow loading local models
env.cacheDir = './models'; // Set cache directory for downloaded models

// Define our model
const MODEL_NAME = 'Xenova/distilgpt2'; // A smaller model for faster inference
let generator = null;

// Initialize the model
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

// Initialize the model in the background
initializeModel().catch(console.error);

/**
 * Service for AI-powered content generation
 */
const contentGenerationService = {
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
        intro += `I noticed your impressive work as a ${profileData.title} ${companyInfo}. `;
      } else if (outputFormat === 'linkedin') {
        intro = `Hi ${profileData.name.split(' ')[0]},\n\n`;
        intro += `I came across your profile and was impressed by your experience as a ${profileData.title} ${companyInfo}. `;
      } else if (outputFormat === 'phone') {
        intro = `Hello, may I speak with ${profileData.name}? \n\n`;
        intro += `Hi ${profileData.name.split(' ')[0]}, this is [Your Name] from VigilantEx. I noticed your profile on LinkedIn and your experience as a ${profileData.title} ${companyInfo}. `;
      }
      
      // Add personalization based on interests
      if (relevantInterests.length > 0) {
        intro += `With your focus on ${relevantInterests.join(' and ')}, I thought you might be interested in how VigilantEx is transforming job site management.`;
      } else {
        intro += `I thought you might be interested in how VigilantEx is transforming job site management for construction professionals like yourself.`;
      }
      
      // Core message about VigilantEx value proposition
      const coreMessage = `\n\nOur solution functions like having four additional specialized team members watching your construction sites 24/7:\n\n1. A Security Officer monitoring for unauthorized access\n2. A Project Manager tracking work progress and completion\n3. A Safety Coordinator identifying safety violations in real-time\n4. A Damage Mitigator documenting incidents and identifying responsible parties\n\n`;
      
      // Prepare the context for AI generation
      try {
        // Initialize the model if not already initialized
        await initializeModel();
        
        // Prepare a prompt for the AI model
        const prompt = `
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
        console.log('Generating content with the AI model...');
        const result = await generator(prompt, {
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
        aiGenerated = aiGenerated.replace(prompt, '').trim();
        
        // Remove any incomplete sentences at the end
        if (aiGenerated.charAt(aiGenerated.length - 1) !== '.') {
          const lastPeriodIndex = aiGenerated.lastIndexOf('.');
          if (lastPeriodIndex !== -1) {
            aiGenerated = aiGenerated.substring(0, lastPeriodIndex + 1);
          }
        }
        
        // Combine with template sections if AI generation was successful
        if (aiGenerated.length > 20) {
          console.log('AI content generated successfully');
          
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
        console.error('Error using AI model, falling back to template:', aiError);
      }
      
      // Fallback to template-based approach if AI fails
      console.log('Using template-based approach as fallback');
      
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
      
      // In a production environment, we would use Transformers.js to generate content
      // For this MVP, we'll implement a simplified version that returns template-based content
      
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
      
      // In a production environment, we would use Transformers.js for NLP analysis
      // For this MVP, we'll implement a simplified version that returns basic analysis
      
      // Simple keyword-based topic detection
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
      
      // In a production environment, we would use Transformers.js to generate content
      // For this MVP, we'll implement a simplified version that returns template-based content
      
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
