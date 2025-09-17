const PDF_API_BASE_URL = import.meta.env.VITE_PDF_API_BASE_URL || 'http://localhost:2104';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  const token = 
    localStorage.getItem('accessToken') || 
    (() => {
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
    console.warn('No authentication token found for PDF service');
  }

  return token;
};

// Helper function to make authenticated requests to PDF service
const makePDFRequest = async (
  endpoint: string,
  options: RequestInit = {},
  isFormData: boolean = false
): Promise<any> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication token not found');
  }

  const url = `${PDF_API_BASE_URL}${endpoint}`;
  
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

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('PDF API request failed:', error);
    throw error;
  }
};

// Workflow Template Types
export interface WorkflowStep {
  id: string;
  toolId: string;
  name: string;
  order: number;
  settings?: Record<string, any>;
  isOptional?: boolean;
  conditions?: {
    dependsOn?: string[];
    skipIf?: string;
  };
}

export interface WorkflowTemplate {
  _id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isTemplate: boolean;
  isPublic: boolean;
  createdBy: string;
  createdByName: string;
  category: string;
  tags: string[];
  usage: number;
  avgTime: string;
  metadata: {
    estimatedDuration?: number;
    complexity: 'easy' | 'medium' | 'hard';
    inputFormats: string[];
    outputFormats: string[];
    features: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  _id: string;
  templateId: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  steps: Array<{
    stepId: string;
    toolId: string;
    name: string;
    order: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    settings: Record<string, any>;
    inputFile?: string;
    outputFile?: string;
    startedAt?: string;
    completedAt?: string;
    error?: string;
    result?: any;
    logs?: string[];
  }>;
  inputFile: string;
  outputFile?: string;
  createdBy: string;
  createdByName: string;
  startedAt?: string;
  completedAt?: string;
  totalDuration?: number;
  metadata: {
    originalFileName: string;
    originalFileSize: number;
    finalFileSize?: number;
    compressionRatio?: number;
    processingNotes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Workflow Template API
export const workflowTemplateAPI = {
  // Get all workflow templates
  getWorkflowTemplates: async (params: {
    category?: string;
    search?: string;
    isPublic?: boolean;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/workflows/templates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makePDFRequest(endpoint);
  },

  // Get a specific workflow template
  getWorkflowTemplate: async (templateId: string) => {
    return makePDFRequest(`/workflows/templates/${templateId}`);
  },

  // Create a new workflow template
  createWorkflowTemplate: async (template: {
    name: string;
    description: string;
    steps: WorkflowStep[];
    category?: string;
    tags?: string[];
    isPublic?: boolean;
    metadata?: any;
  }) => {
    return makePDFRequest('/workflows/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  },

  // Update a workflow template
  updateWorkflowTemplate: async (templateId: string, updates: Partial<WorkflowTemplate>) => {
    return makePDFRequest(`/workflows/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete a workflow template
  deleteWorkflowTemplate: async (templateId: string) => {
    return makePDFRequest(`/workflows/templates/${templateId}`, {
      method: 'DELETE',
    });
  },

  // Duplicate a workflow template
  duplicateWorkflowTemplate: async (templateId: string) => {
    return makePDFRequest(`/workflows/templates/${templateId}/duplicate`, {
      method: 'POST',
    });
  },
};

// Workflow Execution API
export const workflowExecutionAPI = {
  // Execute a workflow
  executeWorkflow: async (templateId: string, file: File, options: {
    customName?: string;
    customDescription?: string;
    steps?: WorkflowStep[];
  } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options.customName) formData.append('customName', options.customName);
    if (options.customDescription) formData.append('customDescription', options.customDescription);
    if (options.steps) formData.append('steps', JSON.stringify(options.steps));

    return makePDFRequest(`/workflows/templates/${templateId}/execute`, {
      method: 'POST',
      body: formData,
    }, true);
  },

  // Get workflow execution status
  getWorkflowExecution: async (executionId: string) => {
    return makePDFRequest(`/workflows/executions/${executionId}`);
  },

  // Download workflow execution result
  downloadWorkflowResult: async (executionId: string) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${PDF_API_BASE_URL}/workflows/executions/${executionId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download workflow result');
    }

    return response.blob();
  },

  // Get user's workflow executions
  getUserWorkflowExecutions: async (params: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/workflows/executions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makePDFRequest(endpoint);
  },

  // Cancel workflow execution
  cancelWorkflowExecution: async (executionId: string) => {
    return makePDFRequest(`/workflows/executions/${executionId}/cancel`, {
      method: 'POST',
    });
  },
};

// Health check for PDF service
export const pdfServiceHealthCheck = async () => {
  try {
    const response = await fetch(`${PDF_API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('PDF service health check failed:', error);
    return false;
  }
};

export default {
  workflowTemplateAPI,
  workflowExecutionAPI,
  pdfServiceHealthCheck,
};
