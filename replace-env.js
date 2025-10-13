#!/usr/bin/env node

/**
 * Replace environment variables in environment.prod.ts at build time
 * Used by Vercel to inject OPENAI_API_KEY from environment variables
 */

const fs = require('fs');
const path = require('path');

const envProdPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');
const apiKey = process.env.OPENAI_API_KEY || '';

// Template for environment.prod.ts if it doesn't exist
const envProdTemplate = `export const environment = {
  production: true,
  
  // OpenAI Configuration
  openai: {
    apiKey: '${apiKey}', // ${apiKey ? 'Injected from Vercel environment variable' : 'Empty - user will be prompted'}
    baseUrl: '', // Optional: Custom OpenAI-compatible endpoint
    model: 'gpt-4o-mini', // Standard model
    temperature: 0.3,
    
    // GPT-5 specific settings (only used if model starts with 'gpt-5')
    gpt5: {
      reasoningEffort: 'medium', // 'low' | 'medium' | 'high'
      verbosity: 'low' // 'low' | 'medium' | 'high'
    }
  },

  // Canvas Settings
  canvas: {
    batchSize: 10,
    batchDelayMs: 100,
    timeout: 60000
  }
};
`;

// Check if file exists
if (!fs.existsSync(envProdPath)) {
  console.log('⚠️  environment.prod.ts not found, creating from template...');
  fs.writeFileSync(envProdPath, envProdTemplate, 'utf8');
  console.log('✅ Created environment.prod.ts');
} else {
  // Read the existing file
  let content = fs.readFileSync(envProdPath, 'utf8');
  
  // Replace API Key placeholder with environment variable
  if (apiKey) {
    console.log('✅ Injecting OPENAI_API_KEY into environment.prod.ts');
    content = content.replace(
      /apiKey:\s*['"][^'"]*['"]\s*,?\s*\/\/.*$/m,
      `apiKey: '${apiKey}', // Injected from Vercel environment variable`
    );
  } else {
    console.log('⚠️  No OPENAI_API_KEY found in environment variables');
    console.log('💡 User will be prompted for API key at runtime');
  }
  
  // Write back
  fs.writeFileSync(envProdPath, content, 'utf8');
}

console.log('✅ Environment variables processed');
