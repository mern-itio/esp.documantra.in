// Redact Content Types

export interface RedactRequest {
  file: File;
  redactionType: RedactionType;
  customPattern?: string;
  redactionColor: RedactionColor;
  redactionMethod: RedactionMethod;
  preserveLayout?: boolean;
  batchMode?: boolean;
  complianceMode?: boolean;
}

export interface RedactResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  originalFileSize: number;
  fileSize: number;
  redactionDetails: RedactionDetails;
  complianceInfo?: ComplianceInfo;
}

export interface RedactionDetails {
  totalRedactions: number;
  pagesProcessed: number;
  fallbackUsed?: boolean;
}

export interface ComplianceInfo {
  redactionTimestamp: string;
  redactionType: RedactionType;
  auditTrail: AuditTrailEntry[];
}

export interface AuditTrailEntry {
  page: number;
  pattern: string;
  redactedText: string;
  timestamp: string;
  method: RedactionMethod;
  color: RedactionColor;
}

export interface RedactPreview {
  success: boolean;
  totalMatches: number;
  matches: RedactMatch[];
  patterns: RedactPattern[];
}

export interface RedactMatch {
  text: string;
  pattern: string;
  position: number;
  context: string;
}

export interface RedactPattern {
  name: string;
  description: string;
}

export interface RedactOptions {
  redactionType: RedactionType;
  customPattern: string;
  redactionColor: RedactionColor;
  redactionMethod: RedactionMethod;
  preserveLayout: boolean;
  batchMode: boolean;
  complianceMode: boolean;
}

export interface RedactStats {
  totalRedactions: number;
  pagesAffected: number;
  redactionType: RedactionType;
  fileSizeReduction: number;
}

export interface RedactValidation {
  valid: boolean;
  errors?: string[];
  message?: string;
}

export interface RedactHistory {
  id: string;
  timestamp: string;
  filename: string;
  redactionType: RedactionType;
  totalRedactions: number;
  fileSize: number;
  downloadUrl: string;
}

export interface RedactSettings {
  defaultRedactionColor: RedactionColor;
  defaultRedactionMethod: RedactionMethod;
  defaultPreserveLayout: boolean;
  defaultComplianceMode: boolean;
  autoSave: boolean;
  maxPreviewMatches: number;
}

export interface RedactPreset {
  id: string;
  name: string;
  description: string;
  redactionType: RedactionType;
  customPattern?: string;
  redactionColor: RedactionColor;
  redactionMethod: RedactionMethod;
  category: string;
  isDefault: boolean;
}

export interface RedactTemplate {
  id: string;
  name: string;
  description: string;
  operations: RedactOperation[];
  category: string;
  tags: string[];
}

export interface RedactOperation {
  redactionType: RedactionType;
  customPattern?: string;
  redactionColor: RedactionColor;
  redactionMethod: RedactionMethod;
  order: number;
  enabled: boolean;
}

export interface RedactAnalytics {
  totalRedactions: number;
  mostUsedPatterns: Array<{ pattern: string; count: number }>;
  averageRedactionsPerDocument: number;
  complianceModeUsage: number;
  mostCommonRedactionTypes: Array<{ type: RedactionType; count: number }>;
}

// Enums
export type RedactionType = 
  | 'ssn'
  | 'credit_card'
  | 'email'
  | 'phone'
  | 'address'
  | 'name'
  | 'date'
  | 'custom'
  | 'all_sensitive';

export type RedactionColor = 
  | 'black'
  | 'white'
  | 'red'
  | 'blue'
  | 'gray';

export type RedactionMethod = 
  | 'solid'
  | 'pattern';

// Redaction Pattern Definitions
export interface RedactionPatternDefinition {
  type: RedactionType;
  name: string;
  description: string;
  pattern: RegExp;
  example: string;
  category: 'personal' | 'financial' | 'contact' | 'identification' | 'custom';
}

// Batch Redaction Types
export interface BatchRedactRequest {
  files: File[];
  redactionType: RedactionType;
  customPattern?: string;
  redactionColor: RedactionColor;
  redactionMethod: RedactionMethod;
  preserveLayout?: boolean;
  complianceMode?: boolean;
}

export interface BatchRedactResponse {
  success: boolean;
  message: string;
  results: BatchRedactResult[];
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
}

export interface BatchRedactResult {
  filename: string;
  success: boolean;
  message?: string;
  downloadUrl?: string;
  redactionDetails?: RedactionDetails;
  error?: string;
}

// Privacy Compliance Types
export interface PrivacyCompliance {
  gdprCompliant: boolean;
  ccpaCompliant: boolean;
  hipaaCompliant: boolean;
  auditTrail: AuditTrailEntry[];
  dataRetentionPolicy: string;
  redactionStandards: string[];
}

export interface ComplianceReport {
  documentId: string;
  redactionTimestamp: string;
  complianceLevel: 'basic' | 'standard' | 'enterprise';
  redactedFields: string[];
  auditTrail: AuditTrailEntry[];
  complianceScore: number;
  recommendations: string[];
}
