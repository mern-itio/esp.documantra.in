export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  organization?: string;
}

export interface Document {
  id: string;
  name: string;
  size: number;
  pages: number;
  type: string;
  url?: string;
  content?: string;
}

export interface SignatureField {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'text' | 'checkbox' | 'radio';
  recipientId: string;
  documentId: string;
  page: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  required: boolean;
  completed: boolean;
  value?: string;
  placeholder?: string;
  validation?: string;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  role: 'signer' | 'approver' | 'carbon_copy' | 'in_person_signer';
  order: number;
  status: 'waiting' | 'sent' | 'viewed' | 'signed' | 'completed' | 'declined';
  authentication: 'none' | 'email' | 'sms' | 'access_code' | 'phone' | 'knowledge_based' | 'government_id' | 'biometric' | 'video_id' | 'digital_certificate';
  authValue?: string;
  signedAt?: string;
  viewedAt?: string;
  ipAddress?: string;
  location?: string;
  authenticationData?: AuthenticationData;
}

export interface AuthenticationData {
  method: string;
  timestamp: string;
  success: boolean;
  attempts: number;
  riskScore?: number;
  deviceFingerprint?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  biometricData?: {
    type: 'fingerprint' | 'face' | 'voice';
    quality: number;
    template: string;
  };
  kbaData?: {
    questionsAnswered: number;
    correctAnswers: number;
    score: number;
  };
  governmentIdData?: {
    documentType: string;
    documentNumber: string;
    verified: boolean;
    faceMatch: boolean;
  };
}

export interface AuditEntry {
  id: string;
  envelopeId: string;
  action: string;
  actor: string;
  timestamp: string;
  ipAddress: string;
  details: string;
  location?: string;
  authenticationMethod?: string;
  riskScore?: number;
  deviceInfo?: string;
}

export interface Envelope {
  id: string;
  subject: string;
  message: string;
  status: 'draft' | 'sent' | 'pending' | 'completed' | 'expired' | 'voided' | 'declined';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
  expiresAt?: string;
  sender: User;
  documents: Document[];
  recipients: Recipient[];
  fields: SignatureField[];
  auditTrail?: AuditEntry[];
  tags?: string[];
  reminderEnabled: boolean;
  reminderInterval: number;
  customMessage?: string;
  requireAllSignatures: boolean;
  allowDecline: boolean;
  signingOrder: 'sequential' | 'parallel';
  signatureType?: 'standard' | 'advanced' | 'qualified';
  complianceLevel?: 'basic' | 'enhanced' | 'qualified';
  workflowId?: string;
  bulkOperationId?: string;
}

export interface SigningSession {
  id: string;
  envelopeId: string;
  recipientId: string;
  token: string;
  status: 'active' | 'expired' | 'completed';
  startedAt: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  completedFields: number;
  totalFields: number;
  signatures: Array<{
    fieldId: string;
    signatureData: string;
    timestamp: string;
    method: 'drawn' | 'typed' | 'uploaded';
    signatureType?: 'standard' | 'advanced' | 'qualified';
    certificate?: string;
  }>;
  authenticationResults?: AuthenticationData[];
  riskAssessment?: RiskAssessment;
}

export interface RiskAssessment {
  overallScore: number;
  factors: {
    deviceTrust: number;
    locationRisk: number;
    behaviorPattern: number;
    velocityCheck: number;
    ipReputation: number;
  };
  recommendation: 'allow' | 'challenge' | 'block';
  additionalAuthRequired: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  documents: Document[];
  fields: SignatureField[];
  recipients: Omit<Recipient, 'id' | 'status' | 'signedAt' | 'viewedAt'>[];
  createdBy: string;
  createdAt: string;
  usageCount: number;
  isPublic: boolean;
  workflowRules?: WorkflowRule[];
  complianceRequirements?: ComplianceRequirement[];
}

export interface WorkflowRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface ComplianceRequirement {
  standard: string;
  level: 'basic' | 'enhanced' | 'qualified';
  authenticationMethods: string[];
  signatureType: 'standard' | 'advanced' | 'qualified';
  auditLevel: 'standard' | 'enhanced' | 'forensic';
}

export interface Certificate {
  id: string;
  envelopeId: string;
  issuedAt: string;
  participants: Array<{
    name: string;
    email: string;
    role: string;
    signedAt: string;
    ipAddress: string;
    authMethod: string;
    signatureType: string;
    certificate?: string;
  }>;
  documents: Array<{
    name: string;
    pages: number;
    checksum: string;
  }>;
  legalCompliance: {
    esignAct: boolean;
    eidas: boolean;
    itAct2000: boolean;
    iso14533: boolean;
  };
  securityMeasures: string[];
  digitalSignature: string;
  blockchainHash?: string;
  timestampToken?: string;
}

export interface BulkOperation {
  id: string;
  type: 'envelope_creation' | 'envelope_sending' | 'status_update' | 'reminder_sending';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  createdBy: string;
  parameters: Record<string, any>;
  results?: BulkOperationResult[];
}

export interface BulkOperationResult {
  itemId: string;
  status: 'success' | 'failed';
  envelopeId?: string;
  error?: string;
  details?: Record<string, any>;
}

export interface AdvancedAnalytics {
  completionRates: {
    overall: number;
    byDocumentType: Record<string, number>;
    byAuthMethod: Record<string, number>;
    bySignatureType: Record<string, number>;
  };
  timeToCompletion: {
    average: string;
    median: string;
    byComplexity: Record<string, string>;
    byAuthMethod: Record<string, string>;
  };
  authenticationMetrics: {
    successRates: Record<string, number>;
    averageAttempts: Record<string, number>;
    riskScoreDistribution: number[];
  };
  workflowAnalytics: {
    bottlenecks: Array<{
      step: string;
      averageDelay: string;
      frequency: number;
      recommendation: string;
    }>;
    automationEfficiency: number;
    escalationRates: Record<string, number>;
  };
  complianceMetrics: {
    adherenceRates: Record<string, number>;
    auditFindings: number;
    riskAssessments: number;
  };
}

export interface EnterpriseSettings {
  authentication: {
    defaultMethods: string[];
    riskBasedAuth: boolean;
    maxAuthAttempts: number;
    sessionTimeout: number;
  };
  signatures: {
    defaultType: 'standard' | 'advanced' | 'qualified';
    allowedTypes: string[];
    certificateValidation: boolean;
    timestamping: boolean;
  };
  compliance: {
    enabledStandards: string[];
    auditLevel: 'standard' | 'enhanced' | 'forensic';
    dataRetention: number;
    blockchainAudit: boolean;
  };
  workflows: {
    enableAutomation: boolean;
    maxComplexity: number;
    allowCustomRules: boolean;
  };
  integration: {
    apiAccess: boolean;
    webhookEndpoints: string[];
    ssoEnabled: boolean;
    ldapIntegration: boolean;
  };
}