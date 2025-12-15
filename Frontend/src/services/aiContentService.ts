import axios from 'axios';

const TEMPLATE_SERVICE_URL = import.meta.env.VITE_TEMPLATE_SERVICE_URL || 'http://165.22.215.73:2106';

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

export const aiContentService = {
  /**
   * Generate AI content for legal template
   */
  async generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
    const response = await api.post('/public/ai-content/generate', request);
    return response.data;
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
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
