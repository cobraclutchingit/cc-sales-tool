const { pipeline, env } = require('@xenova/transformers');

// Configure the transformers.js environment
env.useBrowserCache = false; // Disable browser cache (we're in Node.js)
env.allowLocalModels = true; // Allow loading local models
env.cacheDir = './models'; // Set cache directory for downloaded models

// Define our model
const MODEL_NAME = 'Xenova/distilgpt2'; // A smaller model for faster inference

async function testTransformers() {
  try {
    console.log('Initializing text generation model...');
    const generator = await pipeline('text-generation', MODEL_NAME);
    console.log('Model initialized successfully');
    
    // Generate some text
    const prompt = 'Hello, I am a construction project manager interested in';
    console.log(`Generating text with prompt: "${prompt}"`);
    
    const result = await generator(prompt, {
      max_length: 50,
      num_return_sequences: 1,
      temperature: 0.7,
      top_k: 50,
      top_p: 0.9,
      do_sample: true,
    });
    
    console.log('Generated text:');
    console.log(result[0].generated_text);
  } catch (error) {
    console.error('Error in Transformers.js test:', error);
  }
}

testTransformers();