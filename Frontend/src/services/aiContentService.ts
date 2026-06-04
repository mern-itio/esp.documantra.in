import axios from 'axios';

const TEMPLATE_SERVICE_URL = import.meta.env.VITE_TEMPLATE_SERVICE_URL || 'https://esp.documantra.in/template';

// Create axios instance
const api = axios.create({
  baseURL: TEMPLATE_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface GenerateContentRequest {
  templateType: string;
  requirements: string;
  formData?: Record<string, any>;
}

export interface GenerateContentResponse {
  success: boolean;
  message: string;
  data: {
    content: string;
    templateType: string;
    tokensUsed: number;
  };
}

export interface ConvertToPDFRequest {
  content: string;
  documentName?: string;
}

export interface ConvertToPDFResponse {
  success: boolean;
  message: string;
  data: {
    fileName: string;
    filePath: string;
    fileSize: number;
    base64: string;
  };
}

export interface StorePendingDocumentRequest {
  documentName?: string;
  content: string;
  templateType: string;
  templateData?: Record<string, any>;
  sessionId?: string;
}

export interface StorePendingDocumentResponse {
  success: boolean;
  message: string;
  data: {
    documentId: string;
    sessionId: string;
  };
}

export interface GetPendingDocumentResponse {
  success: boolean;
  data: {
    documentId: string;
    documentName: string;
    content: string;
    templateType: string;
    templateData: Record<string, any>;
    sessionId: string;
    createdAt: string;
  };
}

export interface StreamingCallbacks {
  onToken?: (token: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

export const aiContentService = {
  /**
   * Generate AI content for legal template (non-streaming)
   */
  async generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
    const response = await api.post('/public/ai-content/generate', request);
    return response.data;
  },

  /**
   * Generate AI content with TRUE STREAMING from backend
   * This provides real-time token streaming from OpenAI via Server-Sent Events
   */
  async generateContentStreaming(
    request: GenerateContentRequest,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    try {
      const response = await fetch(`${TEMPLATE_SERVICE_URL}/public/ai-content/generate-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to generate content'
        }));
        throw new Error(errorData.message || 'Failed to generate content');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (!reader) {
        throw new Error('No reader available - streaming not supported');
      }

      let buffer = ''; // Buffer for incomplete lines

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          callbacks.onComplete?.(fullContent);
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Split by newlines to handle multiple SSE messages
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          // SSE format: "data: {json}" or "data: [DONE]"
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            // Check for completion marker
            if (data === '[DONE]') {
              callbacks.onComplete?.(fullContent);
              return;
            }
            
            // Skip empty data
            if (!data) continue;
            
            try {
              const parsed = JSON.parse(data);
              
              // Handle error in stream
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              
              // Extract token/content from various possible formats
              const token = parsed.content || parsed.token || parsed.delta?.content || '';
              
              if (token) {
                fullContent += token;
                callbacks.onToken?.(token);
              }
            } catch (parseError) {
              // Log parse errors but continue streaming
              console.warn('Failed to parse SSE data:', data, parseError);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error in streaming:', error);
      callbacks.onError?.(error);
    }
  },

  /**
   * Simulated streaming (fallback if streaming endpoint not available or fails)
   * This simulates typing by breaking up the full response
   */
  async generateContentWithTyping(
    request: GenerateContentRequest,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    try {
      // Get full response first
      const response = await this.generateContent(request);
      
      if (!response.success || !response.data.content) {
        throw new Error(response.message || 'Failed to generate content');
      }

      const content = response.data.content;
      let index = 0;
      
      // Simulate typing effect with varying speeds
      const typeNextChunk = () => {
        if (index >= content.length) {
          callbacks.onComplete?.(content);
          return;
        }

        // Variable chunk size for more natural typing
        // Longer chunks for spaces and punctuation
        let chunkSize: number;
        const currentChar = content[index];
        
        if (currentChar === ' ') {
          // Fast through spaces
          chunkSize = 1;
        } else if (currentChar === '\n') {
          // Handle newlines
          chunkSize = 1;
        } else if (['.', ',', '!', '?', ';', ':'].includes(currentChar)) {
          // Pause slightly at punctuation
          chunkSize = 1;
        } else {
          // Regular characters - type 2-5 at a time
          chunkSize = Math.floor(Math.random() * 4) + 2;
        }
        
        const chunk = content.slice(index, index + chunkSize);
        index += chunkSize;

        callbacks.onToken?.(chunk);

        // Variable delay based on content
        let delay: number;
        if (currentChar === '\n') {
          delay = 100; // Longer pause for newlines
        } else if (['.', '!', '?'].includes(currentChar)) {
          delay = 150; // Longer pause for sentence endings
        } else if ([',', ';', ':'].includes(currentChar)) {
          delay = 80; // Medium pause for mid-sentence punctuation
        } else {
          delay = Math.floor(Math.random() * 30) + 20; // 20-50ms for regular text
        }
        
        setTimeout(typeNextChunk, delay);
      };

      // Start typing with a small initial delay
      setTimeout(typeNextChunk, 100);
      
    } catch (error: any) {
      console.error('Error in simulated streaming:', error);
      callbacks.onError?.(error);
    }
  },

  /**
   * Generate content with automatic fallback
   * Tries true streaming first, falls back to simulated streaming if it fails
   */
  async generateContentWithFallback(
    request: GenerateContentRequest,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    try {
      // Try true streaming first
      await this.generateContentStreaming(request, callbacks);
    } catch (streamError) {
      console.warn('True streaming failed, falling back to simulated streaming:', streamError);
      
      try {
        // Fallback to simulated streaming
        await this.generateContentWithTyping(request, callbacks);
      } catch (fallbackError) {
        console.error('Both streaming methods failed:', fallbackError);
        callbacks.onError?.(fallbackError as Error);
      }
    }
  },
// Submit feedback
submitFeedback: async (feedbackData: {
  messageId: string;
  sessionId: string;
  feedbackType: 'like' | 'dislike';
  feedbackComment?: string;
  templateType?: string;
  userMessage?: string;
  aiResponse?: string;
  categories?: number[];
}) => {
  const response = await fetch(`${TEMPLATE_SERVICE_URL}/public/ai-content/ai-feedback/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('token') && {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      })
    },
    body: JSON.stringify(feedbackData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit feedback');
  }

  return response.json();
},

// Get feedback categories
getFeedbackCategories: async () => {
  const response = await fetch(`${TEMPLATE_SERVICE_URL}/ai-feedback/categories`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
},

// Get feedback for a message
getMessageFeedback: async (messageId: string, sessionId: string) => {
  const response = await fetch(
    `${TEMPLATE_SERVICE_URL}/ai-feedback/message/${messageId}?sessionId=${sessionId}`,
    {
      headers: {
        ...(localStorage.getItem('token') && {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        })
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch feedback');
  }

  return response.json();
},
  /**
   * Convert text content to PDF
   */
  async convertToPDF(request: ConvertToPDFRequest): Promise<ConvertToPDFResponse> {
    const response = await api.post('/public/ai-content/convert-to-pdf', request);
    return response.data;
  },

  /**
   * Store document for unauthorized user
   */
  async storePendingDocument(request: StorePendingDocumentRequest): Promise<StorePendingDocumentResponse> {
    const response = await api.post('/public/ai-content/store-pending', request);
    return response.data;
  },

  /**
   * Get pending document by ID or session ID
   */
  async getPendingDocument(documentId?: string, sessionId?: string): Promise<GetPendingDocumentResponse> {
    const params = new URLSearchParams();
    if (documentId) params.append('documentId', documentId);
    if (sessionId) params.append('sessionId', sessionId);
    
    const response = await api.get(`/public/ai-content/pending-document?${params.toString()}`);
    return response.data;
  },

  /**
   * Delete pending document
   */
  async deletePendingDocument(documentId: string): Promise<void> {
    await api.delete(`/public/ai-content/pending-document/${documentId}`);
  },

  /**
   * Download PDF from base64
   */
  downloadPDF(base64: string, fileName: string): void {
    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw new Error('Failed to download PDF');
    }
  },
};