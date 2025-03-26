/**
 * Agent Prompts Configuration
 * 
 * This file contains system prompts and templates for the two-agent system:
 * 1. Fine-tuning agent (gpt-4o-mini)
 * 2. Sales copy generation agent (claude-3-opus-20240229)
 */

// System prompt for the fine-tuning agent
exports.fineTuningAgentPrompt = `
You are an AI assistant designed to generate personalized prompts for sales copy creation. Your task is to take the input of a person's name, job title, and company, and use that information to craft a tailored prompt for the sales copy generation agent. This prompt will guide the creation of outreach content (e.g., sales email, LinkedIn message, cold call script) that addresses the prospect's specific pain points and incorporates relevant company or industry information.

Instructions:
Research the Company:
Determine the company's size (e.g., small, medium, large) by looking up available information.
Identify any recent news, updates, or trends related to the company or its industry (e.g., press releases, articles, or reports).
Confirm the industry if it's not obvious from the company name, focusing on the construction sector for relevance.

Identify Role-Specific Pain Points:
Based on the job title, determine common pain points for that role within the construction industry. Use this guide:
Pre-Construction Managers: Project visibility, subcontractor coordination, scheduling, planning surprises.
Operations Directors: Resource management, progress tracking, operational hiccups, cost control.
Safety Directors: Safety compliance, accident prevention, safety training, compliance records.
Project Executives: Dispute prevention, cost savings, risk management, client satisfaction.
Vice Presidents: Strategic oversight, scalability, resource allocation, operational efficiency.
Site Superintendents: Site visibility, time management, worker accountability, communication.
Cross-reference with company size and news to refine the pain points.

Prioritize Additional Context:
IMPORTANT: ALWAYS check the "Additional Context and Instructions" section first. If additional context mentions:
1. A previous demo, meeting, or interaction - this indicates existing contact, so DO NOT offer a new demo. Instead, focus on a follow-up approach.
2. Specific next steps like sending site proposals or information - make this the PRIMARY focus of your prompt.
3. Any other specific instructions - prioritize these over general messaging.

Choose the Outreach Format:
Select the most appropriate type of outreach depending on the context provided to you.

Use this template to craft the prompt for the sales copy generation agent:

Generate a [type of outreach] for [Name], [Job Title] at [Company], addressing the pain point of [specific pain point], and mention [relevant company news, industry trend, or role-specific challenge if applicable]. 

[If the additional context mentions a previous demo or meeting, include instructions here to focus on follow-up and NOT offer another demo]

[If the additional context mentions specific requests like site proposals, include instructions here to make this the primary focus]

The message should showcase VigilantEx's "4 Extra Employees" concept, highlight relevant benefits for their role, and conclude with a clear call to action. Make it professional, conversational, and under 250 words.

CRITICAL: Analyze the additional context carefully. If it mentions a previous demo or site proposals, these MUST be reflected in your instructions.
`;

// System prompt for the sales copy generation agent
exports.salesCopyAgentPrompt = `
You are an expert sales copywriter specializing in B2B construction technology. Your task is to create persuasive, concise, and professional content for VigilantEx, a company providing AI-powered surveillance for construction sites. Focus on benefits, ROI, and personalization. Use a confident but not aggressive tone.

VigilantEx Product Information:
- VigilantEx provides advanced AI-powered surveillance for construction sites
- The Argos system features solar power, cameras with 360° coverage, and Starlink connectivity
- The LunaVu units complement Argos by eliminating blind spots

The "4 Extra Employees" concept:
VigilantEx functions like having four additional specialized team members:
1. Security Officer: Monitors for unauthorized access and security breaches
2. Project Manager: Tracks work progress and completion
3. Safety Coordinator: Identifies safety violations in real-time
4. Damage Mitigator: Documents incidents and identifies responsible parties

Key statistics:
- Companies using our system have reduced safety incidents by 30%
- Safety violations have decreased by 35% through real-time monitoring
- Productivity has improved by 22% 
- Theft and vandalism have decreased by 40%

IMPORTANT - Adaptive Messaging Rules:
1. FOLLOW-UP CONTENT: If the prompt mentions a previous demo or meeting, do NOT offer a new demo. Instead, focus on next steps from that previous interaction.
2. SPECIFIC REQUESTS: If the prompt asks for specific information (like "site proposals"), make this the central focus of your message.
3. EXECUTIVE MESSAGING: For VPs and executives, focus on strategic benefits and ROI rather than technical details.
4. CONCISENESS: Keep all messages under 250 words, with clear paragraphs and bullet points where appropriate.

You will receive a specific prompt with details about the prospect and type of outreach needed.
Ensure your response is personalized, concise, and includes a clear call to action that makes sense for the relationship stage.
`;

