import { apiRequest } from './api';

// Base URL for document service
const DOCUMENT_API_BASE_URL = import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:2102';

export interface PDFShareRecipient {
  email: string;
  name?: string;
  isCC?: boolean;
}

export interface PDFShareRequest {
  documentId: string;
  recipients: PDFShareRecipient[];
  subject?: string;
  message?: string;
  allowDownload?: boolean;
  allowComments?: boolean;
  expiresAt?: string;
  password?: string;
}

export interface PDFShareResponse {
  success: boolean;
  message: string;
  data: {
    shareToken: string;
    shareUrl: string;
    documentName: string;
    recipients: Array<{
      email: string;
      sent: boolean;
      error?: string;
    }>;
    expiresAt?: string;
    allowDownload: boolean;
    allowComments: boolean;
  };
}

export interface SharedDocument {
  id: string;
  shareToken: string;
  shareUrl: string;
  document: {
    id: string;
    name: string;
    size: number;
    createdAt: string;
  };
  recipients: Array<{
    email: string;
    name: string;
    isCC: boolean;
    hasViewed: boolean;
    viewedAt?: string;
    emailSent: boolean;
    emailSentAt?: string;
  }>;
  viewCount: number;
  downloadCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface PDFUploadResponse {
  success: boolean;
  message: string;
  data: {
    documentId: string;
    fileName: string;
    fileSize: number;
    uploadDate: string;
  };
}

export const pdfShareService = {
  /**
   * Upload PDF for sharing
   */
  async uploadPDFForSharing(file: File): Promise<PDFUploadResponse> {
    const formData = new FormData();
    formData.append('pdf', file);

    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/api/pdf-share/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(errorData.message || 'Failed to upload PDF');
    }

    return response.json();
  },

  /**
   * Create share link and send emails
   */
  async createShareAndSendEmails(request: PDFShareRequest): Promise<PDFShareResponse> {
    return apiRequest(`${DOCUMENT_API_BASE_URL}/api/pdf-share/share`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get user's shared documents
   */
  async getUserSharedDocuments(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<{
    success: boolean;
    data: {
      sharedDocuments: SharedDocument[];
      pagination: {
        current: number;
        pages: number;
        total: number;
      };
    };
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `${DOCUMENT_API_BASE_URL}/api/pdf-share/my-shares${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(endpoint);
  },

  /**
   * Revoke shared document
   */
  async revokeSharedDocument(shareToken: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiRequest(`${DOCUMENT_API_BASE_URL}/api/pdf-share/revoke/${shareToken}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get shared document (public access)
   */
  async getSharedDocument(shareToken: string, email?: string, password?: string): Promise<{
    success: boolean;
    data: {
      document: {
        id: string;
        name: string;
        size: number;
        createdAt: string;
      };
      share: {
        shareToken: string;
        ownerName: string;
        allowDownload: boolean;
        allowComments: boolean;
        message: string;
        expiresAt?: string;
        viewCount: number;
      };
    };
  }> {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/public/pdf-share/view/${shareToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to load document' }));
      throw new Error(errorData.message || 'Failed to load document');
    }

    return response.json();
  },

  /**
   * Download shared document
   */
  async downloadSharedDocument(shareToken: string, password?: string): Promise<Blob> {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/public/pdf-share/download/${shareToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to download document');
    }

    return response.blob();
  }
};
