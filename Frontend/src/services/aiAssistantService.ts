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
  action: 'search_document' | 'send_document' | 'prepare_document' | 'create_and_send_envelope' | null;
  parameters: any;
  clarification: string | null;
  result?: any;
  message?: string;
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
  // Process a command with optional file attachment
  processCommand: async (command: string, file?: File | null, context?: any): Promise<AICommandResponse> => {
    if (file) {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('command', command);
      formData.append('file', file);
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
        context
      });
      return response.data;
    }
  },

  // Get conversation history
  getConversationHistory: async (limit: number = 50): Promise<{ success: boolean; messages: ConversationMessage[] }> => {
    const response = await aiAssistantApi.get('/api/ai-assistant/conversation', {
      params: { limit }
    });
    return response.data;
  },

  // Clear conversation
  clearConversation: async (): Promise<{ success: boolean; message: string }> => {
    const response = await aiAssistantApi.delete('/api/ai-assistant/conversation');
    return response.data;
  },

  // Sync documents for indexing
  syncDocuments: async (): Promise<{ success: boolean; message: string; indexed?: number }> => {
    const response = await aiAssistantApi.post('/api/ai-assistant/sync-documents');
    return response.data;
  }
};

