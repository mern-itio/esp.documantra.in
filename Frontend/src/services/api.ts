import { API_CONFIG } from '../config/environment';

// Base API configuration for document service
const DOCUMENT_API_BASE_URL = import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:2102';

// API Configuration
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_CONFIG.BASE_URL}/login`,
    REGISTER: `${API_CONFIG.BASE_URL}/register`,
    STATUS: `${API_CONFIG.BASE_URL}/api/auth/status`,
  },
};

export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Helper function to get auth token for document service
const getDocumentAuthToken = (): string | null => {
  const token = 
    localStorage.getItem('accessToken') || // Check accessToken first (as used in auth API)
    // localStorage.getItem('token') || // Check for generic token
    localStorage.getItem('userData') || // Check for userToken
    (() => {
      
      // Check if token is stored in userData
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          return parsed.token || parsed.accessToken || parsed.userToken || null;
        } catch (error) {
          console.error('Error parsing userData:', error);
          return null;
        }
      }
      return null;
    })();

  if (!token) {
    console.warn('No authentication token found. Checked locations:', [
      'localStorage.accessToken',
      'localStorage.token', 
      'localStorage.userToken',
      'localStorage.userData.token',
      'localStorage.userData.accessToken',
      'localStorage.userData.userToken'
    ]);
  }

  return token;
};

// Helper function to make authenticated requests to document service
const makeDocumentRequest = async (
  endpoint: string,
  options: RequestInit = {},
  isFormData: boolean = false
): Promise<any> => {
  const token = getDocumentAuthToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }

  const url = `${DOCUMENT_API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle duplicate filename error specifically
      if (response.status === 409 && errorData.code === 'DUPLICATE_FILENAME') {
        const error = new Error(errorData.message || 'Duplicate filename detected');
        (error as any).code = 'DUPLICATE_FILENAME';
        (error as any).data = errorData.data;
        throw error;
      }
      
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Handle different response types
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Document Management API
export const documentAPI = {
  // Check for duplicate filename
  checkDuplicateFilename: async (filename: string, folderId?: string) => {
    return makeDocumentRequest('/api/documents/check-duplicate', {
      method: 'POST',
      body: JSON.stringify({ filename, folderId }),
    });
  },

  // Upload document
  uploadDocument: async (file: File, folderId?: string, description?: string, tags?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    if (description) formData.append('description', description);
    if (tags) formData.append('tags', tags);

    return makeDocumentRequest('/api/documents/upload', {
      method: 'POST',
      body: formData,
    }, true);
  },

  // Get user documents
  getUserDocuments: async (params: {
    page?: number;
    limit?: number;
    folderId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    type?: string;
    tags?: string;
    favoritesOnly?: boolean;
    archivedOnly?: boolean;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/api/documents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeDocumentRequest(endpoint);
  },

  // Get single document
  getDocument: async (id: string) => {
    return makeDocumentRequest(`/api/documents/${id}`);
  },

  // Update document metadata
  updateDocument: async (id: string, updates: {
    name?: string;
    description?: string;
    tags?: string;
    isFavorite?: boolean;
    isArchived?: boolean;
    content?: string;
  }) => {
    return makeDocumentRequest(`/api/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete document
  deleteDocument: async (id: string) => {
    return makeDocumentRequest(`/api/documents/${id}`, {
      method: 'DELETE',
    });
  },

  // Download document
  downloadDocument: async (id: string) => {
    try {
      // Get the authentication token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Make a POST request to the download endpoint
      const response = await fetch(`${DOCUMENT_API_BASE_URL}/api/documents/${id}/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Document not found. Please make sure the document exists and you have access to it.');
        }
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'document';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, message: 'Failed to download document' };
    }
  },

  // Bulk delete documents
  bulkDeleteDocuments: async (documentIds: string[]) => {
    return makeDocumentRequest('/api/documents/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ documentIds }),
    });
  },

  // Share document with collaborator
  shareDocument: async (documentId: string, email: string, permission: 'view' | 'edit' | 'comment', message?: string) => {
    return makeDocumentRequest(`/api/documents/${documentId}/share`, {
      method: 'POST',
      body: JSON.stringify({ email, permission, message }),
    });
  },

  // Move document to folder
  moveDocument: async (documentId: string, folderId: string | null) => {
    return makeDocumentRequest(`/api/documents/${documentId}/move`, {
      method: 'POST',
      body: JSON.stringify({ folderId }),
    });
  },

  // Move multiple documents to folder
  moveMultipleDocuments: async (documentIds: string[], folderId: string | null) => {
    return makeDocumentRequest('/api/documents/bulk-move', {
      method: 'POST',
      body: JSON.stringify({ documentIds, folderId }),
    });
  },

  // Trash functionality
  getDeletedDocuments: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    for (const key in params) {
      if (params[key as keyof typeof params] !== undefined) {
        queryParams.append(key, String(params[key as keyof typeof params]));
      }
    }
    return makeDocumentRequest(`/api/documents/trash?${queryParams.toString()}`);
  },

  restoreDocument: async (documentId: string) => {
    return makeDocumentRequest(`/api/documents/${documentId}/restore`, {
      method: 'POST',
    });
  },

  permanentlyDeleteDocument: async (documentId: string) => {
    return makeDocumentRequest(`/api/documents/${documentId}/permanent`, {
      method: 'DELETE',
    });
  },
};

