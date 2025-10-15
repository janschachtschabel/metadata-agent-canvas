/**
 * Netlify Function: OpenAI API Proxy
 * Handles OpenAI API requests from the browser
 * API Key is stored in Netlify Environment Variables (secure)
 */

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OPENAI_API_KEY not set in Netlify environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API key not configured',
          message: 'Please set OPENAI_API_KEY in Netlify Dashboard → Site Settings → Environment Variables'
        }),
      };
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { messages, model, temperature, modelKwargs } = body;

    // Build OpenAI API request
    const openaiRequest = {
      model: model || 'gpt-4.1-mini',
      messages: messages,
      temperature: temperature !== undefined ? temperature : 0.3,
    };

    // Add GPT-5 or other model-specific parameters
    if (modelKwargs) {
      if (modelKwargs.reasoning_effort) {
        openaiRequest.reasoning_effort = modelKwargs.reasoning_effort;
      }
      if (modelKwargs.response_format) {
        openaiRequest.response_format = modelKwargs.response_format;
      }
    }

    console.log(`Proxying request to OpenAI API (Model: ${openaiRequest.model})`);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(openaiRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'OpenAI API error', 
          status: response.status,
          message: errorText
        }),
      };
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      }),
    };
  }
};
