export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' |'developer';
  avatar?: string;
  organization?: string;
  createdAt: string
  lastActive: string
  isFirstLogin?: boolean;
}

export interface UserType {
  id: string;
  _id:string
  name: string;
  fullname:string;
  phone:string;
  status:boolean
  email: string;
  role: 'admin' | 'user' |'developer';
  avatar?: string;
  organization?: string;
  createdAt: string
  lastActive: string
}

export interface SubscriptionPlan {
  id?: string;
  name: string;
  type: 'free' | 'paid' | 'custom';
  price: number;
  conversionsLimitType?: 'number' | 'unlimited';
  conversionsLimit: number;
  description: string;
  services: string[];
  creditsBalance: number;
  creditReserved?: number;
  toolCosts?: Array<{ toolId: string; credits: number; _id?: string }>;
  authCosts?: Array<{ authId: string; credits: number; _id?: string }>;
  documentCosts?: { credits: number };
  shareCosts?: { credits: number };
  pdfShareCosts?: { credits: number };
  status: 'active' | 'paused' | 'cancelled' | 'trial';
  periodStart?: string;
  periodEnd?: string;
  nextBillingAt?: string;
  isFree: boolean;
}

export interface Invoice {
  id?: string;
  _id?: string;
  userId?: string;
  type?:String;
  subscriptionId?: string;
  planTemplateId?: string;
  planName?: string;
  periodStart?: string;
  periodEnd?: string;
  amount: number;
  currency: string;
  invoiceNumber: string;
  receiptNumber: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Document {
  id: string;
  name: string;
  size: number;
  pages: number;
  type: string;
  url?: string;
  content?: string;
  file?: File; // Optional: keep original file reference
    // new optional properties for upload tracking
  isUploading?: boolean;
  uploadProgress?: number; // 0–100
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
  role: 'signer' | 'approver' | 'carbon_copy' | 'in_person_signer'| 'needs_to_view';
  order: number;
  status: 'waiting' | 'sent' | 'viewed' | 'signed' | 'completed' | 'declined';
  authentication?: string;
  authValue?: string;
  privateMessage?: string;
  signedAt?: string;
  viewedAt?: string;
  ipAddress?: string;
  location?: string;
  authenticationData?: AuthenticationData;
  cost?: number;
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
  isPowerForm?: boolean;
  senderName?: string;
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


//PDF Module
export interface PDFTool {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  category?: string;
  inputFormats?: string[];
  outputFormats?: string[];
  features?: string[];
  complexity?: 'easy' | 'medium' | 'advanced';
  popularity?: number;
  avgProcessingTime?: string;
  icon?: string;
  badge?: string;
  premium?: boolean;
  route?: string;
}

export interface ToolCategory {
  category: string;
  description: string;
  tools: PDFTool[];
}

export interface ProcessingStats {
  dailyUsage: {
    totalOperations: number;
    uniqueUsers: number;
    popularTools: Array<{
      name: string;
      usage: number;
      percentage: number;
    }>;
  };
  performanceMetrics: {
    averageProcessingTime: string;
    successRate: number;
    userSatisfaction: number;
    errorRate: number;
  };
  qualityMetrics: {
    conversionAccuracy: number;
    layoutPreservation: number;
    textRecognitionAccuracy: number;
    compressionEfficiency: number;
  };
}

export interface UserWorkflow {
  id: string;
  name: string;
  steps: Array<{
    tool: string;
    order: number;
  }>;
  usage: number;
  avgCompletionTime: string;
}

export interface BatchJob {
  id: string;
  name: string;
  tool: string;
  files: File[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  results?: Array<{
    filename: string;
    status: 'success' | 'error';
    message?: string;
  }>;
}

export interface AdminToolUsage {
  id: string;
  name: string;
  description: string;
  category: string;
  usage: number;
  uniqueUsers: number;
  successRate: number;
  avgProcessingTime: number;
  errorCount: number;
  errorRate: number;
}

export interface ProcessingJob {
  id: string;
  fileName: string;
  fileSize: string;
  user: string;
  tool: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  startedAt: string;
  completedAt?: string;
  pausedAt?: string;
  estimatedCompletion?: string;
  error?: string;
}
// Api Service 

export interface Project {
  id: string
  name: string
  description: string
  userId: string
  createdAt: string
  updatedAt: string
  apiKeys: APIKey[]
  webhooks: Webhook[]
  usage: ProjectUsage
}

export interface APIKey {
  id: string
  name: string
  key: string
  projectId: string
  permissions: string[]
  rateLimit: RateLimit
  createdAt: string
  lastUsed?: string
  isActive: boolean
  usage: APIKeyUsage
}

export interface RateLimit {
  requests: number
  window: string
  burst?: number
}

export interface APIKeyUsage {
  thisMonth: number
  lastMonth: number
  quota: number
  dailyUsage: DailyUsage[]
}

export interface DailyUsage {
  date: string
  requests: number
  errors: number
}

export interface ProjectUsage {
  totalRequests: number
  totalErrors: number
  avgLatency: number
  topEndpoints: EndpointUsage[]
  dailyUsage: DailyUsage[]
}

export interface EndpointUsage {
  endpoint: string
  requests: number
  avgLatency: string
  errorRate: number
}

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  secret?: string
  projectId: string
  createdAt: string
  lastTriggered?: string
  deliveryStats: WebhookDeliveryStats
}

export interface WebhookDeliveryStats {
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  avgLatency: number
  lastDelivery?: WebhookDelivery
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  event: string
  status: 'success' | 'failed' | 'pending'
  attempts: number
  lastAttempt: string
  responseCode?: number
  responseTime?: number
  payload: any
}

export interface APIEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  parameters: APIParameter[]
  requestBody?: APISchema
  responses: APIResponse[]
  authentication: string[]
  rateLimit: RateLimit
  examples: APIExample[]
}

export interface APIParameter {
  name: string
  in: 'path' | 'query' | 'header'
  required: boolean
  type: string
  description: string
  example?: any
}

export interface APISchema {
  type: string
  properties: Record<string, any>
  required?: string[]
  example?: any
}

export interface APIResponse {
  status: number
  description: string
  schema?: APISchema
  examples?: Record<string, any>
}

export interface APIExample {
  name: string
  description: string
  request: any
  response: any
}

export interface SDK {
  language: string
  version: string
  packageName: string
  installCommand: string
  documentation: string
  examples: string
  lastUpdated: string
  downloads: number
  rating: number
}

export interface Integration {
  id: string
  name: string
  description: string
  category: string
  provider: string
  logo: string
  rating: number
  downloads: number
  featured: boolean
  tags: string[]
  documentation: string
  repository?: string
  createdAt: string
}

export interface ForumPost {
  id: string
  title: string
  content: string
  author: User
  category: string
  tags: string[]
  replies: number
  views: number
  likes: number
  createdAt: string
  updatedAt: string
  isSticky?: boolean
  isSolved?: boolean
}

export interface SupportTicket {
  id: string
  title: string
  description: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  userId: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
}

export interface TicketMessage {
  id: string
  content: string
  author: User
  isStaff: boolean
  createdAt: string
  attachments?: string[]
}

export interface AnalyticsData {
  overview: {
    totalRequests: number
    totalErrors: number
    avgLatency: number
    uptime: number
  }
  usage: {
    daily: DailyUsage[]
    endpoints: EndpointUsage[]
    statusCodes: StatusCodeUsage[]
  }
  performance: {
    latency: LatencyData[]
    throughput: ThroughputData[]
  }
  errors: {
    types: ErrorTypeData[]
    recent: RecentError[]
  }
}

export interface StatusCodeUsage {
  code: number
  count: number
  percentage: number
}

export interface LatencyData {
  timestamp: string
  p50: number
  p95: number
  p99: number
}

export interface ThroughputData {
  timestamp: string
  requests: number
}

export interface ErrorTypeData {
  type: string
  count: number
  percentage: number
}

export interface RecentError {
  id: string
  endpoint: string
  error: string
  timestamp: string
  userId?: string
}

export interface CreditPackage {
  _id?: string;
  id?: string;
  name: string;
  credits: number;
  price: number;
  currency?: string;
  description?: string;
  isPopular?: boolean;
  discount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestCase {
  id: string
  name: string
  description: string
  endpoint: string
  method: string
  headers: Record<string, string>
  body?: any
  expectedStatus: number
  expectedResponse?: any
  assertions: TestAssertion[]
  createdAt: string
  lastRun?: string
  status?: 'passed' | 'failed' | 'pending'
}

export interface TestAssertion {
  type: 'status' | 'header' | 'body' | 'response_time'
  field?: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

export interface TestResult {
  id: string
  testCaseId: string
  status: 'passed' | 'failed'
  duration: number
  response: {
    status: number
    headers: Record<string, string>
    body: any
  }
  assertions: AssertionResult[]
  runAt: string
}

export interface AssertionResult {
  assertion: TestAssertion
  passed: boolean
  actual?: any
  message?: string
}

// Export Split PDF types
export * from './splitPDF';

// Export Extract PDF types
export * from './extractPDF';

// Export Delete PDF types
export * from './deletePDF';
export * from './reorderPDF';
export * from './rotatePDF';
export * from './cropPDF';
export * from './insertPDF';

// Export common types
export * from './common';

// Export Digital Signature types
export * from './digitalSignature';

// Export Add Watermark types
export * from './addWatermark';

// Export Remove Metadata types
export * from './removeMetadata';
export * from './compressPDF';
export * from './optimizeImage';
export * from './documentTracking';