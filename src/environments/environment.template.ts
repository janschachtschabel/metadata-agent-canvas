// This is a template file for environment.ts
// Copy this file to environment.ts and add your local API key for development

export const environment = {
  production: false,
  
  // OpenAI Configuration
  openai: {
    apiKey: '', // Add your local API key here for development
    baseUrl: '', // Optional: Custom OpenAI-compatible endpoint (leave empty for default)
    model: 'gpt-4.1-mini', // Standard model
    temperature: 0.3,
    
    // GPT-5 specific settings (only used if model starts with 'gpt-5')
    gpt5: {
      reasoningEffort: 'medium', // 'low' | 'medium' | 'high'
      verbosity: 'low' // 'low' | 'medium' | 'high'
    }
  },

  // Canvas Worker Pool Configuration
  canvas: {
    maxWorkers: 10, // Number of parallel field extractions (5-20 recommended)
    timeout: 30000 // Timeout per field extraction in milliseconds
  }
};
