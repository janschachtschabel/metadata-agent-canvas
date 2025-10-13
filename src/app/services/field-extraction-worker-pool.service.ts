import { Injectable } from '@angular/core';
import { ChatOpenAI } from '@langchain/openai';
import { CanvasFieldState, ExtractionResult, FieldExtractionTask } from '../models/canvas-models';
import { environment } from '../../environments/environment';

interface WorkerTask {
  task: FieldExtractionTask;
  resolve: (result: ExtractionResult) => void;
  reject: (error: any) => void;
}

@Injectable({
  providedIn: 'root'
})
export class FieldExtractionWorkerPoolService {
  private maxWorkers = 10;
  private activeWorkers = 0;
  private queue: WorkerTask[] = [];
  private llm: ChatOpenAI;

  constructor() {
    // Initialize LLM with environment settings
    const config: any = {
      model: environment.openai.model,
      temperature: environment.openai.temperature,
      apiKey: environment.openai.apiKey,
      timeout: environment.canvas.timeout
    };

    // Add baseUrl if configured
    if (environment.openai.baseUrl) {
      config.configuration = {
        baseURL: environment.openai.baseUrl
      };
    }

    // Add GPT-5 specific settings if model starts with 'gpt-5'
    if (environment.openai.model.startsWith('gpt-5')) {
      config.modelKwargs = {
        reasoning_effort: environment.openai.gpt5.reasoningEffort,
        response_format: {
          type: 'text',
          verbosity: environment.openai.gpt5.verbosity
        }
      };
    }

    this.llm = new ChatOpenAI(config);
    
    // Set max workers from environment
    this.maxWorkers = environment.canvas.maxWorkers;
  }

  /**
   * Set maximum parallel workers
   */
  setMaxWorkers(max: number): void {
    this.maxWorkers = max;
  }

  /**
   * Extract a single field with worker pool management
   */
  async extractField(task: FieldExtractionTask): Promise<ExtractionResult> {
    return new Promise((resolve, reject) => {
      const workerTask: WorkerTask = { task, resolve, reject };
      
      // Add to queue
      this.queue.push(workerTask);
      
      // Sort queue by priority (required fields first)
      this.queue.sort((a, b) => b.task.priority - a.task.priority);
      
      // Process queue
      this.processQueue();
    });
  }

  /**
   * Process the extraction queue
   */
  private async processQueue(): Promise<void> {
    // Check if we can start a new worker
    if (this.activeWorkers >= this.maxWorkers || this.queue.length === 0) {
      return;
    }

    // Get next task
    const workerTask = this.queue.shift();
    if (!workerTask) return;

    this.activeWorkers++;

    try {
      const result = await this.performExtraction(workerTask.task);
      workerTask.resolve(result);
    } catch (error) {
      workerTask.reject(error);
    } finally {
      this.activeWorkers--;
      // Continue processing queue
      this.processQueue();
    }
  }

