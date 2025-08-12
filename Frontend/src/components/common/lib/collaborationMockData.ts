import type { CollaborationSession, CollaborativeUser, DocumentAnalysis, DocumentComment, DocumentInsight, DocumentVersion, DocumentWorkflow } from "../types/collaboration";


export const MOCK_COLLABORATIVE_USERS: CollaborativeUser[] = [
  {
    id: 'user-collab-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
    cursor: { x: 245, y: 167 },
    selection: { start: 1245, end: 1267 },
    lastActivity: '2024-07-01T14:23:15Z',
    isTyping: true,
    color: '#3b82f6'
  },
  {
    id: 'user-collab-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
    cursor: { x: 367, y: 289 },
    lastActivity: '2024-07-01T14:22:45Z',
    isTyping: false,
    color: '#10b981'
  },
  {
    id: 'user-collab-3',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
    lastActivity: '2024-07-01T14:20:30Z',
    isTyping: false,
    color: '#f59e0b'
  }
];

export const MOCK_DOCUMENT_COMMENTS: DocumentComment[] = [
  {
    id: 'comment-1',
    documentId: 'doc-1',
    author: 'john.doe@example.com',
    authorName: 'John Doe',
    authorAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
    content: 'Please review this section for accuracy. The financial projections seem optimistic.',
    position: { page: 1, x: 245, y: 167 },
    timestamp: '2024-07-01T13:45:00Z',
    replies: [
      {
        id: 'reply-1',
        author: 'jane.smith@example.com',
        authorName: 'Jane Smith',
        authorAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
        content: 'I agree, we should be more conservative with Q4 estimates.',
        timestamp: '2024-07-01T14:15:00Z',
        mentions: []
      }
    ],
    resolved: false,
    mentions: ['jane.smith@example.com']
  },
  {
    id: 'comment-2',
    documentId: 'doc-1',
    author: 'jane.smith@example.com',
    authorName: 'Jane Smith',
    authorAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
    content: 'This clause needs legal review before we proceed.',
    position: { page: 2, x: 156, y: 234 },
    timestamp: '2024-07-01T15:20:00Z',
    replies: [],
    resolved: false,
    mentions: ['mike.johnson@example.com']
  }
];

export const MOCK_DOCUMENT_VERSIONS: DocumentVersion[] = [
  {
    id: 'version-1.3',
    documentId: 'doc-1',
    version: '1.3',
    author: 'john.doe@example.com',
    authorName: 'John Doe',
    timestamp: '2024-07-01T14:00:00Z',
    changes: {
      additions: 234,
      deletions: 45,
      modifications: 67
    },
    description: 'Updated financial projections and market analysis',
    size: 2847392,
    approved: true,
    tags: ['financial', 'projections', 'q4'],
    branch: 'main'
  },
  {
    id: 'version-1.2',
    documentId: 'doc-1',
    version: '1.2',
    author: 'jane.smith@example.com',
    authorName: 'Jane Smith',
    timestamp: '2024-07-01T10:30:00Z',
    changes: {
      additions: 156,
      deletions: 23,
      modifications: 34
    },
    description: 'Added executive summary and recommendations',
    size: 2658496,
    approved: true,
    tags: ['summary', 'recommendations'],
    branch: 'main'
  },
  {
    id: 'version-1.1',
    documentId: 'doc-1',
    version: '1.1',
    author: 'mike.johnson@example.com',
    authorName: 'Mike Johnson',
    timestamp: '2024-06-30T16:45:00Z',
    changes: {
      additions: 89,
      deletions: 12,
      modifications: 23
    },
    description: 'Initial draft with market research data',
    size: 2456789,
    approved: true,
    tags: ['draft', 'market-research'],
    branch: 'main'
  }
];

export const MOCK_DOCUMENT_WORKFLOWS: DocumentWorkflow[] = [
  {
    id: 'workflow-1',
    name: 'Contract Review Process',
    documentId: 'doc-1',
    status: 'active',
    steps: [
      {
        id: 'step-1',
        name: 'Legal Review',
        description: 'Review contract terms and conditions',
        assignee: 'legal@example.com',
        assigneeName: 'Legal Team',
        status: 'completed',
        completedAt: '2024-07-01T10:00:00Z',
        requiredApprovals: 1,
        currentApprovals: 1
      },
      {
        id: 'step-2',
        name: 'Executive Approval',
        description: 'Final approval from executive team',
        assignee: 'ceo@example.com',
        assigneeName: 'CEO',
        status: 'pending',
        dueDate: '2024-07-02T17:00:00Z',
        requiredApprovals: 1,
        currentApprovals: 0
      }
    ],
    createdBy: 'john.doe@example.com',
    createdAt: '2024-06-30T09:00:00Z',
    priority: 'high',
    deadline: '2024-07-03T17:00:00Z'
  },
  {
    id: 'workflow-2',
    name: 'Document Quality Review',
    documentId: 'doc-2',
    status: 'completed',
    steps: [
      {
        id: 'step-3',
        name: 'Content Review',
        description: 'Review document content for accuracy',
        assignee: 'editor@example.com',
        assigneeName: 'Content Editor',
        status: 'completed',
        completedAt: '2024-06-29T14:30:00Z',
        requiredApprovals: 1,
        currentApprovals: 1
      },
      {
        id: 'step-4',
        name: 'Final Approval',
        description: 'Final sign-off on document',
        assignee: 'manager@example.com',
        assigneeName: 'Project Manager',
        status: 'completed',
        completedAt: '2024-06-30T11:15:00Z',
        requiredApprovals: 1,
        currentApprovals: 1
      }
    ],
    createdBy: 'jane.smith@example.com',
    createdAt: '2024-06-28T10:00:00Z',
    completedAt: '2024-06-30T11:15:00Z',
    priority: 'medium'
  }
];

