import type { Project, APIEndpoint, SDK, Integration, ForumPost, AnalyticsData, TestCase } from '../types'

export const mockProjects: Project[] = [
  {
    id: 'proj_001',
    name: 'HR Integration Project',
    description: 'Integrate DraftnSign with HR systems for employee onboarding',
    userId: 'user_123',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-07-01T15:30:00Z',
    apiKeys: [
      {
        id: 'key_001',
        name: 'Production Key',
        key: 'ds_live_1234567890abcdef',
        projectId: 'proj_001',
        permissions: ['user:read', 'document:write', 'envelope:send'],
        rateLimit: {
          requests: 10000,
          window: '1h'
        },
        createdAt: '2024-06-15T10:00:00Z',
        lastUsed: '2024-07-01T14:20:00Z',
        isActive: true,
        usage: {
          thisMonth: 2547,
          lastMonth: 1834,
          quota: 10000,
          dailyUsage: [
            { date: '2024-07-01', requests: 245, errors: 3 },
            { date: '2024-06-30', requests: 198, errors: 1 },
            { date: '2024-06-29', requests: 267, errors: 2 }
          ]
        }
      },
      {
        id: 'key_002',
        name: 'Development Key',
        key: 'ds_test_abcdef1234567890',
        projectId: 'proj_001',
        permissions: ['user:read', 'document:read'],
        rateLimit: {
          requests: 1000,
          window: '1h'
        },
        createdAt: '2024-06-20T10:00:00Z',
        lastUsed: '2024-06-30T09:15:00Z',
        isActive: true,
        usage: {
          thisMonth: 456,
          lastMonth: 234,
          quota: 1000,
          dailyUsage: [
            { date: '2024-07-01', requests: 45, errors: 0 },
            { date: '2024-06-30', requests: 38, errors: 0 },
            { date: '2024-06-29', requests: 52, errors: 1 }
          ]
        }
      }
    ],
    webhooks: [
      {
        id: 'webhook_001',
        name: 'Document Signed Webhook',
        url: 'https://api.acme.com/webhooks/document-signed',
        events: ['envelope.completed', 'document.signed'],
        isActive: true,
        secret: 'whsec_1234567890abcdef',
        projectId: 'proj_001',
        createdAt: '2024-06-16T10:00:00Z',
        lastTriggered: '2024-07-01T14:25:00Z',
        deliveryStats: {
          totalDeliveries: 156,
          successfulDeliveries: 154,
          failedDeliveries: 2,
          avgLatency: 245,
          lastDelivery: {
            id: 'delivery_001',
            webhookId: 'webhook_001',
            event: 'envelope.completed',
            status: 'success',
            attempts: 1,
            lastAttempt: '2024-07-01T14:25:00Z',
            responseCode: 200,
            responseTime: 234,
            payload: {
              event: 'envelope.completed',
              envelope_id: 'env_123',
              completed_at: '2024-07-01T14:25:00Z'
            }
          }
        }
      }
    ],
    usage: {
      totalRequests: 3003,
      totalErrors: 6,
      avgLatency: 156,
      topEndpoints: [
        { endpoint: '/api/v1/envelopes', requests: 1234, avgLatency: '245ms', errorRate: 0.2 },
        { endpoint: '/api/v1/documents', requests: 987, avgLatency: '123ms', errorRate: 0.1 },
        { endpoint: '/api/v1/users', requests: 543, avgLatency: '89ms', errorRate: 0.0 }
      ],
      dailyUsage: [
        { date: '2024-07-01', requests: 290, errors: 3 },
        { date: '2024-06-30', requests: 236, errors: 1 },
        { date: '2024-06-29', requests: 319, errors: 3 }
      ]
    }
  },
  {
    id: 'proj_002',
    name: 'Sales Contract Automation',
    description: 'Automate sales contract generation and signing process',
    userId: 'user_123',
    createdAt: '2024-05-20T10:00:00Z',
    updatedAt: '2024-06-25T12:00:00Z',
    apiKeys: [
      {
        id: 'key_003',
        name: 'Sales API Key',
        key: 'ds_live_fedcba0987654321',
        projectId: 'proj_002',
        permissions: ['template:read', 'envelope:send', 'document:write'],
        rateLimit: {
          requests: 5000,
          window: '1h'
        },
        createdAt: '2024-05-20T10:00:00Z',
        lastUsed: '2024-06-25T11:45:00Z',
        isActive: true,
        usage: {
          thisMonth: 1234,
          lastMonth: 2156,
          quota: 5000,
          dailyUsage: [
            { date: '2024-07-01', requests: 123, errors: 1 },
            { date: '2024-06-30', requests: 145, errors: 0 },
            { date: '2024-06-29', requests: 167, errors: 2 }
          ]
        }
      }
    ],
    webhooks: [],
    usage: {
      totalRequests: 1234,
      totalErrors: 3,
      avgLatency: 189,
      topEndpoints: [
        { endpoint: '/api/v1/templates', requests: 456, avgLatency: '167ms', errorRate: 0.1 },
        { endpoint: '/api/v1/envelopes', requests: 389, avgLatency: '234ms', errorRate: 0.3 },
        { endpoint: '/api/v1/documents', requests: 234, avgLatency: '145ms', errorRate: 0.0 }
      ],
      dailyUsage: [
        { date: '2024-07-01', requests: 123, errors: 1 },
        { date: '2024-06-30', requests: 145, errors: 0 },
        { date: '2024-06-29', requests: 167, errors: 2 }
      ]
    }
  }
]