  /**
   * Perform the actual field extraction
   */
  private async performExtraction(task: FieldExtractionTask): Promise<ExtractionResult> {
    const { field, userText } = task;

    try {
      // Build extraction prompt
      const prompt = this.buildExtractionPrompt(field, userText);

      console.log(`🔍 Extracting field: ${field.label} (${field.fieldId})`);

      // Call LLM
      const response = await this.llm.invoke([
        { role: 'user', content: prompt }
      ]);

      const content = response.content.toString().trim();
      console.log(`📝 LLM Response for ${field.label}: "${content}"`);

      // Parse JSON response
      const value = this.parseJsonResponse(content, field);

      // Calculate confidence (simplified for now)
      const confidence = value !== null ? 0.85 : 0.0;

      if (value !== null) {
        console.log(`✅ Extracted ${field.label}: ${JSON.stringify(value)}`);
      } else {
        console.log(`⚪ No value found for ${field.label}`);
      }

      return {
        fieldId: field.fieldId,
        value: value,
        confidence: confidence
      };
    } catch (error) {
      console.error(`❌ Extraction error for field ${field.fieldId} (${field.label}):`, error);
      return {
        fieldId: field.fieldId,
        value: null,
        confidence: 0.0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build extraction prompt for a single field
   */
  private buildExtractionPrompt(field: CanvasFieldState, userText: string): string {
    let prompt = `Extrahiere folgendes Metadatenfeld aus dem Text:\n\n`;
    prompt += `Text: "${userText}"\n\n`;
    prompt += `Feld: ${field.fieldId} (${field.label})\n`;
    
    if (field.description) {
      prompt += `Beschreibung: ${field.description}\n`;
    }
    
    prompt += `Typ: ${field.datatype}\n`;
    
    if (field.multiple) {
      prompt += `Hinweis: Mehrere Werte möglich (Array)\n`;
    }

    if (field.vocabulary && field.vocabulary.concepts.length > 0) {
      prompt += `\nErlaubte Werte:\n`;
      field.vocabulary.concepts.forEach(concept => {
        prompt += `- ${concept.label}`;
        if (concept.altLabels && concept.altLabels.length > 0) {
          prompt += ` (auch: ${concept.altLabels.join(', ')})`;
        }
        prompt += `\n`;
      });
    }

    prompt += `\nAntworte NUR mit einem JSON-Objekt im Format: {"${field.fieldId}": <wert>}\n`;
    prompt += `Verwende null wenn der Wert nicht extrahierbar ist.\n`;
    
    if (field.multiple || field.datatype === 'array') {
      prompt += `Für mehrere Werte verwende ein Array: {"${field.fieldId}": ["Wert1", "Wert2"]}\n`;
    }
    
    if (field.vocabulary && field.vocabulary.concepts.length > 0) {
      prompt += `WICHTIG: Verwende NUR die exakten Labels aus der Liste oben!\n`;
    }

    return prompt;
  }

  /**
   * Parse JSON response from LLM
   */
  private parseJsonResponse(content: string, field: CanvasFieldState): any {
    try {
      // Extract JSON object from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        let value = result[field.fieldId];
        
        console.log(`🔍 Parsing ${field.fieldId}: Raw value from LLM:`, value, 'Type:', typeof value, 'IsArray:', Array.isArray(value));
        
        // Return null if explicitly null or undefined
        if (value === null || value === undefined) {
          console.log(`⚪ ${field.fieldId}: LLM returned null/undefined`);
          return null;
        }
        
        // Handle nested objects (e.g., price: { amount: 120, currency: "EUR" })
        if (typeof value === 'object' && !Array.isArray(value)) {
          // If it's an object, flatten it to comma-separated string or extract specific field
          if ('amount' in value && 'currency' in value) {
            // Price object
            value = `${value.amount} ${value.currency}`;
            console.log(`💰 ${field.fieldId}: Flattened price object to:`, value);
          } else {
            // General object - convert to string representation
            const stringValue = Object.entries(value)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ');
            value = stringValue || null;
            console.log(`🔧 ${field.fieldId}: Flattened object to:`, value);
          }
        }
        
        // Handle empty arrays
        if (Array.isArray(value) && value.length === 0) {
          console.log(`⚪ ${field.fieldId}: Empty array returned`);
          return null;
        }
        
        // Handle arrays with nested objects
        if (Array.isArray(value)) {
          value = value.map(item => {
            if (typeof item === 'object' && item !== null) {
              // Flatten nested object
              if ('amount' in item && 'currency' in item) {
                return `${item.amount} ${item.currency}`;
              }
              return Object.entries(item)
                .map(([k, v]) => String(v))
                .join(', ');
            }
            return item;
          });
          console.log(`📋 ${field.fieldId}: Flattened array objects:`, value);
        }
        
        // Ensure arrays for multiple fields
        if (field.multiple && !Array.isArray(value)) {
          if (typeof value === 'string' && value.trim() !== '') {
            value = [value];
            console.log(`📋 ${field.fieldId}: Converted string to array:`, value);
          } else {
            console.log(`⚪ ${field.fieldId}: Cannot convert to array`);
            return null;
          }
        }
        
        // Clean array values - remove empty strings
        if (Array.isArray(value)) {
          value = value.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
          if (value.length === 0) {
            console.log(`⚪ ${field.fieldId}: Array is empty after filtering`);
            return null;
          }
          console.log(`📋 ${field.fieldId}: Cleaned array:`, value);
        }
        
        // Validate final value
        if (typeof value === 'string' && value.trim() === '') {
          console.log(`⚪ ${field.fieldId}: Empty string, returning null`);
          return null;
        }
        
        console.log(`✅ ${field.fieldId}: Final parsed value:`, value);
        return value;
      }
    } catch (error) {
      console.error(`❌ Failed to parse JSON response for ${field.fieldId}:`, error);
    }
    
    // Fallback to simple text parsing
    console.log(`🔄 ${field.fieldId}: Falling back to text parsing`);
    return this.parseExtractionResponse(content, field);
  }

  /**
   * Parse LLM response into field value (fallback)
   */
  private parseExtractionResponse(content: string, field: CanvasFieldState): any {
    if (content === 'null' || content === '' || content.toLowerCase() === 'nicht gefunden') {
      return null;
    }

    // Array fields
    if (field.datatype === 'array') {
      return content.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }

    // URI validation
    if (field.datatype === 'uri' && field.validation?.pattern) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(content)) {
        return null;
      }
    }

    // Vocabulary mapping
    if (field.vocabulary) {
      const concept = field.vocabulary.concepts.find(c => 
        c.label.toLowerCase() === content.toLowerCase() ||
        c.altLabels?.some(alt => alt.toLowerCase() === content.toLowerCase())
      );
      
      if (concept) {
        // Return URI if available, otherwise label
        return concept.uri || concept.label;
      }
    }

    return content;
  }

  /**
   * Get current queue status
   */
  getStatus(): { activeWorkers: number; queueLength: number } {
    return {
      activeWorkers: this.activeWorkers,
      queueLength: this.queue.length
    };
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.queue = [];
  }
}