export const MOCK_DOCUMENT_ANALYSIS: DocumentAnalysis[] = [
  {
    id: 'analysis-1',
    documentId: 'doc-1',
    analysis: {
      wordCount: 2847,
      pageCount: 12,
      readabilityScore: 7.2,
      sentiment: 'positive',
      language: 'en',
      topics: ['finance', 'business', 'projections', 'market analysis'],
      entities: [
        {
          text: 'Q4 2024',
          type: 'date',
          confidence: 0.95,
          position: { start: 1245, end: 1252 }
        },
        {
          text: 'Acme Corporation',
          type: 'organization',
          confidence: 0.98,
          position: { start: 234, end: 249 }
        },
        {
          text: '$2.5 million',
          type: 'money',
          confidence: 0.92,
          position: { start: 1567, end: 1578 }
        }
      ],
      keyPhrases: [
        'financial projections',
        'market analysis',
        'revenue growth',
        'competitive advantage'
      ],
      summary: 'This document presents comprehensive financial projections for Q4 2024, including market analysis and revenue growth strategies.'
    },
    classification: {
      category: 'Financial Report',
      confidence: 0.89,
      suggestedTags: ['finance', 'quarterly', 'projections', 'analysis']
    },
    compliance: {
      issues: [
        {
          type: 'Data Privacy',
          severity: 'medium',
          description: 'Document contains potential PII that should be reviewed',
          recommendation: 'Review and redact personal information if necessary'
        }
      ],
      score: 85,
      recommendations: [
        'Add confidentiality notice',
        'Review data retention policies',
        'Ensure proper access controls'
      ]
    },
    processedAt: '2024-07-01T14:30:00Z'
  }
];

export const MOCK_COLLABORATION_SESSIONS: CollaborationSession[] = [
  {
    id: 'session-1',
    documentId: 'doc-1',
    activeUsers: MOCK_COLLABORATIVE_USERS,
    startedAt: '2024-07-01T13:00:00Z',
    lastActivity: '2024-07-01T14:23:15Z',
    totalEdits: 47,
    totalComments: 8
  }
];

export const MOCK_DOCUMENT_INSIGHTS: DocumentInsight[] = [
  {
    id: 'insight-1',
    type: 'trend',
    title: 'Increased Collaboration Activity',
    description: 'Document collaboration has increased by 35% this week',
    impact: 'medium',
    actionRequired: false,
    relatedDocuments: ['doc-1', 'doc-2'],
    createdAt: '2024-07-01T09:00:00Z'
  },
  {
    id: 'insight-2',
    type: 'recommendation',
    title: 'Version Control Optimization',
    description: 'Consider implementing automated version tagging for better organization',
    impact: 'high',
    actionRequired: true,
    relatedDocuments: ['doc-1'],
    createdAt: '2024-07-01T10:30:00Z'
  },
  {
    id: 'insight-3',
    type: 'alert',
    title: 'Pending Workflow Approvals',
    description: '3 documents are waiting for executive approval beyond deadline',
    impact: 'high',
    actionRequired: true,
    relatedDocuments: ['doc-1', 'doc-3', 'doc-4'],
    createdAt: '2024-07-01T11:15:00Z'
  }
];

export const COLLABORATION_ANALYTICS = {
  documentMetrics: {
    totalDocuments: 1847,
    collaborativeDocuments: 423,
    averageCollaborators: 3.2,
    commentActivity: 856,
    versionActivity: 234,
    workflowsActive: 23,
    workflowsCompleted: 156
  },
  userEngagement: {
    activeCollaborators: 67,
    averageSessionLength: '45 minutes',
    collaborationFrequency: '8.3 sessions/week',
    documentCompletionRate: 94.2,
    commentResolutionRate: 87.5
  },
  workflowPerformance: {
    activeWorkflows: 23,
    completedThisMonth: 156,
    averageProcessingTime: '1.8 days',
    bottleneckSteps: ['Legal Review', 'Final Approval'],
    onTimeCompletionRate: 78.3
  },
  collaborationTrends: {
    dailyActiveUsers: [45, 52, 48, 61, 58, 67, 63],
    weeklyComments: [234, 267, 298, 312, 289, 345, 378],
    monthlyVersions: [89, 94, 102, 87, 95, 108, 112]
  }
};