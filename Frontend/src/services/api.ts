import { API_CONFIG } from '../config/environment';

// Base API configuration for document service
const DOCUMENT_API_BASE_URL = import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:4002';

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
  // Check multiple possible token locations
  const token = 
    localStorage.getItem('accessToken') || // Check accessToken first (as used in auth API)
    localStorage.getItem('token') || // Check for generic token
    localStorage.getItem('userToken') || // Check for userToken
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
    const response = await makeDocumentRequest(`/api/documents/${id}/download`, {
      method: 'POST',
    });
    
    // Handle file download
    if (response && response.success) {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = response.data.url || `${DOCUMENT_API_BASE_URL}/api/documents/${id}/download`;
      link.download = response.data.filename || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    return response;
  },

  // Bulk delete documents
  bulkDeleteDocuments: async (documentIds: string[]) => {
    return makeDocumentRequest('/api/documents/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ documentIds }),
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
  documentHealthCheck,
};
