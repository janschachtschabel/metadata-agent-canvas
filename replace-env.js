#!/usr/bin/env node

/**
 * Replace environment variables in environment.prod.ts at build time
 * Used by Vercel to inject OPENAI_API_KEY from environment variables
 */

const fs = require('fs');
const path = require('path');

const envProdPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');

// Read the file
let content = fs.readFileSync(envProdPath, 'utf8');

// Replace API Key placeholder with environment variable
const apiKey = process.env.OPENAI_API_KEY || '';

if (apiKey) {
  console.log('✅ Injecting OPENAI_API_KEY into environment.prod.ts');
  content = content.replace(
    /apiKey:\s*'',\s*\/\/.*$/m,
    `apiKey: '${apiKey}', // Injected from Vercel environment variable`
  );
} else {
  console.log('⚠️  No OPENAI_API_KEY found in environment variables');
  console.log('💡 User will be prompted for API key at runtime');
}

// Write back
fs.writeFileSync(envProdPath, content, 'utf8');

console.log('✅ Environment variables processed');
