import { Envelope, User, SigningSession, Template, AuditEntry, BulkOperation, AdvancedAnalytics, EnterpriseSettings, AuthenticationData, RiskAssessment } from '../types';

export const mockUsers: User[] = [
  {
    id: 'user_001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@acme.com',
    role: 'admin',
    organization: 'Acme Corporation',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
  },
  {
    id: 'user_002',
    name: 'Michael Chen',
    email: 'michael.chen@techstart.com',
    role: 'user',
    organization: 'TechStart Inc',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
  }
];

export const mockAdvancedAuthData: AuthenticationData = {
  method: 'knowledge_based',
  timestamp: '2024-01-15T14:30:00Z',
  success: true,
  attempts: 1,
  riskScore: 15,
  deviceFingerprint: 'fp_abc123def456',
  geolocation: {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10
  },
  kbaData: {
    questionsAnswered: 5,
    correctAnswers: 5,
    score: 100
  }
};

export const mockRiskAssessment: RiskAssessment = {
  overallScore: 25,
  factors: {
    deviceTrust: 85,
    locationRisk: 10,
    behaviorPattern: 90,
    velocityCheck: 95,
    ipReputation: 88
  },
  recommendation: 'allow',
  additionalAuthRequired: false
};

export const mockEnvelopes: Envelope[] = [
  {
    id: 'env_001',
    subject: 'Employment Contract - Senior Developer Position',
    message: 'Please review and sign the attached employment contract. This position offers competitive compensation and excellent benefits.',
    status: 'sent',
    priority: 'high',
    createdAt: '2024-01-15T09:00:00Z',
    sentAt: '2024-01-15T09:15:00Z',
    expiresAt: '2024-01-22T17:00:00Z',
    sender: mockUsers[0],
    signatureType: 'advanced',
    complianceLevel: 'enhanced',
    documents: [
      {
        id: 'doc_001',
        name: 'Employment_Contract_Senior_Developer.pdf',
        size: 2457600,
        pages: 8,
        type: 'application/pdf',
        url: '/mock-documents/employment-contract.pdf'
      }
    ],
    recipients: [
      {
        id: 'recipient_001',
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@example.com',
        role: 'signer',
        order: 1,
        status: 'viewed',
        authentication: 'knowledge_based',
        viewedAt: '2024-01-15T14:30:00Z',
        ipAddress: '192.168.1.100',
        authenticationData: mockAdvancedAuthData
      },
      {
        id: 'recipient_002',
        name: 'HR Manager',
        email: 'hr@acme.com',
        role: 'carbon_copy',
        order: 2,
        status: 'waiting',
        authentication: 'none'
      }
    ],
    fields: [
      {
        id: 'field_001',
        type: 'signature',
        recipientId: 'recipient_001',
        documentId: 'doc_001',
        page: 1,
        position: { x: 245, y: 567 },
        size: { width: 150, height: 50 },
        required: true,
        completed: false
      },
      {
        id: 'field_002',
        type: 'date',
        recipientId: 'recipient_001',
        documentId: 'doc_001',
        page: 1,
        position: { x: 400, y: 567 },
        size: { width: 100, height: 30 },
        required: true,
        completed: false
      },
      {
        id: 'field_003',
        type: 'initial',
        recipientId: 'recipient_001',
        documentId: 'doc_001',
        page: 2,
        position: { x: 500, y: 200 },
        size: { width: 80, height: 40 },
        required: true,
        completed: false
      }
    ],
    auditTrail: [
      {
        id: 'audit_001',
        envelopeId: 'env_001',
        action: 'envelope_created',
        actor: 'sarah.johnson@acme.com',
        timestamp: '2024-01-15T09:00:00Z',
        ipAddress: '192.168.1.50',
        details: 'Envelope created with 1 document and 2 recipients',
        authenticationMethod: 'session_auth',
        riskScore: 5
      },
      {
        id: 'audit_002',
        envelopeId: 'env_001',
        action: 'envelope_sent',
        actor: 'sarah.johnson@acme.com',
        timestamp: '2024-01-15T09:15:00Z',
        ipAddress: '192.168.1.50',
        details: 'Envelope sent to recipients',
        authenticationMethod: 'session_auth',
        riskScore: 5
      },
      {
        id: 'audit_003',
        envelopeId: 'env_001',
        action: 'document_viewed',
        actor: 'alex.rodriguez@example.com',
        timestamp: '2024-01-15T14:30:00Z',
        ipAddress: '192.168.1.100',
        details: 'Document viewed after KBA authentication',
        authenticationMethod: 'knowledge_based',
        riskScore: 15
      }
    ],
    tags: ['employment', 'contract', 'urgent'],
    reminderEnabled: true,
    reminderInterval: 3,
    requireAllSignatures: true,
    allowDecline: true,
    signingOrder: 'sequential'
  },
  {
    id: 'env_002',
    subject: 'NDA Agreement - Project Phoenix',
    message: 'Please sign this non-disclosure agreement for the upcoming Project Phoenix collaboration.',
    status: 'completed',
    priority: 'normal',
    createdAt: '2024-01-10T10:30:00Z',
    sentAt: '2024-01-10T11:00:00Z',
    completedAt: '2024-01-12T16:45:00Z',
    sender: mockUsers[0],
    signatureType: 'qualified',
    complianceLevel: 'qualified',
    documents: [
      {
        id: 'doc_002',
        name: 'NDA_Project_Phoenix.pdf',
        size: 1024000,
        pages: 3,
        type: 'application/pdf'
      }
    ],
    recipients: [
      {
        id: 'recipient_003',
        name: 'Jessica Wong',
        email: 'jessica.wong@partner.com',
        role: 'signer',
        order: 1,
        status: 'completed',
        authentication: 'digital_certificate',
        signedAt: '2024-01-12T16:45:00Z',
        viewedAt: '2024-01-11T09:20:00Z'
      }
    ],
    fields: [
      {
        id: 'field_004',
        type: 'signature',
        recipientId: 'recipient_003',
        documentId: 'doc_002',
        page: 1,
        position: { x: 200, y: 650 },
        size: { width: 150, height: 50 },
        required: true,
        completed: true,
        value: 'Jessica Wong'
      }
    ],
    reminderEnabled: false,
    reminderInterval: 0,
    requireAllSignatures: true,
    allowDecline: false,
    signingOrder: 'parallel'
  },
  {
    id: 'env_003',
    subject: 'Partnership Agreement - Q1 2024',
    message: 'Partnership agreement for Q1 2024 collaboration. Please review all terms carefully.',
    status: 'draft',
    priority: 'normal',
    createdAt: '2024-01-16T15:20:00Z',
    sender: mockUsers[0],
    signatureType: 'standard',
    complianceLevel: 'basic',
    documents: [
      {
        id: 'doc_003',
        name: 'Partnership_Agreement_Q1_2024.pdf',
        size: 3072000,
        pages: 12,
        type: 'application/pdf'
      }
    ],
    recipients: [
      {
        id: 'recipient_004',
        name: 'David Kumar',
        email: 'david.kumar@partnerco.com',
        role: 'signer',
        order: 1,
        status: 'waiting',
        authentication: 'biometric',
        authValue: '+1-555-0123'
      },
      {
        id: 'recipient_005',
        name: 'Lisa Chen',
        email: 'lisa.chen@partnerco.com',
        role: 'signer',
        order: 2,
        status: 'waiting',
        authentication: 'government_id'
      }
    ],
    fields: [],
    reminderEnabled: true,
    reminderInterval: 2,
    requireAllSignatures: true,
    allowDecline: true,
    signingOrder: 'sequential'
  }
];

