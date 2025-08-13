export interface CollaborativeUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  cursor?: {
    x: number;
    y: number;
  };
  selection?: {
    start: number;
    end: number;
  };
  lastActivity: string;
  isTyping: boolean;
  color: string;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  author: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  position: {
    page: number;
    x: number;
    y: number;
  };
  timestamp: string;
  replies: CommentReply[];
  resolved: boolean;
  mentions: string[];
  attachments?: CommentAttachment[];
}

export interface CommentReply {
  id: string;
  author: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  mentions: string[];
}

export interface CommentAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: string;
  author: string;
  authorName: string;
  timestamp: string;
  changes: {
    additions: number;
    deletions: number;
    modifications: number;
  };
  description: string;
  size: number;
  approved: boolean;
  tags: string[];
  branch?: string;
}

export interface VersionComparison {
  fromVersion: string;
  toVersion: string;
  changes: VersionChange[];
  summary: {
    totalChanges: number;
    additions: number;
    deletions: number;
    modifications: number;
  };
}

export interface VersionChange {
  id: string;
  type: 'addition' | 'deletion' | 'modification';
  content: string;
  position: number;
  author: string;
  timestamp: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  assignee: string;
  assigneeName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  dueDate?: string;
  completedAt?: string;
  comments?: string;
  requiredApprovals: number;
  currentApprovals: number;
}

export interface DocumentWorkflow {
  id: string;
  name: string;
  documentId: string;
  status: 'active' | 'completed' | 'cancelled';
  steps: WorkflowStep[];
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
}

export interface DocumentAnalysis {
  id: string;
  documentId: string;
  analysis: {
    wordCount: number;
    pageCount: number;
    readabilityScore: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    language: string;
    topics: string[];
    entities: DocumentEntity[];
    keyPhrases: string[];
    summary: string;
  };
  ocrResults?: {
    confidence: number;
    extractedText: string;
    regions: OCRRegion[];
  };
  classification: {
    category: string;
    confidence: number;
    suggestedTags: string[];
  };
  compliance: {
    issues: ComplianceIssue[];
    score: number;
    recommendations: string[];
  };
  processedAt: string;
}

export interface DocumentEntity {
  text: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'other';
  confidence: number;
  position: {
    start: number;
    end: number;
  };
}

export interface OCRRegion {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ComplianceIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  position?: {
    page: number;
    line: number;
  };
}

export interface CollaborationSession {
  id: string;
  documentId: string;
  activeUsers: CollaborativeUser[];
  startedAt: string;
  lastActivity: string;
  totalEdits: number;
  totalComments: number;
}

export interface DocumentInsight {
  id: string;
  type: 'trend' | 'recommendation' | 'alert' | 'optimization';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionRequired: boolean;
  relatedDocuments: string[];
  createdAt: string;
}