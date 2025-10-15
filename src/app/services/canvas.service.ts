import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CanvasState, CanvasFieldState, FieldStatus, FieldGroup, FieldExtractionTask, ExtractionResult } from '../models/canvas-models';
import { SchemaLoaderService } from './schema-loader.service';
import { FieldExtractionWorkerPoolService } from './field-extraction-worker-pool.service';
import { FieldNormalizerService } from './field-normalizer.service';
import { OpenAIProxyService } from './openai-proxy.service';
import { ShapeExpanderService } from './shape-expander.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  private stateSubject = new BehaviorSubject<CanvasState>(this.getInitialState());
  public state$: Observable<CanvasState> = this.stateSubject.asObservable();

  constructor(
    private schemaLoader: SchemaLoaderService,
    private workerPool: FieldExtractionWorkerPoolService,
    private fieldNormalizer: FieldNormalizerService,
    private openaiProxy: OpenAIProxyService,
    private shapeExpander: ShapeExpanderService
  ) {
    // Configure worker pool
    this.workerPool.setMaxWorkers(environment.canvas.maxWorkers);
  }

  /**
   * Get initial state
   */
  private getInitialState(): CanvasState {
    return {
      userText: '',
      detectedContentType: null,
      contentTypeConfidence: 0,
      selectedContentType: null,
      coreFields: [],
      specialFields: [],
      fieldGroups: [],
      isExtracting: false,
      extractionProgress: 0,
      totalFields: 0,
      filledFields: 0,
      metadata: {}
    };
  }

  /**
   * Get current state value
   */
  getCurrentState(): CanvasState {
    return this.stateSubject.value;
  }

  /**
   * Update state
   */
  private updateState(partial: Partial<CanvasState>): void {
    const current = this.getCurrentState();
    this.stateSubject.next({ ...current, ...partial });
  }

  /**
   * Start extraction process
   */
  async startExtraction(userText: string): Promise<void> {
    console.log('🚀 Starting canvas extraction...');

    // Update state
    this.updateState({
      userText: userText,
      isExtracting: true,
      extractionProgress: 0
    });

    try {
      // Step 1: Load core schema and initialize fields
      await this.initializeCoreFields();

      // Step 2: FIRST detect content type (wichtig!)
      await this.detectContentType(userText);

      // Step 3: Load special schema if detected
      const stateAfterDetection = this.getCurrentState();
      if (stateAfterDetection.detectedContentType) {
        await this.loadSpecialSchema(stateAfterDetection.detectedContentType);
        
        // Fill content type field
        this.fillContentTypeField(stateAfterDetection.detectedContentType);
      }

      // Step 4: NOW extract all fields in parallel
      const state = this.getCurrentState();
      await Promise.all([
        this.extractCoreFields(userText),
        state.specialFields.length > 0 ? this.extractSpecialFields(userText) : Promise.resolve()
      ]);

      console.log('✅ Canvas extraction complete');
    } catch (error) {
      console.error('❌ Canvas extraction error:', error);
    } finally {
      this.updateState({ isExtracting: false });
    }
  }

  /**
   * Initialize core fields from schema
   */
  private async initializeCoreFields(): Promise<void> {
    const coreSchemaFields = await this.schemaLoader.getFields('core.json').toPromise();
    if (!coreSchemaFields) return;

    const groups = await this.schemaLoader.getGroups('core.json').toPromise();
    const groupMap = new Map(groups?.map((g: any) => [g.id, g.label]) || []);
    const groupOrderMap = new Map(groups?.map((g: any, index: number) => [g.id, index]) || []);
    
    console.log('📚 Loaded Core groups:', groups);
    console.log('📚 GroupMap:', Array.from(groupMap.entries()));
    console.log('📚 GroupOrderMap:', Array.from(groupOrderMap.entries()));

    const coreFields: CanvasFieldState[] = coreSchemaFields
      .filter((field: any) => {
        // Only AI-fillable fields that should be shown to user
        return field.system?.ai_fillable !== false && field.system?.ask_user !== false;
      })
      .map((field: any) => {
        const groupId = field.group || 'other';
        // Priorität: 1. field.group_label, 2. groupMap lookup, 3. 'Sonstige'
        const groupLabel = field.group_label || groupMap.get(groupId) || 'Sonstige';
        const groupOrder = groupOrderMap.get(groupId) ?? 999;
        
        console.log(`🔍 Field ${field.id}: group="${groupId}", group_label="${field.group_label}", resolved="${groupLabel}", order=${groupOrder}`);
        
        return {
          fieldId: field.id,
          uri: field.system?.uri || field.id,
          group: groupId,
          groupLabel: String(groupLabel),
          groupOrder: groupOrder,
          schemaName: 'Core',
          aiFillable: field.system?.ai_fillable !== false,
          label: field.prompt?.label || field.label || field.id,
          description: field.prompt?.description || '',
          value: field.system?.multiple ? [] : null,
          status: FieldStatus.EMPTY,
          confidence: 0,
          isRequired: field.system?.required || field.required || false,
          datatype: field.system?.datatype || field.type || 'string',
          multiple: field.system?.multiple || false,
          vocabulary: field.system?.vocabulary ? {
            type: (field.system.vocabulary.type === 'closed' || field.system.vocabulary.type === 'skos') 
              ? field.system.vocabulary.type 
              : 'closed',
            concepts: field.system.vocabulary.concepts || []
          } : undefined,
          validation: field.system?.validation,
          shape: field.system?.items?.shape,  // Extract complex object structure
          examples: field.prompt?.examples  // Extract examples from prompt section
        };
      });

    // Group fields
    const fieldGroups = this.groupFields(coreFields);
    // Initialize metadata template
    const template = await this.schemaLoader.getOutputTemplate('core.json').toPromise();

    this.updateState({
      coreFields: coreFields,
      fieldGroups: fieldGroups,
      totalFields: coreFields.length,
      metadata: template || {}
    });
  }

  /**
   * Fill content type field with detected value
   */
  private fillContentTypeField(schemaFile: string): void {
    const state = this.getCurrentState();
    const contentTypeField = state.coreFields.find(f => f.fieldId === 'ccm:oeh_flex_lrt');
    
    if (!contentTypeField || !contentTypeField.vocabulary) {
      return;
    }

    // Find the matching concept
    const concept = contentTypeField.vocabulary.concepts.find(c => c.schema_file === schemaFile);
    
    if (concept) {
      const value = concept.uri || concept.label;
      this.updateFieldStatus('ccm:oeh_flex_lrt', FieldStatus.FILLED, value, state.contentTypeConfidence);
      this.updateMetadata('ccm:oeh_flex_lrt', value);
      console.log(`✅ Content type field filled: ${concept.label}`);
    }
  }

  /**
   * Detect content type in background
   */
  private async detectContentType(userText: string): Promise<void> {
    try {
      const concepts = this.schemaLoader.getContentTypeConcepts()
        .filter(concept => !!concept.schema_file);

      let schemaList: string;

      if (concepts.length > 0) {
        schemaList = concepts.map((concept, index) => {
          const description = concept.description
            ? ` – ${concept.description}`
            : '';
          return `${index + 1}. ${concept.label}${description}\n   Schema-Datei: ${concept.schema_file}`;
        }).join('\n\n');
      } else {
        const availableSchemas = this.schemaLoader.getAvailableSpecialSchemas();
        schemaList = availableSchemas.map((s: string, i: number) =>
          `${i + 1}. ${this.schemaLoader.getContentTypeLabel(s)} (${s})`
        ).join('\n');
      }

      const prompt = 
        `Analysiere folgenden Text und bestimme die passendste Inhaltsart. Nutze die Beschreibungen, um die programmatische Bedeutung zu verstehen.\n\n` +
        `Text: "${userText}"\n\n` +
        `Verfügbare Inhaltsarten:\n${schemaList}\n\n` +
        `Antworte NUR mit einem JSON-Objekt im Format:\n` +
        `{"schema": "<dateiname>.json", "confidence": <0.0-1.0>}\n\n` +
        `Beispiel: {"schema": "event.json", "confidence": 0.92}\n` +
        `Wenn keine passt: {"schema": "none", "confidence": 0.0}`;

      const response = await this.openaiProxy.invoke([
        { role: 'user', content: prompt }
      ]);

      const content = response.choices[0].message.content.trim();
      const jsonMatch = content.match(/\{[^}]+\}/);
      
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        
        if (result.schema !== 'none' && result.confidence > 0.5) {
          this.updateState({
            detectedContentType: result.schema,
            contentTypeConfidence: result.confidence,
            selectedContentType: result.schema
          });
          
          console.log(`📋 Content type detected: ${result.schema} (${Math.round(result.confidence * 100)}%)`);
        }
      }
    } catch (error) {
      console.error('Content type detection error:', error);
    }
  }

  /**
   * Extract core fields in parallel
   */
  private async extractCoreFields(userText: string): Promise<void> {
    const state = this.getCurrentState();
    const tasks: FieldExtractionTask[] = state.coreFields
      .filter(f => f.fieldId !== 'ccm:oeh_flex_lrt') // Skip content type field - will be filled by detection
      .map(field => ({
        field: field,
        userText: userText,
        priority: field.isRequired ? 10 : 5
      }));

    console.log(`⚡ Extracting ${tasks.length} core fields in parallel...`);

    const promises = tasks.map(task => this.extractSingleField(task));
    await Promise.all(promises);
  }

  /**
   * Load special schema
   */
  private async loadSpecialSchema(schemaFile: string): Promise<void> {
    console.log(`📥 Loading special schema: ${schemaFile}`);

    const specialSchemaFields = await this.schemaLoader.getFields(schemaFile).toPromise();
    if (!specialSchemaFields) return;

    const groups = await this.schemaLoader.getGroups(schemaFile).toPromise();
    const groupMap = new Map(groups?.map((g: any) => [g.id, g.label]) || []);
    const groupOrderMap = new Map(groups?.map((g: any, index: number) => [g.id, index]) || []);
    
    console.log(`📚 Loaded ${schemaFile} groups:`, groups);
    console.log(`📚 GroupMap for ${schemaFile}:`, Array.from(groupMap.entries()));
    console.log(`📚 GroupOrderMap for ${schemaFile}:`, Array.from(groupOrderMap.entries()));

    const schemaName = schemaFile.replace('.json', '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const specialFields: CanvasFieldState[] = specialSchemaFields
      .filter((field: any) => {
        // Only AI-fillable fields that should be shown to user
        return field.system?.ai_fillable !== false && field.system?.ask_user !== false;
      })
      .map((field: any) => {
        const groupId = field.group || 'other';
        // Priorität: 1. field.group_label, 2. groupMap lookup, 3. 'Sonstige'
        const groupLabel = field.group_label || groupMap.get(groupId) || 'Sonstige';
        const groupOrder = groupOrderMap.get(groupId) ?? 999;
        
        console.log(`🔍 ${schemaFile} Field ${field.id}: group="${groupId}", group_label="${field.group_label}", resolved="${groupLabel}", order=${groupOrder}`);
        
        return {
          fieldId: field.id,
          uri: field.system?.uri || field.id,
          group: groupId,
          groupLabel: String(groupLabel),
          groupOrder: groupOrder,
          schemaName: schemaName,
          aiFillable: field.system?.ai_fillable !== false,
          label: field.prompt?.label || field.label || field.id,
          description: field.prompt?.description || '',
          value: field.system?.multiple ? [] : null,
          status: FieldStatus.EMPTY,
          confidence: 0,
          isRequired: field.system?.required || field.required || false,
          datatype: field.system?.datatype || field.type || 'string',
          multiple: field.system?.multiple || false,
          vocabulary: field.system?.vocabulary ? {
            type: (field.system.vocabulary.type === 'closed' || field.system.vocabulary.type === 'skos') 
              ? field.system.vocabulary.type 
              : 'closed',
            concepts: field.system.vocabulary.concepts || []
          } : undefined,
          validation: field.system?.validation,
          shape: field.system?.items?.shape,  // Extract complex object structure
          examples: field.prompt?.examples  // Extract examples from prompt section
        };
      });

    const state = this.getCurrentState();
    const allFields = [...state.coreFields, ...specialFields];
    const fieldGroups = this.groupFields(allFields);

    // Merge template
    const template = await this.schemaLoader.getOutputTemplate(schemaFile).toPromise();
    const mergedMetadata = { ...state.metadata, ...template };

    this.updateState({
      specialFields: specialFields,
      fieldGroups: fieldGroups,
      totalFields: allFields.length,
      metadata: mergedMetadata
    });
  }

  /**
   * Extract special fields in parallel
   */
  private async extractSpecialFields(userText: string): Promise<void> {
    const state = this.getCurrentState();
    const tasks: FieldExtractionTask[] = state.specialFields.map(field => ({
      field: field,
      userText: userText,
      priority: field.isRequired ? 10 : 5
    }));

    console.log(`⚡ Extracting ${tasks.length} special fields in parallel...`);

    const promises = tasks.map(task => this.extractSingleField(task));
    await Promise.all(promises);
  }

  /**
   * Extract single field
   */
  private async extractSingleField(task: FieldExtractionTask): Promise<void> {
    this.updateFieldStatus(task.field.fieldId, FieldStatus.EXTRACTING);

    try {
      const result = await this.workerPool.extractField(task);

      if (result.error) {
        this.updateFieldStatus(
          result.fieldId,
          FieldStatus.ERROR,
          null,
          0,
          result.error
        );
      } else {
        // Check if value is actually filled
        const isFilled = this.isValueFilled(result.value);
        const status = isFilled ? FieldStatus.FILLED : FieldStatus.EMPTY;
        
        this.updateFieldStatus(
          result.fieldId,
          status,
          result.value,
          result.confidence
        );
        
        if (isFilled) {
          this.updateMetadata(result.fieldId, result.value);
          
          // Create sub-fields for fields with shape (complex objects)
          if (task.field.shape) {
            console.log(`🏗️ Creating sub-fields for ${result.fieldId} (has shape)`);
            const subFields = this.shapeExpander.expandFieldWithShape(task.field, result.value);
            
            if (subFields.length > 0) {
              // Mark parent as having sub-fields
              const state = this.getCurrentState();
              const parentField = [...state.coreFields, ...state.specialFields]
                .find(f => f.fieldId === result.fieldId);
              
              if (parentField) {
                parentField.isParent = true;
                parentField.subFields = subFields;
              }
              
              // Add sub-fields to the appropriate list
              const isCore = state.coreFields.some(f => f.fieldId === result.fieldId);
              if (isCore) {
                this.updateState({
                  coreFields: [...state.coreFields]
                });
              } else {
                this.updateState({
                  specialFields: [...state.specialFields]
                });
              }
              
              console.log(`✅ Created ${subFields.length} sub-fields for ${result.fieldId}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Field extraction error for ${task.field.fieldId}:`, error);
      this.updateFieldStatus(task.field.fieldId, FieldStatus.ERROR, null, 0, 'Extraction failed');
    }
  }

  /**
   * Check if a value is actually filled (not null, empty string, or empty array)
   */
  private isValueFilled(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    
    if (typeof value === 'string' && value.trim() === '') {
      return false;
    }
    
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    
    if (Array.isArray(value)) {
      // Check if all array elements are empty
      return value.some(v => v !== null && v !== undefined && v.toString().trim() !== '');
    }
    
    return true;
  }

  /**
   * Update field status
   */
  private updateFieldStatus(
    fieldId: string, 
    status: FieldStatus, 
    value?: any, 
    confidence?: number,
    error?: string
  ): void {
    const state = this.getCurrentState();
    
    // Create NEW arrays with updated field (wichtig für Change Detection!)
    const updatedCoreFields = state.coreFields.map(f => {
      if (f.fieldId === fieldId) {
        const updated = { ...f };  // Clone field
        updated.status = status;
        if (value !== undefined) updated.value = value;
        if (confidence !== undefined) updated.confidence = confidence;
        if (error) updated.extractionError = error;
        console.log(`🔄 Updated field ${fieldId}:`, { status, value, confidence });
        return updated;
      }
      return f;
    });

    const updatedSpecialFields = state.specialFields.map(f => {
      if (f.fieldId === fieldId) {
        const updated = { ...f };  // Clone field
        updated.status = status;
        if (value !== undefined) updated.value = value;
        if (confidence !== undefined) updated.confidence = confidence;
        if (error) updated.extractionError = error;
        console.log(`🔄 Updated field ${fieldId}:`, { status, value, confidence });
        return updated;
      }
      return f;
    });

    const allFields = [...updatedCoreFields, ...updatedSpecialFields];
    
    // Recalculate filled fields
    const filledFields = allFields.filter(f => f.status === FieldStatus.FILLED).length;
    const extractionProgress = (filledFields / state.totalFields) * 100;

    // Regroup fields
    const fieldGroups = this.groupFields(allFields);

    this.updateState({
      coreFields: updatedCoreFields,  // NEUE Arrays!
      specialFields: updatedSpecialFields,
      fieldGroups: fieldGroups,
      filledFields: filledFields,
      extractionProgress: extractionProgress
    });
  }

  /**
   * Update metadata object
   */
  private updateMetadata(fieldId: string, value: any): void {
    const state = this.getCurrentState();
    const metadata = { ...state.metadata };
    metadata[fieldId] = value;
    this.updateState({ metadata: metadata });
  }

  /**
   * Group fields by schema AND group (separate Core-Basic from Event-Basic)
   */
  private groupFields(fields: CanvasFieldState[]): FieldGroup[] {
    const groups = new Map<string, FieldGroup & { order: number }>();

    fields.forEach(field => {
      const schemaName = field.schemaName || 'Core';
      const groupId = field.group || 'other';
      const groupLabel = field.groupLabel || 'Sonstige';
      const groupOrder = field.groupOrder ?? 999;
      
      // WICHTIG: Key ist Schema + Group, damit Core-Basic ≠ Event-Basic
      const groupKey = `${schemaName}::${groupId}`;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: groupId,
          label: groupLabel,
          schemaName: schemaName,
          fields: [],
          order: groupOrder  // Use order from field
        });
      }
      
      groups.get(groupKey)!.fields.push(field);
    });

    // Sortierung
    const result = Array.from(groups.values())
      .filter(g => g.fields.length > 0)  // Nur Gruppen mit Feldern anzeigen
      .sort((a, b) => {
        // Core immer zuerst
        if (a.schemaName === 'Core' && b.schemaName !== 'Core') return -1;
        if (a.schemaName !== 'Core' && b.schemaName === 'Core') return 1;
        
        // Dann alphabetisch nach Schema
        if (a.schemaName !== b.schemaName) {
          return a.schemaName.localeCompare(b.schemaName);
        }
        
        // Innerhalb eines Schemas: Nach order-Index (aus groups-Array)
        return a.order - b.order;
      });
    
    console.log('📦 Created field groups (sorted by schema + order):');
    result.forEach((g, index) => {
      console.log(`  ${index + 1}. ${g.label} (${g.schemaName}, order=${g.order}) - ${g.fields.length} fields: ${g.fields.map(f => f.fieldId).join(', ')}`);
    });
    
    return result;
  }

  /**
   * User manually changes a field value
   */
  updateFieldValue(fieldId: string, value: any): void {
    console.log(`📝 updateFieldValue called for ${fieldId}:`, value);
    
    // Special handling for content type change (needs immediate update)
    if (fieldId === 'ccm:oeh_flex_lrt') {
      this.updateFieldStatus(fieldId, FieldStatus.FILLED, value, 1.0);
      this.updateMetadata(fieldId, value);
      this.onContentTypeChange(value);
      return;
    }
    
    // For other fields: Normalize FIRST, then update
    // This ensures the user sees the corrected value immediately
    this.normalizeFieldValue(fieldId, value);
  }

  /**
   * Normalize and re-classify a field value
   */
  private normalizeFieldValue(fieldId: string, value: any): void {
    const state = this.getCurrentState();
    const field = [...state.coreFields, ...state.specialFields].find(f => f.fieldId === fieldId);
    
    if (!field) {
      console.warn(`⚠️ Field not found for normalization: ${fieldId}`);
      return;
    }

    console.log(`👤 User updated field ${fieldId}:`, {
      value,
      datatype: field.datatype,
      hasVocabulary: !!field.vocabulary,
      vocabularyType: field.vocabulary?.type,
      hasShape: !!field.shape
    });

    // Skip normalization for structured fields (fields with shape definition)
    // These should keep their object structure intact
    if (field.shape || field.datatype === 'object') {
      console.log(`🏗️ Skipping normalization for structured field ${fieldId} (has shape or is object type)`);
      const newStatus = (value === null || (Array.isArray(value) && value.length === 0))
        ? FieldStatus.EMPTY 
        : FieldStatus.FILLED;
      this.updateFieldStatus(fieldId, newStatus, value, 1.0);
      this.updateMetadata(fieldId, value);
      return;
    }

    // Use FieldNormalizerService to normalize/classify the value
    this.fieldNormalizer.normalizeValue(field, value).subscribe({
      next: (normalizedValue: any) => {
        // Handle null/invalid values for controlled vocabularies (closed or skos)
        const isControlled = field.vocabulary?.type === 'closed' || field.vocabulary?.type === 'skos';
        if (normalizedValue === null && isControlled) {
          console.warn(`⚠️ Invalid value rejected for ${field.vocabulary?.type} vocabulary: "${value}"`);
          // Clear the field
          this.updateFieldStatus(fieldId, FieldStatus.EMPTY, null, 0);
          this.updateMetadata(fieldId, null);
          return;
        }
        
        // Determine final status
        const newStatus = (normalizedValue === null || 
                          (Array.isArray(normalizedValue) && normalizedValue.length === 0))
          ? FieldStatus.EMPTY 
          : FieldStatus.FILLED;
        
        // Check if normalization changed the value
        const valueChanged = JSON.stringify(normalizedValue) !== JSON.stringify(value);
        
        if (valueChanged) {
          console.log(`✅ Field ${fieldId} normalized:`, value, '→', normalizedValue);
          
          // Special handling for arrays: Check if items were removed
          if (Array.isArray(value) && Array.isArray(normalizedValue)) {
            if (normalizedValue.length < value.length) {
              const removedItems = value.filter(v => !normalizedValue.includes(v));
              console.warn(`⚠️ Removed invalid items from ${fieldId}:`, removedItems);
            }
          }
        } else {
          console.log(`ℹ️ Field ${fieldId} unchanged after normalization`);
        }
        
        // ALWAYS update the field (even if unchanged) to ensure UI consistency
        this.updateFieldStatus(fieldId, newStatus, normalizedValue, 1.0);
        this.updateMetadata(fieldId, normalizedValue);
      },
      error: (error: any) => {
        console.error(`❌ Normalization failed for ${fieldId}:`, error);
        // On error: Still update with original value
        this.updateFieldStatus(fieldId, FieldStatus.FILLED, value, 1.0);
        this.updateMetadata(fieldId, value);
      }
    });
  }

  /**
   * Public method to change content type (called from UI)
   */
  async changeContentTypeManually(schemaFile: string): Promise<void> {
    console.log('🔄 Manual content type change requested:', schemaFile);
    
    const state = this.getCurrentState();
    
    // Update selected content type
    this.updateState({ 
      selectedContentType: schemaFile,
      specialFields: [] 
    });
    
    // Reload special schema
    await this.loadSpecialSchema(schemaFile);
    
    // Re-extract special fields if we have user text
    if (state.userText) {
      console.log('🔄 Re-extracting special fields with new schema...');
      await this.extractSpecialFields(state.userText);
    }
    
    console.log('✅ Content type change complete');
  }

  /**
   * Handle content type change (automatic during extraction)
   */
  private async onContentTypeChange(contentType: string | string[]): Promise<void> {
    console.log('🔄 Content type changed:', contentType);

    // Get schema file from vocabulary
    const state = this.getCurrentState();
    const contentTypeField = state.coreFields.find(f => f.fieldId === 'ccm:oeh_flex_lrt');
    
    if (!contentTypeField?.vocabulary) return;

    const selectedType = Array.isArray(contentType) ? contentType[0] : contentType;
    const concept = contentTypeField.vocabulary.concepts.find(c => 
      c.label === selectedType || c.uri === selectedType
    );

    if (concept?.schema_file) {
      // Clear special fields
      this.updateState({ specialFields: [], selectedContentType: concept.schema_file });
      
      // Reload special schema and extract
      await this.loadSpecialSchema(concept.schema_file);
      await this.extractSpecialFields(state.userText);
    }
  }

  /**
   * Get metadata JSON with URI and label information
   * For vocabulary-based fields: returns array of {label, uri} pairs
   * For free-text fields: returns just the value
   */
  getMetadataJson(): string {
    const state = this.getCurrentState();
    const allFields = [...state.coreFields, ...state.specialFields];
    
    // Create a map of fieldId to field object
    const fieldMap = new Map<string, any>();
    allFields.forEach(field => {
      fieldMap.set(field.fieldId, field);
    });
    
    // Build enriched output
    const enrichedOutput: Record<string, any> = {};
    
    Object.keys(state.metadata).forEach(fieldId => {
      const value = state.metadata[fieldId];
      const field = fieldMap.get(fieldId);
      
      if (!field) {
        // Fallback: field not found (shouldn't happen)
        enrichedOutput[fieldId] = value;
        return;
      }
      
      // Check if field has sub-fields (complex object with shape)
      if (field.isParent && field.subFields && field.subFields.length > 0) {
        // Reconstruct structured object from sub-fields
        console.log(`🔧 Reconstructing object for ${fieldId} from ${field.subFields.length} sub-fields`);
        const reconstructedValue = this.shapeExpander.reconstructObjectFromSubFields(field, allFields);
        enrichedOutput[fieldId] = reconstructedValue;
        return;
      }
      
      // Check if field has a vocabulary (controlled values)
      if (field.vocabulary && field.vocabulary.concepts && field.vocabulary.concepts.length > 0) {
        // Field with vocabulary: Map values to {label, uri} pairs
        if (Array.isArray(value)) {
          // Multiple values: map each to {label, uri}
          enrichedOutput[fieldId] = value
            .filter(v => v !== null && v !== undefined && v !== '')
            .map(v => this.mapValueToLabelUri(v, field.vocabulary.concepts));
        } else if (value !== null && value !== undefined && value !== '') {
          // Single value: map to {label, uri}
          enrichedOutput[fieldId] = this.mapValueToLabelUri(value, field.vocabulary.concepts);
        } else {
          // Empty value
          enrichedOutput[fieldId] = field.multiple ? [] : null;
        }
      } else {
        // Field without vocabulary: just use the value as-is
        enrichedOutput[fieldId] = value;
      }
    });
    
    return JSON.stringify(enrichedOutput, null, 2);
  }
  
  /**
   * Map a value (label or URI) to {label, uri} pair from vocabulary concepts
   */
  private mapValueToLabelUri(value: string, concepts: any[]): { label: string; uri: string } {
    // Try to find concept by URI first (normalization sets URIs as values)
    let concept = concepts.find(c => c.uri === value);
    
    // If not found by URI, try by label
    if (!concept) {
      concept = concepts.find(c => c.label === value);
    }
    
    // If not found by label, try by altLabels
    if (!concept) {
      concept = concepts.find(c => 
        c.altLabels && Array.isArray(c.altLabels) && c.altLabels.includes(value)
      );
    }
    
    if (concept) {
      return {
        label: concept.label,
        uri: concept.uri || ''
      };
    }
    
    // Fallback: value not found in vocabulary
    console.warn(`⚠️ Value "${value}" not found in vocabulary concepts`);
    return {
      label: value,
      uri: ''
    };
  }

  /**
   * Reset state
   */
  reset(): void {
    this.workerPool.clearQueue();
    this.stateSubject.next(this.getInitialState());
  }
}
