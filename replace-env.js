#!/usr/bin/env node

/**
 * Replace environment variables in environment files at build time
 * Used by Vercel to inject OPENAI_API_KEY from environment variables
 * Works for both development and production
 */

const fs = require('fs');
const path = require('path');

const envProdPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');
const envDevPath = path.join(__dirname, 'src', 'environments', 'environment.ts');
const apiKey = process.env.OPENAI_API_KEY || '';
const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const baseUrl = process.env.OPENAI_BASE_URL || '';
const gpt5ReasoningEffort = process.env.GPT5_REASONING_EFFORT || 'medium';
const gpt5Verbosity = process.env.GPT5_VERBOSITY || 'low';

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

/**
 * Process an environment file
 */
function processEnvFile(filePath, fileName) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${fileName} not found, skipping...`);
    return;
  }

  console.log(`\n📝 Processing ${fileName}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace API Key
  if (apiKey) {
    const oldContent = content;
    content = content.replace(
      /apiKey:\s*['"][^'"]*['"]\s*,?\s*\/\/.*$/m,
      `apiKey: '${apiKey}', // Injected from environment variable`
    );
    if (content !== oldContent) {
      console.log(`  ✅ Injected OPENAI_API_KEY`);
      modified = true;
    }
  }

  // Replace Model
  if (model) {
    const oldContent = content;
    content = content.replace(
      /model:\s*['"][^'"]*['"]\s*,?\s*\/\/.*$/m,
      `model: '${model}', // Injected from environment variable`
    );
    if (content !== oldContent) {
      console.log(`  ✅ Injected OPENAI_MODEL: ${model}`);
      modified = true;
    }
  }

  // Replace Base URL
  if (baseUrl) {
    const oldContent = content;
    content = content.replace(
      /baseUrl:\s*['"][^'"]*['"]\s*,?\s*\/\/.*$/m,
      `baseUrl: '${baseUrl}', // Injected from environment variable`
    );
    if (content !== oldContent) {
      console.log(`  ✅ Injected OPENAI_BASE_URL`);
      modified = true;
    }
  }

  // Replace GPT-5 Reasoning Effort
  if (gpt5ReasoningEffort) {
    const oldContent = content;
    content = content.replace(
      /reasoningEffort:\s*['"][^'"]*['"]\s*,?\s*\/\/.*$/m,
      `reasoningEffort: '${gpt5ReasoningEffort}', // Injected from environment variable`
    );
    if (content !== oldContent) {
      console.log(`  ✅ Injected GPT5_REASONING_EFFORT: ${gpt5ReasoningEffort}`);
      modified = true;
    }
  }

  // Replace GPT-5 Verbosity
  if (gpt5Verbosity) {
    const oldContent = content;
    content = content.replace(
      /verbosity:\s*['"][^'"]*['"]\s*,?\s*\/\/.*$/m,
      `verbosity: '${gpt5Verbosity}' // Injected from environment variable`
    );
    if (content !== oldContent) {
      console.log(`  ✅ Injected GPT5_VERBOSITY: ${gpt5Verbosity}`);
      modified = true;
    }
  }

  // Write back if modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ ${fileName} updated`);
  } else {
    console.log(`  ℹ️  No changes needed for ${fileName}`);
  }
}

// Process both environment files
console.log('🔧 Processing environment files...');
console.log(`📋 Environment variables:`);
console.log(`  - OPENAI_API_KEY: ${apiKey ? '✅ Found' : '❌ Not set'}`);
console.log(`  - OPENAI_MODEL: ${model}`);
console.log(`  - OPENAI_BASE_URL: ${baseUrl || '(empty)'}`);
console.log(`  - GPT5_REASONING_EFFORT: ${gpt5ReasoningEffort}`);
console.log(`  - GPT5_VERBOSITY: ${gpt5Verbosity}`);

processEnvFile(envDevPath, 'environment.ts');
processEnvFile(envProdPath, 'environment.prod.ts');

console.log('\n✅ Environment processing complete');

if (!apiKey) {
  console.log('\n⚠️  Warning: OPENAI_API_KEY not found in environment variables');
  console.log('💡 Set it with: set OPENAI_API_KEY=sk-your-key-here (Windows)');
  console.log('💡 Or edit the environment files directly');
}