// Template for follow-up email after a call
exports.callFollowupTemplate = `
Subject: Great Speaking With You About Construction Site Security

Hi {firstName},

Thank you for taking the time to speak with me today about the security and management challenges at your construction sites. I appreciated learning about {personalDetail}.

As promised, I'm sending over some information about how VigilantEx helps construction companies like {companyName} improve site security while enhancing operational efficiency.

Key points we discussed:
• The rising costs of theft and vandalism at construction sites
• Challenges with maintaining 24/7 site visibility
• The need for better documentation for compliance and dispute resolution

Our "4 Extra Employees" approach provides you with:
1. A 24/7 Security Officer monitoring your sites
2. A Project Manager tracking work progress
3. A Safety Coordinator identifying potential violations
4. A Damage Mitigator documenting incidents

I've attached a brief overview of our solutions that might be particularly relevant to your role as {role}. You can also check out this 2-minute video showing VigilantEx in action: [Video Link]

Would you be available for a brief demo next week? I'd be happy to show you exactly how our system could work for your specific sites.

Just click here to find a time that works for you: [Booking Link]

Looking forward to showing you how we can help {companyName} enhance security and operations.

Best regards,
Mike Cerone
`;

// Template for LinkedIn connection request
exports.linkedinConnectionTemplate = `
Hi {firstName}, I noticed your work in construction at {companyName} and thought you might be interested in how our technology helps {role}s like you improve project visibility and security. Would you be open to connecting?
`;

// Template for LinkedIn message
exports.linkedinMessageTemplate = `
Hi {firstName},

Thanks for connecting! I work with VigilantEx, where we provide AI-powered surveillance for construction sites that functions like having four specialized team members watching your sites 24/7.

I noticed you're a {role} at {companyName}, and I thought our solution might help with {painPoint} - something many professionals in your position face.

Would you be open to a brief call to discuss how we've helped similar companies improve security and operational efficiency?

Best regards,
Mike
`;

// Template for company research prompt
exports.companyResearchPrompt = `
Please research and provide key information about the company {companyName}, focusing on:
1. Company size and approximate number of employees
2. Primary focus within the construction industry
3. Recent projects or news
4. Any notable challenges or initiatives
5. Key executives or decision-makers

Format the information concisely to help create personalized outreach.
`;

// Template for role-based pain points research prompt
exports.roleResearchPrompt = `
Please analyze the role of {jobTitle} in the construction industry, focusing on:
1. Primary responsibilities
2. Key challenges and pain points
3. Metrics they typically care about
4. How VigilantEx's offerings specifically address their needs
5. Personalization angles based on their role

Format the information concisely to help create personalized outreach.
`;

// Output types supported by the system
exports.outputTypes = [
  "sales_email",
  "linkedin_connection",
  "linkedin_message", 
  "linkedin_post",
  "follow_up_email",
  "after_demo_email",
  "text_message"
];

// Role-specific customization guide
exports.roleCustomization = {
  "pre_construction_manager": {
    "painPoints": [
      "project visibility across multiple sites",
      "subcontractor coordination challenges",
      "scheduling issues",
      "planning surprises",
      "client visibility into project progress"
    ],
    "benefits": [
      "35% reduction in coordination issues",
      "complete visibility across all projects",
      "stronger client updates with visual progress reports",
      "better subcontractor accountability"
    ]
  },
  "operations_director": {
    "painPoints": [
      "resource management",
      "tracking project progress accurately",
      "operational disruptions",
      "cost control issues",
      "maintaining reliable deadlines"
    ],
    "benefits": [
      "22% productivity improvement",
      "real-time progress insights",
      "reduced operational hiccups",
      "tighter cost control through better oversight"
    ]
  },
  "safety_director": {
    "painPoints": [
      "OSHA compliance challenges",
      "safety violation detection",
      "accident prevention",
      "compliance documentation",
      "improving safety culture"
    ],
    "benefits": [
      "35% reduction in safety violations",
      "instant safety violation detection and alerts",
      "solid compliance records with video evidence",
      "demonstrable improvement in safety metrics"
    ]
  },
  "project_executive": {
    "painPoints": [
      "dispute resolution",
      "cost overruns",
      "risk management",
      "client satisfaction",
      "financial tracking"
    ],
    "benefits": [
      "saved $175,000 in disputed claims",
      "reduced project risks through constant monitoring",
      "improved client satisfaction with transparent updates",
      "stronger financial tracking with real-time data"
    ]
  },
  "site_superintendent": {
    "painPoints": [
      "limited site visibility",
      "time management challenges",
      "worker accountability",
      "communication issues",
      "prioritizing physical presence"
    ],
    "benefits": [
      "complete site awareness",
      "smarter time management",
      "increased worker responsibility",
      "reduced project timeline by up to 17 days"
    ]
  }
};