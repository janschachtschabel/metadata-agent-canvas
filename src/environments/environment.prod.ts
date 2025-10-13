export const environment = {
  production: true,
  
  // OpenAI Configuration
  openai: {
    apiKey: '', // Injected from environment variable
    baseUrl: '', // Optional: Custom OpenAI-compatible endpoint
    model: 'gpt-4.1-mini', // Injected from environment variable
    temperature: 0.3,
    
    // GPT-5 specific settings (only used if model starts with 'gpt-5')
    gpt5: {
      reasoningEffort: 'medium', // Injected from environment variable
      verbosity: 'low' // Injected from environment variable
    }
  },
  
  // Canvas Worker Pool Configuration
  canvas: {
    maxWorkers: 10, // Number of parallel field extractions (5-20 recommended)
    timeout: 30000 // Timeout per field extraction in milliseconds
  }
};
