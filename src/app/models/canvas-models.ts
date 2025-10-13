/**
 * Canvas-specific models for field-based metadata extraction
 */

export enum FieldStatus {
  EMPTY = 'empty',
  EXTRACTING = 'extracting',
  FILLED = 'filled',
  ERROR = 'error',
}

export interface VocabularyConcept {
  label: string;
  label_en?: string;
  uri?: string;
  altLabels?: string[];
  schema_file?: string;
}

export interface ValidationRules {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

export interface VocabularyInfo {
  type: string;
  concepts: VocabularyConcept[];
}

export interface CanvasFieldState {
  fieldId: string;
  label: string;
  description: string;
  group: string;
  groupLabel: string;
  groupOrder: number;  // Position in schema's groups array
  schemaName: string;  // 'Core', 'Event', etc.
  aiFillable: boolean;  // ai_fillable flag from schema
  status: FieldStatus;
  value: any;
  confidence: number;
  isRequired: boolean;
  datatype: string;
  multiple: boolean;
  vocabulary?: VocabularyInfo;
  validation?: ValidationRules;
  extractionError?: string;
}

export interface FieldGroup {
  id: string;
  label: string;
  schemaName: string;
  fields: CanvasFieldState[];
}

export interface CanvasState {
  userText: string;
  detectedContentType: string | null;
  contentTypeConfidence: number;
  selectedContentType: string | null;
  coreFields: CanvasFieldState[];
  specialFields: CanvasFieldState[];
  fieldGroups: FieldGroup[];
  isExtracting: boolean;
  extractionProgress: number;
  totalFields: number;
  filledFields: number;
  metadata: Record<string, any>;
}

export interface FieldExtractionTask {
  field: CanvasFieldState;
  userText: string;
  priority: number; // Required fields have higher priority
}

export interface ExtractionResult {
  fieldId: string;
  value: any;
  confidence: number;
  error?: string;
}