export const mockSigningSessions: SigningSession[] = [
  {
    id: 'session_001',
    envelopeId: 'env_001',
    recipientId: 'recipient_001',
    token: 'sign_token_abc123',
    status: 'active',
    startedAt: '2024-01-15T14:30:00Z',
    expiresAt: '2024-01-15T15:30:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    completedFields: 1,
    totalFields: 3,
    signatures: [],
    authenticationResults: [mockAdvancedAuthData],
    riskAssessment: mockRiskAssessment
  }
];

export const mockBulkOperations: BulkOperation[] = [
  {
    id: 'bulk_001',
    type: 'envelope_creation',
    status: 'completed',
    createdAt: '2024-01-15T10:00:00Z',
    completedAt: '2024-01-15T10:15:00Z',
    totalItems: 150,
    processedItems: 150,
    successfulItems: 147,
    failedItems: 3,
    createdBy: 'user_001',
    parameters: {
      templateId: 'template_001',
      csvFile: 'employee_contracts_q1.csv'
    },
    results: [
      {
        itemId: 'item_001',
        status: 'success',
        envelopeId: 'env_bulk_001'
      },
      {
        itemId: 'item_002',
        status: 'failed',
        error: 'Invalid email address'
      }
    ]
  }
];

export const mockAdvancedAnalytics: AdvancedAnalytics = {
  completionRates: {
    overall: 94.7,
    byDocumentType: {
      contract: 96.2,
      nda: 92.1,
      invoice: 98.5,
      hr_document: 89.3
    },
    byAuthMethod: {
      email: 91.2,
      sms: 94.8,
      knowledge_based: 87.6,
      biometric: 98.1,
      government_id: 95.3,
      digital_certificate: 99.2
    },
    bySignatureType: {
      standard: 93.1,
      advanced: 96.4,
      qualified: 98.8
    }
  },
  timeToCompletion: {
    average: '2.3 hours',
    median: '45 minutes',
    byComplexity: {
      simple: '15 minutes',
      medium: '1.2 hours',
      complex: '4.7 hours'
    },
    byAuthMethod: {
      email: '35 minutes',
      knowledge_based: '8 minutes',
      biometric: '3 minutes',
      government_id: '12 minutes'
    }
  },
  authenticationMetrics: {
    successRates: {
      email: 98.5,
      sms: 96.2,
      knowledge_based: 89.7,
      biometric: 97.8,
      government_id: 94.1,
      digital_certificate: 99.1
    },
    averageAttempts: {
      email: 1.1,
      sms: 1.2,
      knowledge_based: 1.8,
      biometric: 1.3,
      government_id: 1.4
    },
    riskScoreDistribution: [5, 12, 23, 35, 18, 7]
  },
  workflowAnalytics: {
    bottlenecks: [
      {
        step: 'legal_review',
        averageDelay: '1.2 days',
        frequency: 23,
        recommendation: 'Add parallel review option'
      },
      {
        step: 'manager_approval',
        averageDelay: '4.5 hours',
        frequency: 18,
        recommendation: 'Implement auto-approval for low-value contracts'
      }
    ],
    automationEfficiency: 87.3,
    escalationRates: {
      timeout: 12.5,
      manual_escalation: 3.2,
      system_escalation: 8.7
    }
  },
  complianceMetrics: {
    adherenceRates: {
      esign: 99.8,
      eidas: 97.2,
      hipaa: 98.9,
      sox: 96.4
    },
    auditFindings: 3,
    riskAssessments: 1247
  }
};

