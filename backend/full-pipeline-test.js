const { pipeline, env } = require('@xenova/transformers');
const puppeteer = require('puppeteer');

// Configure Transformers.js
env.useBrowserCache = false;
env.allowLocalModels = true;
env.cacheDir = './models';
const MODEL_NAME = 'Xenova/distilgpt2';

// Mock extractProfileData function (similar to what we have in profileService.js)
const extractProfileData = async (profileUrl) => {
  console.log('Extracting profile data for:', profileUrl);
  return {
    name: 'John Doe',
    title: 'Construction Project Manager',
    company: 'ABC Construction',
    location: 'Phoenix, Arizona',
    experience: [
      { title: 'Project Manager', company: 'ABC Construction', duration: '2018 - Present' },
      { title: 'Assistant Project Manager', company: 'XYZ Builders', duration: '2015 - 2018' }
    ],
    interests: ['Construction Technology', 'Project Management', 'Safety Compliance'],
    skills: ['Project Management', 'Construction Management', 'Safety Standards', 'Team Leadership'],
    education: [
      { school: 'University of Arizona', degree: 'B.S. in Construction Management', years: '2011 - 2015' }
    ]
  };
};

// Modified version of the generateProfileContent function from contentGenerationService.js
const generateProfileContent = async (profileData, outputFormat = 'email', generator) => {
  try {
    console.log(`Generating ${outputFormat} content for profile: ${profileData.name}`);
    
    // Get company information to enrich the content
    const companyInfo = profileData.company ? 
      `at ${profileData.company}` : '';
    
    // Extract relevant interests
    const interests = profileData.interests || [];
    const relevantInterests = interests.filter(interest => 
      interest.toLowerCase().includes('safety') || 
      interest.toLowerCase().includes('construction') ||
      interest.toLowerCase().includes('project') ||
      interest.toLowerCase().includes('management')
    );
    
    // Create personalized intro
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
    
    if (relevantInterests.length > 0) {
      intro += `With your focus on ${relevantInterests.join(' and ')}, I thought you might be interested in how VigilantEx is transforming job site management.`;
    } else {
      intro += `I thought you might be interested in how VigilantEx is transforming job site management for construction professionals like yourself.`;
    }
    
    // Core message about VigilantEx value proposition
    const coreMessage = `\n\nOur solution functions like having four additional specialized team members watching your construction sites 24/7:\n\n1. A Security Officer monitoring for unauthorized access\n2. A Project Manager tracking work progress and completion\n3. A Safety Coordinator identifying safety violations in real-time\n4. A Damage Mitigator documenting incidents and identifying responsible parties\n\n`;
    
    // Prepare AI generation prompt
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
    
    console.log('AI content generated successfully');
    
    // Call to action
    let callToAction = '';
    if (outputFormat === 'email' || outputFormat === 'linkedin') {
      callToAction = `\n\nWould you be open to a quick 15-minute call next week to discuss how VigilantEx could benefit your projects${companyInfo ? ` at ${profileData.company}` : ''}?\n\nBest regards,\n[Your Name]`;
    } else if (outputFormat === 'phone') {
      callToAction = `\n\nI'd love to schedule a brief 15-minute demo to show you how our system works. Would you have some time next week to discuss how VigilantEx could benefit your projects${companyInfo ? ` at ${profileData.company}` : ''}?`;
    }
    
    // Combine all sections
    const content = intro + coreMessage + aiGenerated + callToAction;
    
    return content;
  } catch (error) {
    console.error('Error generating profile content:', error);
    
    // Fallback to template-based approach
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
      callToAction = `\n\nWould you be open to a quick 15-minute call next week to discuss how VigilantEx could benefit your projects?\n\nBest regards,\n[Your Name]`;
    } else if (outputFormat === 'phone') {
      callToAction = `\n\nI'd love to schedule a brief 15-minute demo to show you how our system works. Would you have some time next week to discuss how VigilantEx could benefit your projects?`;
    }
    
    // Create intro based on profile data
    let intro = '';
    if (outputFormat === 'email') {
      intro = `Hi ${profileData.name.split(' ')[0]},\n\n`;
      intro += `I noticed your impressive work as a ${profileData.title} at ${profileData.company}. `;
    } else if (outputFormat === 'linkedin') {
      intro = `Hi ${profileData.name.split(' ')[0]},\n\n`;
      intro += `I came across your profile and was impressed by your experience as a ${profileData.title} at ${profileData.company}. `;
    } else if (outputFormat === 'phone') {
      intro = `Hello, may I speak with ${profileData.name}? \n\n`;
      intro += `Hi ${profileData.name.split(' ')[0]}, this is [Your Name] from VigilantEx. I noticed your profile on LinkedIn and your experience as a ${profileData.title} at ${profileData.company}. `;
    }
    
    // Add personalization based on interests
    const interests = profileData.interests || [];
    if (interests.length > 0) {
      intro += `With your focus on ${interests.join(' and ')}, I thought you might be interested in how VigilantEx is transforming job site management.`;
    } else {
      intro += `I thought you might be interested in how VigilantEx is transforming job site management for construction professionals like yourself.`;
    }
    
    // Core message about VigilantEx value proposition
    const coreMessage = `\n\nOur solution functions like having four additional specialized team members watching your construction sites 24/7:\n\n1. A Security Officer monitoring for unauthorized access\n2. A Project Manager tracking work progress and completion\n3. A Safety Coordinator identifying safety violations in real-time\n4. A Damage Mitigator documenting incidents and identifying responsible parties\n\n`;
    
    // Combine all sections
    const content = intro + coreMessage + valueProposition + callToAction;
    
    return content;
  }
};

// Test the full pipeline
async function testFullPipeline() {
  try {
    console.log("Testing the full pipeline...");
    
    // Step 1: Initialize the AI model
    console.log("Step 1: Initializing AI model...");
    const generator = await pipeline('text-generation', MODEL_NAME);
    console.log("AI model initialized successfully");
    
    // Step 2: Extract profile data (using mock function)
    console.log("\nStep 2: Extracting profile data...");
    const profileUrl = "https://www.linkedin.com/in/testprofile";
    const profileData = await extractProfileData(profileUrl);
    console.log("Profile data extracted successfully");
    
    // Step 3: Generate content using the AI model
    console.log("\nStep 3: Generating content with AI...");
    const content = await generateProfileContent(profileData, 'email', generator);
    
    // Display the results
    console.log("\n--- FINAL RESULTS ---");
    console.log("Profile Data:");
    console.log(`Name: ${profileData.name}`);
    console.log(`Title: ${profileData.title}`);
    console.log(`Company: ${profileData.company}`);
    console.log(`Interests: ${profileData.interests.join(', ')}`);
    
    console.log("\nGenerated Content:");
    console.log(content);
    
    console.log("\nPipeline test completed successfully!");
  } catch (error) {
    console.error("Error in pipeline test:", error);
  }
}

// Run the test
testFullPipeline();