export const environment = {
  production: true,
  
  // OpenAI Configuration
  openai: {
    apiKey: '', // WICHTIG: Leer lassen! Wird von Vercel zur Build-Zeit injiziert
    baseUrl: '', // Optional: Custom OpenAI-compatible endpoint
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