export const mockAPIEndpoints: APIEndpoint[] = [
  {
    path: '/api/v1/users',
    method: 'GET',
    description: 'Retrieve a list of users',
    parameters: [
      {
        name: 'limit',
        in: 'query',
        required: false,
        type: 'integer',
        description: 'Number of users to return (max 100)',
        example: 20
      },
      {
        name: 'offset',
        in: 'query',
        required: false,
        type: 'integer',
        description: 'Number of users to skip',
        example: 0
      }
    ],
    responses: [
      {
        status: 200,
        description: 'List of users retrieved successfully',
        schema: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' }
                }
              }
            },
            total: { type: 'integer' }
          }
        }
      }
    ],
    authentication: ['api_key', 'oauth2'],
    rateLimit: {
      requests: 1000,
      window: '1h'
    },
    examples: [
      {
        name: 'Get users with pagination',
        description: 'Retrieve the first 20 users',
        request: {
          method: 'GET',
          url: '/api/v1/users?limit=20&offset=0',
          headers: {
            'Authorization': 'Bearer your_api_key'
          }
        },
        response: {
          status: 200,
          body: {
            users: [
              {
                id: 'user_123',
                name: 'John Doe',
                email: 'john@example.com'
              }
            ],
            total: 1
          }
        }
      }
    ]
  },
  {
    path: '/api/v1/envelopes',
    method: 'POST',
    description: 'Create a new envelope for document signing',
    parameters: [],
    requestBody: {
      type: 'object',
      properties: {
        subject: { type: 'string' },
        message: { type: 'string' },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        recipients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' }
            }
          }
        }
      },
      required: ['subject', 'documents', 'recipients']
    },
    responses: [
      {
        status: 201,
        description: 'Envelope created successfully',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
            created_at: { type: 'string' }
          }
        }
      }
    ],
    authentication: ['api_key', 'oauth2'],
    rateLimit: {
      requests: 500,
      window: '1h'
    },
    examples: [
      {
        name: 'Create simple envelope',
        description: 'Create an envelope with one document and one recipient',
        request: {
          method: 'POST',
          url: '/api/v1/envelopes',
          headers: {
            'Authorization': 'Bearer your_api_key',
            'Content-Type': 'application/json'
          },
          body: {
            subject: 'Please sign this contract',
            message: 'Please review and sign the attached contract.',
            documents: [
              {
                name: 'contract.pdf',
                content: 'base64_encoded_content'
              }
            ],
            recipients: [
              {
                name: 'John Doe',
                email: 'john@example.com',
                role: 'signer'
              }
            ]
          }
        },
        response: {
          status: 201,
          body: {
            id: 'env_123456',
            status: 'sent',
            created_at: '2024-07-01T10:00:00Z'
          }
        }
      }
    ]
  }
]