// Comment Management API
export const commentAPI = {
  // Get document comments
  getDocumentComments: async (documentId: string, versionId?: string) => {
    const url = versionId 
      ? `/api/documents/${documentId}/versions/${versionId}/comments`
      : `/api/documents/${documentId}/comments`;
    return makeDocumentRequest(url);
  },

  // Create comment
  createComment: async (documentId: string, comment: {
    content: string;
    position?: { page: number; x: number; y: number };
    mentions?: string[];
    attachments?: any[];
  }) => {
    return makeDocumentRequest(`/api/documents/${documentId}/comments`, {
      method: 'POST',
      body: JSON.stringify(comment),
    });
  },

  // Update comment
  updateComment: async (commentId: string, updates: {
    content?: string;
    position?: { page: number; x: number; y: number };
    mentions?: string[];
    attachments?: any[];
  }) => {
    return makeDocumentRequest(`/api/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete comment
  deleteComment: async (commentId: string) => {
    return makeDocumentRequest(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  // Toggle comment resolution
  toggleCommentResolution: async (commentId: string, resolved: boolean) => {
    return makeDocumentRequest(`/api/comments/${commentId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolved }),
    });
  },

  // Add reply to comment
  addCommentReply: async (commentId: string, reply: {
    content: string;
    mentions?: string[];
  }) => {
    return makeDocumentRequest(`/api/comments/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify(reply),
    });
  },

  // Update reply
  updateCommentReply: async (commentId: string, replyId: string, updates: {
    content?: string;
    mentions?: string[];
  }) => {
    return makeDocumentRequest(`/api/comments/${commentId}/replies/${replyId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete reply
  deleteCommentReply: async (commentId: string, replyId: string) => {
    return makeDocumentRequest(`/api/comments/${commentId}/replies/${replyId}`, {
      method: 'DELETE',
    });
  },
};

// Version Management API
export const versionAPI = {
  // Get document versions
  getDocumentVersions: async (documentId: string) => {
    return makeDocumentRequest(`/api/documents/${documentId}/versions`);
  },

  // Create new version
  createVersion: async (documentId: string, version: {
    content?: string;
    description?: string;
    changes?: {
      additions: number;
      deletions: number;
      modifications: number;
    };
  }) => {
    return makeDocumentRequest(`/api/documents/${documentId}/versions`, {
      method: 'POST',
      body: JSON.stringify(version),
    });
  },

  // Get specific version
  getVersion: async (versionId: string) => {
    return makeDocumentRequest(`/api/versions/${versionId}`);
  },

  // Update version metadata
  updateVersion: async (versionId: string, updates: {
    tags?: string[];
    approved?: boolean;
    description?: string;
  }) => {
    return makeDocumentRequest(`/api/versions/${versionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete version
  deleteVersion: async (versionId: string) => {
    return makeDocumentRequest(`/api/versions/${versionId}`, {
      method: 'DELETE',
    });
  },

  // Compare two versions
  compareVersions: async (fromVersionId: string, toVersionId: string) => {
    return makeDocumentRequest(`/api/versions/${fromVersionId}/compare/${toVersionId}`);
  },

  // Move document to folder
  moveDocument: async (documentId: string, folderId: string | null) => {
    return makeDocumentRequest(`/api/documents/${documentId}/move`, {
      method: 'POST',
      body: JSON.stringify({ folderId }),
    });
  },

  // Move multiple documents to folder
  moveMultipleDocuments: async (documentIds: string[], folderId: string | null) => {
    return makeDocumentRequest('/api/documents/bulk-move', {
      method: 'POST',
      body: JSON.stringify({ documentIds, folderId }),
    });
  },
};

// Workflow Management API
export const workflowAPI = {
  // Get document workflows
  getDocumentWorkflows: async (documentId: string) => {
    return makeDocumentRequest(`/api/documents/${documentId}/workflows`);
  },

  // Create new workflow
  createWorkflow: async (documentId: string, workflow: {
    name: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    deadline?: string;
    steps: Array<{
      name: string;
      description: string;
      assignee: string;
      assigneeName: string;
      dueDate?: string;
      requiredApprovals: number;
    }>;
    metadata?: any;
  }) => {
    return makeDocumentRequest(`/api/documents/${documentId}/workflows`, {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  },

  // Get specific workflow
  getWorkflow: async (workflowId: string) => {
    return makeDocumentRequest(`/api/workflows/${workflowId}`);
  },

  // Update workflow
  updateWorkflow: async (workflowId: string, updates: any) => {
    return makeDocumentRequest(`/api/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Complete workflow step
  completeWorkflowStep: async (workflowId: string, stepId: string, data: {
    status: 'pending' | 'in_progress' | 'completed' | 'rejected';
    comments?: string;
  }) => {
    return makeDocumentRequest(`/api/workflows/${workflowId}/steps/${stepId}/complete`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete workflow
  deleteWorkflow: async (workflowId: string) => {
    return makeDocumentRequest(`/api/workflows/${workflowId}`, {
      method: 'DELETE',
    });
  },
};

// Folder Management API
export const folderAPI = {
  // Create folder
  createFolder: async (data: {
    name: string;
    description?: string;
    parentId?: string;
    color?: string;
    icon?: string;
  }) => {
    return makeDocumentRequest('/api/folders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get user folders
  getUserFolders: async (params: {
    parentId?: string;
    search?: string;
    includeArchived?: boolean;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/api/folders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeDocumentRequest(endpoint);
  },

  // Get folder details
  getFolder: async (id: string) => {
    return makeDocumentRequest(`/api/folders/${id}`);
  },

  // Update folder
  updateFolder: async (id: string, updates: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    isFavorite?: boolean;
    isArchived?: boolean;
  }) => {
    return makeDocumentRequest(`/api/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete folder
  deleteFolder: async (id: string) => {
    return makeDocumentRequest(`/api/folders/${id}`, {
      method: 'DELETE',
    });
  },

  // Move folder
  moveFolder: async (id: string, newParentId: string | null) => {
    return makeDocumentRequest(`/api/folders/${id}/move`, {
      method: 'POST',
      body: JSON.stringify({ newParentId }),
    });
  },

  // Get folder breadcrumbs
  getFolderBreadcrumbs: async (id: string) => {
    return makeDocumentRequest(`/api/folders/${id}/breadcrumbs`);
  },
};

// Document Analysis API
export const documentAnalysisAPI = {
  // Process document for analysis
  processDocument: async (documentId: string) => {
    return makeDocumentRequest(`/api/document-analysis/${documentId}/process`, {
      method: 'POST',
    });
  },

  // Get document analysis results
  getDocumentAnalysis: async (documentId: string) => {
    return makeDocumentRequest(`/api/document-analysis/${documentId}`);
  },

  // Get analysis processing status
  getAnalysisStatus: async (documentId: string) => {
    return makeDocumentRequest(`/api/document-analysis/${documentId}/status`);
  },

  // Reprocess document analysis
  reprocessDocument: async (documentId: string) => {
    return makeDocumentRequest(`/api/document-analysis/${documentId}/reprocess`, {
      method: 'POST',
    });
  },

  // Get user analyses
  getUserAnalyses: async (userId: string, params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/api/document-analysis/user/${userId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeDocumentRequest(endpoint);
  },

  // Delete analysis
  deleteAnalysis: async (analysisId: string) => {
    return makeDocumentRequest(`/api/document-analysis/${analysisId}`, {
      method: 'DELETE',
    });
  },
};

// Health check for document service
export const documentHealthCheck = async () => {
  try {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Document service health check failed:', error);
    return false;
  }
};

export default {
  apiRequest,
  documentAPI,
  folderAPI,
  documentAnalysisAPI,
  documentHealthCheck,
};
