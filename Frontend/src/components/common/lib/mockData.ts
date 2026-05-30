import type { ActivityItem, Document, DocumentStats, Folder, User, UserRole } from "../types";


export const MOCK_USERS: Record<UserRole, User> = {
  regular: {
    id: 'user-1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'regular',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop'
  },
  team_admin: {
    id: 'admin-1',
    email: 'sarah.smith@example.com',
    name: 'Sarah Smith',
    role: 'team_admin',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
    organizationId: 'org-1'
  },
  super_admin: {
    id: 'superadmin-1',
    email: 'admin@draftsign.com',  
    name: 'DraftSign Admin',
    role: 'super_admin',
    avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop'
  }
};

export const MOCK_FOLDERS: Folder[] = [
  {
    id: 'my-documents',
    name: 'My Documents',
    parentId: null,
    color: '#3b82f6',
    icon: 'Folder',
    documentCount: 12,
    createdAt: '2024-01-10T09:00:00Z',
    ownerId: 'user-1',
    isShared: false,
    permissions: []
  },
  {
    id: 'contracts',
    name: 'Contracts',
    parentId: 'my-documents',
    color: '#10b981',
    icon: 'FileText',
    documentCount: 8,
    createdAt: '2024-01-15T10:30:00Z',
    ownerId: 'user-1',
    isShared: true,
    permissions: [
      {
        userId: 'admin-1',
        email: 'sarah.smith@example.com',
        permission: 'view',
        createdAt: '2024-01-16T09:00:00Z'
      }
    ]
  },
  {
    id: 'invoices',
    name: 'Invoices',
    parentId: 'my-documents',
    color: '#f59e0b',
    icon: 'Receipt',
    documentCount: 15,
    createdAt: '2024-02-01T14:20:00Z',
    ownerId: 'user-1',
    isShared: false,
    permissions: []
  },
  {
    id: 'team-shared',
    name: 'Team Shared',
    parentId: null,
    color: '#155E4B',
    icon: 'Users',
    documentCount: 25,
    createdAt: '2024-01-05T08:00:00Z',
    ownerId: 'admin-1',
    isShared: true,
    permissions: []
  },
  {
    id: 'legal-docs',
    name: 'Legal Documents',
    parentId: 'team-shared',
    color: '#ef4444',
    icon: 'Scale',
    documentCount: 6,
    createdAt: '2024-01-20T11:15:00Z',
    ownerId: 'admin-1',
    isShared: true,
    permissions: []
  }
];

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    name: 'Service_Agreement_2024.pdf',
    type: 'pdf',
    size: 2457600,
    createdAt: '2024-01-15T10:30:00Z',
    modifiedAt: '2024-01-16T14:20:00Z',
    uploadedBy: 'john.doe@example.com',
    folderId: 'contracts',
    tags: ['contract', 'legal', '2024'],
    shared: true,
    views: 12,
    downloads: 3,
    sharedWith: [
      {
        userId: 'admin-1',
        email: 'sarah.smith@example.com',
        permission: 'view',
        createdAt: '2024-01-16T09:00:00Z'
      }
    ],
    isArchived: false,
    isFavorite: true
  },
  {
    id: 'doc-2',
    name: 'Company_Logo_Assets.zip',
    type: 'zip',
    size: 15728640,
    createdAt: '2024-02-01T09:15:00Z',
    modifiedAt: '2024-02-01T09:15:00Z',
    uploadedBy: 'sarah.smith@example.com',
    folderId: 'team-shared',
    tags: ['branding', 'assets', 'design'],
    shared: true,
    views: 8,
    downloads: 5,
    sharedWith: [],
    isArchived: false,
    isFavorite: false
  },
  {
    id: 'doc-3',
    name: 'Q1_Financial_Report.xlsx',
    type: 'xlsx',
    size: 1048576,
    createdAt: '2024-03-31T16:45:00Z',
    modifiedAt: '2024-04-01T10:20:00Z',
    uploadedBy: 'john.doe@example.com',
    folderId: 'invoices',
    tags: ['finance', 'quarterly', 'report'],
    shared: false,
    views: 15,
    downloads: 2,
    sharedWith: [],
    isArchived: false,
    isFavorite: true
  },
  {
    id: 'doc-4',
    name: 'Employee_Handbook_v2.docx',
    type: 'docx',
    size: 3145728,
    createdAt: '2024-02-15T11:30:00Z',
    modifiedAt: '2024-02-20T14:10:00Z',
    uploadedBy: 'sarah.smith@example.com',
    folderId: 'team-shared',
    tags: ['hr', 'handbook', 'policies'],
    shared: true,
    views: 45,
    downloads: 12,
    sharedWith: [
      {
        userId: 'user-1',
        email: 'john.doe@example.com',
        permission: 'view',
        createdAt: '2024-02-16T08:00:00Z'
      }
    ],
    isArchived: false,
    isFavorite: false
  },
  {
    id: 'doc-5',
    name: 'Product_Screenshots.png',
    type: 'png',
    size: 5242880,
    createdAt: '2024-03-10T13:20:00Z',
    modifiedAt: '2024-03-10T13:20:00Z',
    uploadedBy: 'john.doe@example.com',
    folderId: 'my-documents',
    tags: ['product', 'screenshots', 'demo'],
    shared: false,
    views: 7,
    downloads: 1,
    sharedWith: [],
    isArchived: false,
    isFavorite: false
  },
  {
    id: 'doc-6',
    name: 'Project_Notes.txt',
    type: 'txt',
    size: 2048,
    createdAt: '2024-03-15T09:00:00Z',
    modifiedAt: '2024-03-15T09:00:00Z',
    uploadedBy: 'john.doe@example.com',
    folderId: 'my-documents',
    tags: ['notes', 'project', 'ideas'],
    shared: false,
    views: 3,
    downloads: 0,
    sharedWith: [],
    isArchived: false,
    isFavorite: false,
    content: '# Project Notes\n\n## Current Status\n- Frontend development in progress\n- Backend API integration complete\n- User authentication working\n\n## Next Steps\n1. Complete document viewer\n2. Implement real-time collaboration\n3. Add advanced search features\n\n## Ideas for Future\n- AI-powered document analysis\n- Automated workflow creation\n- Mobile app development'
  },
  {
    id: 'doc-7',
    name: 'Meeting_Notes_March.txt',
    type: 'txt',
    size: 12288,
    createdAt: '2024-03-25T10:00:00Z',
    modifiedAt: '2024-03-28T15:30:00Z',
    uploadedBy: 'sarah.smith@example.com',
    folderId: null,
    tags: ['meetings', 'notes', 'march'],
    shared: false,
    views: 3,
    downloads: 0,
    content: 'Meeting notes from March team meetings...',
    sharedWith: [],
    isArchived: false,
    isFavorite: false
  }
];

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'activity-1',
    type: 'upload',
    documentId: 'doc-1',
    documentName: 'Service_Agreement_2024.pdf',
    userId: 'user-1',
    userName: 'John Doe',
    timestamp: '2024-04-01T14:30:00Z'
  },
  {
    id: 'activity-2',
    type: 'share',
    documentId: 'doc-2',
    documentName: 'Company_Logo_Assets.zip',
    userId: 'admin-1',
    userName: 'Sarah Smith',
    timestamp: '2024-04-01T12:15:00Z'
  },
  {
    id: 'activity-3',
    type: 'download',
    documentId: 'doc-3',
    documentName: 'Q1_Financial_Report.xlsx',
    userId: 'user-1',
    userName: 'John Doe',
    timestamp: '2024-04-01T09:45:00Z'
  }
];

