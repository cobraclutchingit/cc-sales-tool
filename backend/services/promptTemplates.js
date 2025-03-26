/**
 * Prompt templates for VigilantEx content generation
 * 
 * This file contains the prompt templates used for various content generation tasks.
 * Centralizing these templates makes them easier to maintain and update.
 */

// Try to import LangChain if available, otherwise use simple template strings
let PromptTemplate;
try {
  const langchain = require('@langchain/core/prompts');
  PromptTemplate = langchain.PromptTemplate;
} catch (error) {
  // Create a simplified version if LangChain is not available
  console.warn('LangChain not available, using simplified templates');
  PromptTemplate = {
    fromTemplate: (template) => {
      return {
        template,
        format: (values) => {
          let result = template;
          for (const [key, value] of Object.entries(values)) {
            result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
          }
          return result;
        }
      };
    }
  };
}

/**
 * Initialize and return all prompt templates
 * @returns {Object} - Object containing all prompt templates
 */
function initializePromptTemplates() {
  // System prompt for B2B construction sales content
  const salesSystemPrompt = 
`You are an expert sales copywriter specializing in B2B construction technology. 
Your task is to create persuasive, concise, and professional content for VigilantEx, 
a company providing AI-powered surveillance for construction sites. 
Focus on benefits, ROI, and personalization. Use a confident but not aggressive tone.`;

  return {
    // Profile content prompt
    profileContent: PromptTemplate.fromTemplate(`${salesSystemPrompt}

Create a personalized {outputFormat} for {name}, who works as a {title} {companyInfo}.

Their interests include: {interests}
Their experience: {experience}

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

Personalize the message based on their role.
{roleGuidance}

Format:
- Start with {greeting}
- Include a personal connection to their work experience
- Briefly explain our "4 Extra Employees" concept 
- Add personalized value proposition for their specific role
- End with a call to action for a 15-minute demo

The message should be professional, concise (250-300 words), and conversational.`),

    // Warm follow-up email prompt
    warmFollowup: PromptTemplate.fromTemplate(`${salesSystemPrompt}

Create a warm, personalized follow-up email to {name}, who works as a {title} {companyInfo}.

I just had a phone call with them regarding VigilantEx's AI-powered surveillance system for construction sites. 

Call details:
- Call duration: {duration}
- Main topics discussed: {topicsDiscussed}
- Their primary concerns: {concerns}
- Next steps discussed: {nextSteps}

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

The email should be professional, warm, concise (250 words max), and conversational.`),

    // Message analysis prompt
    messageAnalysis: PromptTemplate.fromTemplate(`Analyze the following client message regarding VigilantEx's construction site surveillance system:

"""
{clientMessage}
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

Return ONLY the JSON data without any explanations.`),

    // Company content prompt
    companyContent: PromptTemplate.fromTemplate(`${salesSystemPrompt}

Create a personalized {outputFormat} for a decision maker at {companyName}.

Company details:
- Industry: {industry}
- Size: {size}
- Location: {location}
- Specialties: {specialties}

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
{specialtyGuidance}

Format:
- Start with {greeting}
- Include a reference to the company's projects or specialties
- Briefly explain our "4 Extra Employees" concept
- Add personalized value proposition based on company specialties
- End with a call to action for a 15-minute demo

The message should be professional, concise (250-300 words), and conversational.`),

    // Message response prompt
    messageResponse: PromptTemplate.fromTemplate(`${salesSystemPrompt}

Create a personalized response to the following client message about VigilantEx's construction site surveillance system:

CLIENT MESSAGE:
"""
{clientMessage}
"""

MESSAGE ANALYSIS:
- Sentiment: {sentiment}
- Topics: {topics}
- Questions: {questions}

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

Format the response as a {outputFormat}.

{responseFormat}

The response should:
- Acknowledge their inquiry with an appropriate tone based on sentiment
- Address specific topics they mentioned ({topics})
- Answer their questions ({questions})
- Include a call to action to schedule a 15-minute demo
- Be professional, helpful, and conversational
- Be 250-300 words in length

{sentimentGuidance}`)
  };
}

module.exports = { initializePromptTemplates };