export const mockSDKs: SDK[] = [
  {
    language: 'Python',
    version: '2.1.0',
    packageName: 'draftn-sign',
    installCommand: 'pip install draftn-sign',
    documentation: '/docs/python',
    examples: '/examples/python',
    lastUpdated: '2024-06-25T10:00:00Z',
    downloads: 15420,
    rating: 4.8
  },
  {
    language: 'JavaScript',
    version: '2.1.0',
    packageName: '@draftn/sign-js',
    installCommand: 'npm install @draftn/sign-js',
    documentation: '/docs/javascript',
    examples: '/examples/javascript',
    lastUpdated: '2024-06-25T10:00:00Z',
    downloads: 23150,
    rating: 4.9
  },
  {
    language: 'Java',
    version: '2.0.5',
    packageName: 'com.draftn.sign',
    installCommand: 'implementation "com.draftn:sign:2.0.5"',
    documentation: '/docs/java',
    examples: '/examples/java',
    lastUpdated: '2024-06-20T10:00:00Z',
    downloads: 8930,
    rating: 4.7
  },
  {
    language: 'C#',
    version: '2.0.3',
    packageName: 'DraftnSign.NET',
    installCommand: 'Install-Package DraftnSign.NET',
    documentation: '/docs/csharp',
    examples: '/examples/csharp',
    lastUpdated: '2024-06-18T10:00:00Z',
    downloads: 6750,
    rating: 4.6
  },
  {
    language: 'PHP',
    version: '1.9.2',
    packageName: 'draftn/sign-php',
    installCommand: 'composer require draftn/sign-php',
    documentation: '/docs/php',
    examples: '/examples/php',
    lastUpdated: '2024-06-15T10:00:00Z',
    downloads: 4320,
    rating: 4.5
  },
  {
    language: 'Ruby',
    version: '1.8.1',
    packageName: 'draftn_sign',
    installCommand: 'gem install draftn_sign',
    documentation: '/docs/ruby',
    examples: '/examples/ruby',
    lastUpdated: '2024-06-12T10:00:00Z',
    downloads: 2890,
    rating: 4.4
  },
  {
    language: 'Go',
    version: '1.7.0',
    packageName: 'github.com/draftn/sign-go',
    installCommand: 'go get github.com/draftn/sign-go',
    documentation: '/docs/go',
    examples: '/examples/go',
    lastUpdated: '2024-06-10T10:00:00Z',
    downloads: 3450,
    rating: 4.7
  }
]

export const mockIntegrations: Integration[] = [
  {
    id: 'int_001',
    name: 'Salesforce Integration',
    description: 'Seamlessly integrate DraftnSign with Salesforce CRM for automated contract workflows',
    category: 'CRM',
    provider: 'DraftnSign',
    logo: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
    rating: 4.8,
    downloads: 12450,
    featured: true,
    tags: ['CRM', 'Sales', 'Automation'],
    documentation: '/integrations/salesforce',
    repository: 'https://github.com/draftn/salesforce-integration',
    createdAt: '2024-05-15T10:00:00Z'
  },
  {
    id: 'int_002',
    name: 'HubSpot Connector',
    description: 'Connect DraftnSign with HubSpot for streamlined deal closure and contract management',
    category: 'CRM',
    provider: 'Community',
    logo: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
    rating: 4.6,
    downloads: 8930,
    featured: true,
    tags: ['CRM', 'Marketing', 'Sales'],
    documentation: '/integrations/hubspot',
    repository: 'https://github.com/community/hubspot-draftn',
    createdAt: '2024-05-20T10:00:00Z'
  },
  {
    id: 'int_003',
    name: 'Slack Notifications',
    description: 'Get real-time notifications in Slack when documents are signed or require attention',
    category: 'Communication',
    provider: 'DraftnSign',
    logo: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
    rating: 4.9,
    downloads: 15670,
    featured: false,
    tags: ['Communication', 'Notifications', 'Team'],
    documentation: '/integrations/slack',
    createdAt: '2024-04-10T10:00:00Z'
  },
  {
    id: 'int_004',
    name: 'Google Drive Sync',
    description: 'Automatically sync signed documents to Google Drive with organized folder structure',
    category: 'Storage',
    provider: 'Community',
    logo: 'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
    rating: 4.7,
    downloads: 11230,
    featured: false,
    tags: ['Storage', 'Cloud', 'Sync'],
    documentation: '/integrations/google-drive',
    repository: 'https://github.com/community/gdrive-draftn',
    createdAt: '2024-04-25T10:00:00Z'
  },
  {
    id: 'int_005',
    name: 'Zapier Workflows',
    description: 'Connect DraftnSign with 5000+ apps through Zapier for unlimited automation possibilities',
    category: 'Automation',
    provider: 'Zapier',
    logo: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
    rating: 4.8,
    downloads: 18920,
    featured: true,
    tags: ['Automation', 'Workflow', 'Integration'],
    documentation: '/integrations/zapier',
    createdAt: '2024-03-15T10:00:00Z'
  },
  {
    id: 'int_006',
    name: 'Microsoft Teams Bot',
    description: 'Manage document signing workflows directly from Microsoft Teams with interactive bot',
    category: 'Communication',
    provider: 'Microsoft',
    logo: 'https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
    rating: 4.5,
    downloads: 7650,
    featured: false,
    tags: ['Communication', 'Microsoft', 'Bot'],
    documentation: '/integrations/teams',
    createdAt: '2024-05-05T10:00:00Z'
  }
]