export const MOCK_STATS: DocumentStats = {
  totalDocuments: 127,
  totalStorage: 2147483648, // 2GB
  recentActivity: MOCK_ACTIVITY,
  topDocuments: MOCK_DOCUMENTS.slice(0, 3),
  storageByType: [
    { type: 'pdf', size: 52428800, count: 23 },
    { type: 'docx', size: 31457280, count: 15 },
    { type: 'xlsx', size: 20971520, count: 12 },
    { type: 'png', size: 41943040, count: 8 },
    { type: 'zip', size: 104857600, count: 3 }
  ]
};

export const ROLE_PERMISSIONS = {
  regular: {
    upload: true,
    view: true,
    download: true,
    delete_own: true,
    delete_any: false,
    create_folders: true,
    manage_team_docs: false,
    bulk_operations: false,
    analytics: false,
    admin_access: false,
    storageLimit: 1073741824, // 1GB
    uploadLimit: 26214400 // 25MB
  },
  team_admin: {
    upload: true,
    view: true,
    download: true,
    delete_own: true,
    delete_any: true,
    create_folders: true,
    manage_team_docs: true,
    bulk_operations: true,
    analytics: true,
    admin_access: false,
    storageLimit: 10737418240, // 10GB
    uploadLimit: 104857600 // 100MB
  },
  super_admin: {
    upload: true,
    view: true,
    download: true,
    delete_own: true,
    delete_any: true,
    create_folders: true,
    manage_team_docs: true,
    bulk_operations: true,
    analytics: true,
    admin_access: true,
    storageLimit: -1, // Unlimited
    uploadLimit: -1 // Unlimited
  }
};