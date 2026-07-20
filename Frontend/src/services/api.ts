import { API_CONFIG } from '../config/environment';
import { getAccountContextHeaders, withAuthFetch } from '../utils/authSession';

// Base API configuration for document service
const DOCUMENT_API_BASE_URL = import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:2102';

// API Configuration
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_CONFIG.BASE_URL}/login`,
    LOGIN_PUBLIC_KEY: `${API_CONFIG.BASE_URL}/login/public-key`,
    GOOGLE_LOGIN: `${API_CONFIG.BASE_URL}/google-login`,
    VERIFY_2FA_LOGIN: `${API_CONFIG.BASE_URL}/2fa/verify-login`,
    GET_2FA_RECOVERY_QUESTIONS: `${API_CONFIG.BASE_URL}/2fa/recovery/questions`,
    VERIFY_2FA_RECOVERY_ANSWER: `${API_CONFIG.BASE_URL}/2fa/recovery/verify-answer`,
    VERIFY_2FA_RECOVERY_ANSWERS: `${API_CONFIG.BASE_URL}/2fa/recovery/verify-answers`,
    VERIFY_2FA_RECOVERY_OTP: `${API_CONFIG.BASE_URL}/2fa/recovery/verify-otp`,
    REGISTER: `${API_CONFIG.BASE_URL}/register`,
    SIGNUP_REQUEST_EMAIL_VERIFICATION: `${API_CONFIG.BASE_URL}/signup/request-email-verification`,
    SIGNUP_CONFIRM_EMAIL_VERIFICATION: `${API_CONFIG.BASE_URL}/signup/confirm-email-verification`,
    SIGNUP_SEND_EMAIL_OTP: `${API_CONFIG.BASE_URL}/signup/send-email-otp`,
    SIGNUP_VERIFY_EMAIL_OTP: `${API_CONFIG.BASE_URL}/signup/verify-email-otp`,
    SIGNUP_SEND_PHONE_OTP: `${API_CONFIG.BASE_URL}/signup/send-phone-otp`,
    SIGNUP_VERIFY_PHONE_OTP: `${API_CONFIG.BASE_URL}/signup/verify-phone-otp`,
    STATUS: `${API_CONFIG.BASE_URL}/api/auth/status`,
    ME: `${API_CONFIG.BASE_URL}/api/auth/me`,
    LOGOUT: `${API_CONFIG.BASE_URL}/api/auth/logout`,
  },
};

export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const config: RequestInit = withAuthFetch({
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAccountContextHeaders(),
      ...(options.headers || {}),
    },
  });

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Document service uses httpOnly cookie auth (M14).
const makeDocumentRequest = async (
  endpoint: string,
  options: RequestInit = {},
  isFormData: boolean = false
): Promise<any> => {

  // Check for document upload/share and validate credits
  const isDocumentUpload = options.method === 'POST' && endpoint.includes('/upload');
  const isDocumentShare = options.method === 'POST' && endpoint.includes('/share') && !endpoint.includes('pdf-share');
  const isPDFShare = options.method === 'POST' && (endpoint.includes('/pdf-share/upload') || endpoint.includes('/pdf-share/share'));
  
  if (isDocumentUpload) {
    try {
      const storedPlan = localStorage.getItem('userSubscriptionPlan');
      if (storedPlan) {
        const plan = JSON.parse(storedPlan);
        const creditsBalance = plan.creditsBalance ?? 0;
        const documentCosts = plan.documentCosts;
        const required = documentCosts?.credits ?? 0;

        if (required > 0 && creditsBalance < required) {
          // Dispatch error toast
          try { 
            window.dispatchEvent(new CustomEvent('app:toast', { 
              detail: { 
                message: `Insufficient credits for document upload. Requires ${required}, you have ${creditsBalance}.`, 
                type: 'error', 
                cta: { 
                  label: 'View Plan', 
                  action: () => {
                    window.dispatchEvent(new CustomEvent('app:open-plans-modal'));
                  }
                } 
              } 
            })); 
          } catch {}
          
          const error: any = new Error('Insufficient credits');
          error.response = { status: 402, data: { message: 'Insufficient credits', required, creditsBalance } };
          throw error;
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Insufficient credits') {
        throw error;
      }
      // Continue if it's a different error
    }
  }

  // Check for document share
  if (isDocumentShare) {
    try {
      const storedPlan = localStorage.getItem('userSubscriptionPlan');
      if (storedPlan) {
        const plan = JSON.parse(storedPlan);
        const creditsBalance = plan.creditsBalance ?? 0;
        const shareCosts = plan.shareCosts;
        const required = shareCosts?.credits ?? 0;

        if (required > 0 && creditsBalance < required) {
          console.log('❌ INSUFFICIENT CREDITS FOR DOCUMENT SHARE! Required:', required, 'Have:', creditsBalance);
          try { 
            window.dispatchEvent(new CustomEvent('app:toast', { 
              detail: { 
                message: `Insufficient credits for document share. Requires ${required}, you have ${creditsBalance}.`, 
                type: 'error', 
                cta: { 
                  label: 'View Plan', 
                  action: () => {
                    window.dispatchEvent(new CustomEvent('app:open-plans-modal'));
                  }
                } 
              } 
            })); 
          } catch {}
          const error: any = new Error('Insufficient credits');
          error.response = { status: 402, data: { message: 'Insufficient credits', required, creditsBalance } };
          throw error;
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Insufficient credits') {
        throw error;
      }
    }
  }

  // Check for PDF share
  if (isPDFShare) {
    try {
      const storedPlan = localStorage.getItem('userSubscriptionPlan');
      if (storedPlan) {
        const plan = JSON.parse(storedPlan);
        const creditsBalance = plan.creditsBalance ?? 0;
        const pdfShareCosts = plan.pdfShareCosts;
        const required = pdfShareCosts?.credits ?? 0;

        if (required > 0 && creditsBalance < required) {
          console.log('❌ INSUFFICIENT CREDITS FOR PDF SHARE! Required:', required, 'Have:', creditsBalance);
          try { 
            window.dispatchEvent(new CustomEvent('app:toast', { 
              detail: { 
                message: `Insufficient credits for PDF share. Requires ${required}, you have ${creditsBalance}.`, 
                type: 'error', 
                cta: { 
                  label: 'View Plan', 
                  action: () => {
                    window.dispatchEvent(new CustomEvent('app:open-plans-modal'));
                  }
                } 
              } 
            })); 
          } catch {}
          const error: any = new Error('Insufficient credits');
          error.response = { status: 402, data: { message: 'Insufficient credits', required, creditsBalance } };
          throw error;
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Insufficient credits') {
        throw error;
      }
    }
  }

  const url = `${DOCUMENT_API_BASE_URL}${endpoint}`;

  const config: RequestInit = withAuthFetch({
    ...options,
    headers: {
      ...getAccountContextHeaders(),
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });

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

    // Consume credits after successful operations
    if ((isDocumentUpload || isDocumentShare || isPDFShare) && response.ok) {
      try {
        const storedPlan = localStorage.getItem('userSubscriptionPlan');
        if (storedPlan) {
          const plan = JSON.parse(storedPlan);
          let required = 0;
          let action = '';
          
          if (isDocumentUpload) {
            const documentCosts = plan.documentCosts;
            required = documentCosts?.credits ?? 0;
            action = 'document:upload';
          } else if (isDocumentShare) {
            const shareCosts = plan.shareCosts;
            required = shareCosts?.credits ?? 0;
            action = 'document:share';
          } else if (isPDFShare) {
            const pdfShareCosts = plan.pdfShareCosts;
            required = pdfShareCosts?.credits ?? 0;
            action = 'pdf:share';
          }

          if (required > 0) {
            // Update local balance
            const newBalance = (plan.creditsBalance || 0) - required;
            plan.creditsBalance = newBalance;
            localStorage.setItem('userSubscriptionPlan', JSON.stringify(plan));

            // Call consume API in background (fire and forget)
            try {
              const subscriptionServiceUrl = import.meta.env.VITE_SUBSCRIPTION_SERVICE_URL || 'http://localhost:2110';
              fetch(`${subscriptionServiceUrl}/usage/consume`, withAuthFetch({
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, credits: required }),
              })).catch(() => {});
            } catch {}
          }
        }
      } catch {}
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
      const response = await fetch(`${DOCUMENT_API_BASE_URL}/api/documents/${id}/download`, withAuthFetch({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }));

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
  // completeWorkflowStep: async (workflowId: string, stepId: string, data: {
  //   status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  //   comments?: string;
  // }) => {
  //   return makeDocumentRequest(`/api/workflows/${workflowId}/steps/${stepId}/complete`, {
  //     method: 'PUT',
  //     body: JSON.stringify(data),
  //   });
  // },

  // Delete workflow
  deleteWorkflow: async (workflowId: string) => {
    return makeDocumentRequest(`/api/workflows/${workflowId}`, {
      method: 'DELETE',
    });
  },

  // Update workflow step (start/pause timer)
  updateWorkflowStep: async (workflowId: string, stepId: string, data: {
    action: 'start' | 'pause';
  }) => {
    return makeDocumentRequest(`/api/workflows/${workflowId}/steps/${stepId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Complete workflow step (completed/rejected)
  completeWorkflowStep: async (workflowId: string, stepId: string, data: {
    status: 'pending' | 'in_progress' | 'completed' | 'rejected';
    comments?: string;
  }) => {
    return makeDocumentRequest(`/api/workflows/${workflowId}/steps/${stepId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Add comment to workflow step
  addWorkflowStepComment: async (workflowId: string, stepId: string, data: {
    comment: string;
  }) => {
    return makeDocumentRequest(`/api/workflows/${workflowId}/steps/${stepId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  // In workflowAPI object
  updateWorkflowStepProgress: async (workflowId: string, stepId: string, data: {
    progressPercentage?: number;
  }) => {
    return makeDocumentRequest(`/api/workflows/${workflowId}/steps/${stepId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Update workflow step action status (approve/reject/drop) - Creator only
  updateStepActionStatus: async (workflowId: string, stepId: string, data: {
    actionStatus: 'approved' | 'rejected' | 'dropped';
    comments?: string; 
    requestRedo?: boolean;// Optional for 'approved', Required for 'rejected' and 'dropped'
  }) => {
    return makeDocumentRequest(`/api/workflows/${workflowId}/steps/${stepId}/action`, {
      method: 'PATCH',
      body: JSON.stringify(data),
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