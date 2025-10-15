import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface OpenAIMessage {
  role: string;
  content: string;
}

export interface OpenAIRequest {
  messages: OpenAIMessage[];
  model?: string;
  temperature?: number;
  modelKwargs?: any;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class OpenAIProxyService {
  private proxyUrl: string;
  private useDirectAccess: boolean;

  constructor() {
    // Use Netlify Function in production, or allow custom proxy URL
    this.proxyUrl = environment.openai.proxyUrl || '/.netlify/functions/openai-proxy';
    
    // In development mode, use direct OpenAI API access (no proxy needed)
    // In production (Netlify), use proxy for security
    this.useDirectAccess = !environment.production && !!environment.openai.apiKey;
    
    if (this.useDirectAccess) {
      console.log('🔧 Development mode: Using direct OpenAI API access (no proxy)');
    } else {
      console.log('🚀 Production mode: Using Netlify Function proxy');
    }
  }

  async invoke(messages: OpenAIMessage[]): Promise<OpenAIResponse> {
    // Development mode: Direct API access
    if (this.useDirectAccess) {
      return this.invokeDirectly(messages);
    }
    
    // Production mode: Via Netlify Function proxy
    return this.invokeViaProxy(messages);
  }

  /**
   * Call OpenAI API directly (development mode only)
   * Uses local proxy server to avoid CORS issues
   */
  private async invokeDirectly(messages: OpenAIMessage[]): Promise<OpenAIResponse> {
    const requestBody: any = {
      messages,
      model: environment.openai.model,
      temperature: environment.openai.temperature,
    };

    // Add GPT-5 specific settings if applicable
    if (environment.openai.model.startsWith('gpt-5')) {
      requestBody.reasoning_effort = environment.openai.gpt5.reasoningEffort;
      requestBody.response_format = {
        type: 'text',
        verbosity: environment.openai.gpt5.verbosity
      };
    }

    // Use local proxy server in development (runs on port 3001)
    // This avoids CORS issues while keeping development simple
    const apiUrl = environment.openai.baseUrl || 'http://localhost:3001/v1/chat/completions';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Authorization header not needed - local proxy handles it
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Call OpenAI API via Netlify Function proxy (production mode)
   */
  private async invokeViaProxy(messages: OpenAIMessage[]): Promise<OpenAIResponse> {
    const requestBody: OpenAIRequest = {
      messages,
      model: environment.openai.model,
      temperature: environment.openai.temperature,
    };

    // Add GPT-5 specific settings if applicable
    if (environment.openai.model.startsWith('gpt-5')) {
      requestBody.modelKwargs = {
        reasoning_effort: environment.openai.gpt5.reasoningEffort,
        response_format: {
          type: 'text',
          verbosity: environment.openai.gpt5.verbosity
        }
      };
    }

    const response = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI proxy error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }
}