export const mockForumPosts: ForumPost[] = [
  {
    id: 'post_001',
    title: 'How to implement bulk envelope sending?',
    content: 'I need to send multiple envelopes at once using the API. What\'s the best approach for handling bulk operations?',
    author: {
      id: 'user_456',
      name: 'Sarah Johnson',
      email: 'sarah@techcorp.com',
      role: 'developer',
      createdAt: '2024-05-01T10:00:00Z',
      lastActive: '2024-07-01T16:00:00Z'
    },
    category: 'API',
    tags: ['bulk-operations', 'envelopes', 'api'],
    replies: 8,
    views: 234,
    likes: 12,
    createdAt: '2024-06-28T14:30:00Z',
    updatedAt: '2024-07-01T09:15:00Z',
    isSolved: true
  },
  {
    id: 'post_002',
    title: 'Webhook delivery failures - troubleshooting guide',
    content: 'I\'m experiencing intermittent webhook delivery failures. Here\'s what I\'ve learned about debugging webhook issues...',
    author: {
      id: 'user_789',
      name: 'Mike Chen',
      email: 'mike@startup.io',
      role: 'developer',
      createdAt: '2024-04-15T10:00:00Z',
      lastActive: '2024-07-01T12:30:00Z'
    },
    category: 'Webhooks',
    tags: ['webhooks', 'troubleshooting', 'debugging'],
    replies: 15,
    views: 567,
    likes: 28,
    createdAt: '2024-06-25T10:00:00Z',
    updatedAt: '2024-06-30T16:45:00Z',
    isSticky: true
  },
  {
    id: 'post_003',
    title: 'New Python SDK v2.1.0 released!',
    content: 'We\'re excited to announce the release of Python SDK v2.1.0 with improved error handling and new features...',
    author: {
      id: 'staff_001',
      name: 'DraftnSign Team',
      email: 'team@draftn.com',
      role: 'admin',
      createdAt: '2024-01-01T10:00:00Z',
      lastActive: '2024-07-01T17:00:00Z'
    },
    category: 'Announcements',
    tags: ['sdk', 'python', 'release'],
    replies: 23,
    views: 892,
    likes: 45,
    createdAt: '2024-06-25T10:00:00Z',
    updatedAt: '2024-06-26T14:20:00Z',
    isSticky: true
  }
]