export const mockEnterpriseSettings: EnterpriseSettings = {
  authentication: {
    defaultMethods: ['email', 'sms'],
    riskBasedAuth: true,
    maxAuthAttempts: 3,
    sessionTimeout: 30
  },
  signatures: {
    defaultType: 'advanced',
    allowedTypes: ['standard', 'advanced', 'qualified'],
    certificateValidation: true,
    timestamping: true
  },
  compliance: {
    enabledStandards: ['esign', 'eidas', 'hipaa'],
    auditLevel: 'enhanced',
    dataRetention: 7,
    blockchainAudit: true
  },
  workflows: {
    enableAutomation: true,
    maxComplexity: 10,
    allowCustomRules: true
  },
  integration: {
    apiAccess: true,
    webhookEndpoints: ['https://api.acme.com/webhooks/esign'],
    ssoEnabled: true,
    ldapIntegration: false
  }
};

export const mockTemplates: Template[] = [
  {
    id: 'template_001',
    name: 'Employment Contract',
    description: 'Standard employment contract template with signature fields',
    category: 'HR',
    documents: [
      {
        id: 'template_doc_001',
        name: 'Employment_Contract_Template.pdf',
        size: 2048000,
        pages: 6,
        type: 'application/pdf'
      }
    ],
    fields: [
      {
        id: 'template_field_001',
        type: 'signature',
        recipientId: 'employee',
        documentId: 'template_doc_001',
        page: 1,
        position: { x: 245, y: 567 },
        size: { width: 150, height: 50 },
        required: true,
        completed: false
      }
    ],
    recipients: [
      {
        name: 'Employee',
        email: '',
        role: 'signer',
        order: 1,
        authentication: 'knowledge_based'
      }
    ],
    createdBy: 'user_001',
    createdAt: '2024-01-01T00:00:00Z',
    usageCount: 24,
    isPublic: true,
    workflowRules: [
      {
        id: 'rule_001',
        name: 'Auto-approve low salary contracts',
        condition: 'salary < 50000',
        action: 'skip_manager_approval',
        parameters: { threshold: 50000 },
        enabled: true
      }
    ],
    complianceRequirements: [
      {
        standard: 'esign',
        level: 'enhanced',
        authenticationMethods: ['knowledge_based', 'government_id'],
        signatureType: 'advanced',
        auditLevel: 'enhanced'
      }
    ]
  }
];