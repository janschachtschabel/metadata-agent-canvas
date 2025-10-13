/**
 * TypeScript models for metadata extraction workflow (analog to models.py)
 */

/**
 * Current phase of the metadata extraction workflow
 */
export enum WorkflowPhase {
  INIT = 'init',
  SUGGEST_SPECIAL_SCHEMAS = 'suggest_special_schemas',
  EXTRACT_CORE_REQUIRED = 'extract_core_required',
  EXTRACT_CORE_OPTIONAL = 'extract_core_optional',
  EXTRACT_SPECIAL_REQUIRED = 'extract_special_required',
  EXTRACT_SPECIAL_OPTIONAL = 'extract_special_optional',
  REVIEW = 'review',
  COMPLETE = 'complete'
}

/**
 * A chat message
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Status of a field in the extraction process
 */
export interface FieldStatus {
  fieldId: string;
  fieldLabel: string;
  value: any;
  isFilled: boolean;
  isConfirmed: boolean;
  isRequired: boolean;
  aiSuggested: boolean;
  needsUserInput: boolean;
}

/**
 * State of the metadata extraction workflow
 */
export interface WorkflowState {
  // Current phase
  phase: WorkflowPhase;
  
  // Loaded schemas
  coreSchema: string;
  specialSchemas: string[];
  selectedContentTypes: string[];
  
  // Chat history
  messages: Message[];
  
  // Extracted metadata
  metadata: Record<string, any>;
  
  // Field tracking
  fieldStatus: Record<string, FieldStatus>;
  
  // Current field being processed
  currentFieldId: string | null;
  
  // Pending questions
  pendingQuestions: string[];
  
  // User input buffer
  userInput: string;
  
  // Workflow progress
  coreRequiredComplete: boolean;
  coreOptionalComplete: boolean;
  specialSchemaConfirmed: boolean;
  specialRequiredComplete: boolean;
  specialOptionalComplete: boolean;
  
  // Current special schema being processed
  currentSpecialSchemaIndex: number;
  
  // Navigation history for back button
  phaseHistory: WorkflowPhase[];
}

/**
 * Helper class for WorkflowState operations
 */
export class WorkflowStateHelper {
  
  static createInitialState(): WorkflowState {
    return {
      phase: WorkflowPhase.INIT,
      coreSchema: 'core.json',
      specialSchemas: [],
      selectedContentTypes: [],
      messages: [],
      metadata: {},
      fieldStatus: {},
      currentFieldId: null,
      pendingQuestions: [],
      userInput: '',
      coreRequiredComplete: false,
      coreOptionalComplete: false,
      specialSchemaConfirmed: false,
      specialRequiredComplete: false,
      specialOptionalComplete: false,
      currentSpecialSchemaIndex: 0,
      phaseHistory: []
    };
  }
  
  static addMessage(state: WorkflowState, role: Message['role'], content: string): WorkflowState {
    return {
      ...state,
      messages: [...state.messages, { role, content }]
    };
  }
  
  static updateField(
    state: WorkflowState,
    fieldId: string,
    value: any,
    confirmed: boolean = false,
    aiSuggested: boolean = false
  ): WorkflowState {
    const existingField = state.fieldStatus[fieldId] || {
      fieldId,
      fieldLabel: fieldId,
      isRequired: false,
      needsUserInput: false,
      isFilled: false,
      isConfirmed: false,
      aiSuggested: false,
      value: null
    };
    
    const updatedField: FieldStatus = {
      ...existingField,
      value,
      isFilled: value !== null && value !== '' && (Array.isArray(value) ? value.length > 0 : true),
      isConfirmed: confirmed,
      aiSuggested
    };
    
    return {
      ...state,
      fieldStatus: {
        ...state.fieldStatus,
        [fieldId]: updatedField
      },
      metadata: {
        ...state.metadata,
        [fieldId]: value
      }
    };
  }
  
  static getUnfilledRequiredFields(state: WorkflowState): string[] {
    return Object.keys(state.fieldStatus).filter(
      fieldId => state.fieldStatus[fieldId].isRequired && !state.fieldStatus[fieldId].isFilled
    );
  }
  
  static getFilledFields(state: WorkflowState): Record<string, any> {
    const result: Record<string, any> = {};
    Object.keys(state.fieldStatus).forEach(fieldId => {
      if (state.fieldStatus[fieldId].isFilled) {
        result[fieldId] = state.fieldStatus[fieldId].value;
      }
    });
    return result;
  }
  
  static checkCoreRequiredComplete(state: WorkflowState): boolean {
    const requiredFields = ['cclom:title', 'cclom:general_description', 'cclom:general_keyword'];
    return requiredFields.every(fieldId => 
      state.fieldStatus[fieldId] && state.fieldStatus[fieldId].isFilled
    );
  }
}

/**
 * Schema field definition
 */
export interface SchemaField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  askUser: boolean;
  prompt?: {
    label?: string;
    description?: string;
  };
  values?: string[];
}
