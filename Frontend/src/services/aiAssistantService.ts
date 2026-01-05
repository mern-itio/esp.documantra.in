import axios from 'axios';

const createApiInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    timeout: 300000, // 5 minutes for AI operations (file uploads, envelope creation, etc.)
    headers: { 'Content-Type': 'application/json' }
  });

  // Request Interceptor
  instance.interceptors.request.use(async (config) => {
    let token: string | null = null;
    try {
      const keys = ['accessToken', 'adminToken', 'userToken', 'token'];
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v) { token = v; break; }
      }
    } catch {}
    if (!token) {
      try {
        const raw = localStorage.getItem('userData');
        if (raw) {
          const parsed = JSON.parse(raw);
          token = parsed?.accessToken || parsed?.token || parsed?.jwt || null;
        }
      } catch {}
    }
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
};

const aiAssistantApi = createApiInstance(
  import.meta.env.VITE_AI_ASSISTANT_SERVICE_URL || 'http://165.22.215.73:2108'
);

export interface AICommandResponse {
  success: boolean;
  action: 'search_document' | 'send_document' | 'prepare_document' | 'create_and_send_envelope' | 'list_auth_providers' | 'generate_document' | null;
  parameters: any;
  clarification: string | null;
  result?: any;
  message?: string;
  conversationId?: string;
  learningEnabled?: boolean; // Flag indicating learning is available
  patternId?: string; // ID of failed pattern for correction recording
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  messageCount: number;
  preview: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | any;
  action?: string | null;
  parameters?: any;
  searchResults?: any[]; // For search_document results
  timestamp?: string;
}

export const aiAssistantApiService = {
  // Process a command with optional file attachments
  processCommand: async (command: string, files?: File | File[] | null, context?: any, conversationId?: string): Promise<AICommandResponse> => {
    const fileArray: File[] =
      !files ? [] :
      files instanceof File ? [files] :
      Array.isArray(files) ? files : [];

    if (fileArray.length > 0) {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('command', command);
      if (conversationId) {
        formData.append('conversationId', conversationId);
      }
      for (const file of fileArray) {
        formData.append('files', file);
      }
      if (context) {
        formData.append('context', JSON.stringify(context));
      }
      
      const response = await aiAssistantApi.post('/api/ai-assistant/command', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000 // 5 minutes for file uploads
      });
      return response.data;
    } else {
      // Regular JSON request
      const response = await aiAssistantApi.post('/api/ai-assistant/command', {
        command,
        context,
        conversationId
      });
      return response.data;
    }
  },

  // Get conversation history (specific or most recent)
  getConversationHistory: async (conversationId?: string, limit: number = 50): Promise<{ success: boolean; conversationId?: string; title?: string; messages: ConversationMessage[] }> => {
    const response = await aiAssistantApi.get('/api/ai-assistant/conversation', {
      params: { conversationId, limit }
    });
    return response.data;
  },

  // List all conversations
  listConversations: async (limit: number = 50): Promise<{ success: boolean; conversations: Conversation[] }> => {
    const response = await aiAssistantApi.get('/api/ai-assistant/conversations', {
      params: { limit }
    });
    return response.data;
  },

  // Create new conversation
  createConversation: async (title?: string): Promise<{ success: boolean; conversationId: string; title: string }> => {
    const response = await aiAssistantApi.post('/api/ai-assistant/conversations', {
      title: title || 'New Chat'
    });
    return response.data;
  },

  // Update conversation title
  updateConversationTitle: async (conversationId: string, title: string): Promise<{ success: boolean; conversationId: string; title: string }> => {
    const response = await aiAssistantApi.put(`/api/ai-assistant/conversations/${conversationId}/title`, {
      title
    });
    return response.data;
  },

  // Delete conversation
  deleteConversation: async (conversationId: string): Promise<{ success: boolean; message: string }> => {
    const response = await aiAssistantApi.delete(`/api/ai-assistant/conversations/${conversationId}`);
    return response.data;
  },

  // Clear conversation (deprecated - kept for backward compatibility)
  clearConversation: async (): Promise<{ success: boolean; message: string }> => {
    const response = await aiAssistantApi.delete('/api/ai-assistant/conversation');
    return response.data;
  },

  // Sync documents for indexing
  syncDocuments: async (): Promise<{ success: boolean; message: string; indexed?: number }> => {
    const response = await aiAssistantApi.post('/api/ai-assistant/sync-documents');
    return response.data;
  },

  // Learning system APIs
  recordUserCorrection: async (patternId: string, userCorrection: {
    action: string;
    parameters: any;
    description?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> => {
    const response = await aiAssistantApi.post('/api/ai-assistant/learning/correction', {
      patternId,
      userCorrection
    });
    return response.data;
  },

  getLearningStats: async (): Promise<{ success: boolean; data?: any }> => {
    const response = await aiAssistantApi.get('/api/ai-assistant/learning/stats');
    return response.data;
  },

  getLearnedPatterns: async (command: string): Promise<{ success: boolean; data?: any[] }> => {
    const response = await aiAssistantApi.get('/api/ai-assistant/learning/patterns', {
      params: { command }
    });
    return response.data;
  },

  recordUserAction: async (action: string, parameters: any, source: string = 'manual', metadata?: any): Promise<{ success: boolean; data?: any }> => {
    const response = await aiAssistantApi.post('/api/ai-assistant/learning/action', {
      action,
      parameters,
      source,
      metadata
    });
    return response.data;
  },

  // AI Co-Pilot: Parse natural language command to field placements
  parseFieldCommand: async (command: string, context: any): Promise<any> => {
    const response = await aiAssistantApi.post('/api/ai-assistant/copilot/parse-command', {
      command,
      context
    });
    return response.data;
  },

  // AI Co-Pilot: Analyze PDF for field suggestions
  analyzePDFForSuggestions: async (pdfFile: File, options?: {
    fieldTypes?: string[];
    minConfidence?: number;
  }): Promise<any> => {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    if (options?.fieldTypes) {
      formData.append('fieldTypes', JSON.stringify(options.fieldTypes));
    }
    if (options?.minConfidence !== undefined) {
      formData.append('minConfidence', options.minConfidence.toString());
    }
    const response = await aiAssistantApi.post('/api/ai-assistant/copilot/analyze-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // AI Co-Pilot: Check constraints
  checkConstraints: async (context: any): Promise<any> => {
    const response = await aiAssistantApi.post('/api/ai-assistant/copilot/check-constraints', {
      context
    });
    return response.data;
  }
};

