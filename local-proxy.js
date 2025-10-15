#!/usr/bin/env node

/**
 * Local development proxy for OpenAI API
 * Solves CORS issues by proxying requests from browser to OpenAI
 * 
 * Usage: node local-proxy.js
 * Or: npm run proxy
 */

const http = require('http');
const https = require('https');

const PORT = 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Check if API key is provided
if (!OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY environment variable is not set!');
  console.error('');
  console.error('Please set it before starting the proxy:');
  console.error('');
  console.error('Windows (PowerShell):');
  console.error('  $env:OPENAI_API_KEY="sk-proj-..."');
  console.error('');
  console.error('Windows (CMD):');
  console.error('  set OPENAI_API_KEY=sk-proj-...');
  console.error('');
  console.error('Linux/Mac:');
  console.error('  export OPENAI_API_KEY=sk-proj-...');
  console.error('');
  console.error('Or configure it in src/environments/environment.ts (recommended for local development)');
  process.exit(1);
}

console.log('🚀 Starting local OpenAI proxy server...');
console.log(`📡 Proxy listening on: http://localhost:${PORT}`);
console.log(`🔑 Using API Key: ${OPENAI_API_KEY.substring(0, 20)}...`);
console.log('');
console.log('💡 Configure your app to use: http://localhost:3001/v1/chat/completions');
console.log('');

const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Collect request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      // Parse request
      const requestData = JSON.parse(body);
      
      console.log(`📤 Proxying request to OpenAI API...`);
      console.log(`   Model: ${requestData.model || 'default'}`);
      console.log(`   Messages: ${requestData.messages?.length || 0}`);

      // Prepare OpenAI request
      const postData = JSON.stringify(requestData);
      
      const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      // Forward request to OpenAI
      const proxyReq = https.request(options, (proxyRes) => {
        let responseBody = '';

        proxyRes.on('data', (chunk) => {
          responseBody += chunk;
        });

        proxyRes.on('end', () => {
          console.log(`✅ Response received from OpenAI (${proxyRes.statusCode})`);
          
          // Send response back to browser with CORS headers
          res.writeHead(proxyRes.statusCode || 200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          });
          res.end(responseBody);
        });
      });

      proxyReq.on('error', (error) => {
        console.error('❌ Proxy error:', error.message);
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ error: 'Proxy error', message: error.message }));
      });

      // Send request to OpenAI
      proxyReq.write(postData);
      proxyReq.end();

    } catch (error) {
      console.error('❌ Error parsing request:', error.message);
      res.writeHead(400, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ error: 'Invalid request', message: error.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log('✅ Proxy server ready!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Keep this terminal running');
  console.log('   2. In another terminal: npm start');
  console.log('   3. App will use this proxy automatically');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down proxy server...');
  server.close(() => {
    console.log('✅ Proxy server stopped');
    process.exit(0);
  });
});