export const mockAnalyticsData: AnalyticsData = {
  overview: {
    totalRequests: 45678,
    totalErrors: 234,
    avgLatency: 156,
    uptime: 99.97
  },
  usage: {
    daily: [
      { date: '2024-06-24', requests: 1234, errors: 12 },
      { date: '2024-06-25', requests: 1456, errors: 8 },
      { date: '2024-06-26', requests: 1678, errors: 15 },
      { date: '2024-06-27', requests: 1345, errors: 6 },
      { date: '2024-06-28', requests: 1567, errors: 11 },
      { date: '2024-06-29', requests: 1789, errors: 9 },
      { date: '2024-06-30', requests: 1890, errors: 13 },
      { date: '2024-07-01', requests: 1923, errors: 7 }
    ],
    endpoints: [
      { endpoint: '/api/v1/envelopes', requests: 15678, avgLatency: '245ms', errorRate: 0.8 },
      { endpoint: '/api/v1/documents', requests: 12345, avgLatency: '123ms', errorRate: 0.3 },
      { endpoint: '/api/v1/users', requests: 8901, avgLatency: '89ms', errorRate: 0.1 },
      { endpoint: '/api/v1/templates', requests: 5432, avgLatency: '167ms', errorRate: 0.2 },
      { endpoint: '/api/v1/webhooks', requests: 3210, avgLatency: '201ms', errorRate: 0.5 }
    ],
    statusCodes: [
      { code: 200, count: 42345, percentage: 92.7 },
      { code: 400, count: 1234, percentage: 2.7 },
      { code: 401, count: 890, percentage: 1.9 },
      { code: 404, count: 567, percentage: 1.2 },
      { code: 500, count: 234, percentage: 0.5 },
      { code: 429, count: 408, percentage: 0.9 }
    ]
  },
  performance: {
    latency: [
      { timestamp: '2024-07-01T00:00:00Z', p50: 120, p95: 450, p99: 890 },
      { timestamp: '2024-07-01T01:00:00Z', p50: 115, p95: 420, p99: 850 },
      { timestamp: '2024-07-01T02:00:00Z', p50: 125, p95: 480, p99: 920 },
      { timestamp: '2024-07-01T03:00:00Z', p50: 110, p95: 400, p99: 800 }
    ],
    throughput: [
      { timestamp: '2024-07-01T00:00:00Z', requests: 234 },
      { timestamp: '2024-07-01T01:00:00Z', requests: 189 },
      { timestamp: '2024-07-01T02:00:00Z', requests: 267 },
      { timestamp: '2024-07-01T03:00:00Z', requests: 198 }
    ]
  },
  errors: {
    types: [
      { type: 'Authentication Error', count: 89, percentage: 38.0 },
      { type: 'Rate Limit Exceeded', count: 67, percentage: 28.6 },
      { type: 'Validation Error', count: 45, percentage: 19.2 },
      { type: 'Server Error', count: 23, percentage: 9.8 },
      { type: 'Not Found', count: 10, percentage: 4.3 }
    ],
    recent: [
      {
        id: 'err_001',
        endpoint: '/api/v1/envelopes',
        error: 'Invalid recipient email format',
        timestamp: '2024-07-01T15:30:00Z',
        userId: 'user_456'
      },
      {
        id: 'err_002',
        endpoint: '/api/v1/documents',
        error: 'File size exceeds limit',
        timestamp: '2024-07-01T15:25:00Z',
        userId: 'user_789'
      },
      {
        id: 'err_003',
        endpoint: '/api/v1/users',
        error: 'Unauthorized access',
        timestamp: '2024-07-01T15:20:00Z'
      }
    ]
  }
}

export const mockTestCases: TestCase[] = [
  {
    id: 'test_001',
    name: 'Create User - Valid Data',
    description: 'Test creating a new user with valid data',
    endpoint: '/api/v1/users',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test_key'
    },
    body: {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user'
    },
    expectedStatus: 201,
    expectedResponse: {
      id: 'user_123',
      name: 'John Doe',
      email: 'john@example.com'
    },
    assertions: [
      {
        type: 'status',
        operator: 'equals',
        value: 201
      },
      {
        type: 'body',
        field: 'email',
        operator: 'equals',
        value: 'john@example.com'
      }
    ],
    createdAt: '2024-06-20T10:00:00Z',
    lastRun: '2024-07-01T14:30:00Z',
    status: 'passed'
  },
  {
    id: 'test_002',
    name: 'Get Envelope - Not Found',
    description: 'Test retrieving a non-existent envelope',
    endpoint: '/api/v1/envelopes/invalid_id',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test_key'
    },
    expectedStatus: 404,
    assertions: [
      {
        type: 'status',
        operator: 'equals',
        value: 404
      },
      {
        type: 'response_time',
        operator: 'less_than',
        value: 500
      }
    ],
    createdAt: '2024-06-22T10:00:00Z',
    lastRun: '2024-07-01T14:25:00Z',
    status: 'passed'
  }
]