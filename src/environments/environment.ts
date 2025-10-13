export const environment = {
  production: false,
  
  // OpenAI Configuration
  openai: {
    apiKey: '', // Will be injected by replace-env.js from environment variables
    baseUrl: '', // Optional: Custom OpenAI-compatible endpoint (leave empty for default)
    model: 'gpt-4.1-mini', // Will be injected by replace-env.js
    temperature: 0.3,
    
    // GPT-5 specific settings (only used if model starts with 'gpt-5')
    gpt5: {
      reasoningEffort: 'medium', // Will be injected by replace-env.js
      verbosity: 'low' // Will be injected by replace-env.js
    }
  },
  
  // Canvas Worker Pool Configuration
  canvas: {
    maxWorkers: 10, // Number of parallel field extractions (5-20 recommended)
    timeout: 30000 // Timeout per field extraction in milliseconds
  }
};
