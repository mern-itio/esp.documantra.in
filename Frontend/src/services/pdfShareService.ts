import { apiRequest } from './api';

// Base URL for document service
import { withAuthFetch } from '../utils/authSession';

const DOCUMENT_API_BASE_URL = import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:2102';

export interface PDFShareRecipient {
  email: string;
  name?: string;
}

export interface PDFShareRequest {
  documentId: string;
  toRecipients: PDFShareRecipient[];
  ccRecipients?: PDFShareRecipient[];
  bccRecipients?: PDFShareRecipient[];
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
    credits?: { creditsBalance: number; debited: number };
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
  toRecipients: Array<{
    email: string;
    name: string;
    hasViewed: boolean;
    viewedAt?: string;
    emailSent: boolean;
    emailSentAt?: string;
  }>;
  ccRecipients: Array<{
    email: string;
    name: string;
    hasViewed: boolean;
    viewedAt?: string;
    emailSent: boolean;
    emailSentAt?: string;
  }>;
  bccRecipients: Array<{
    email: string;
    name: string;
    hasViewed: boolean;
    viewedAt?: string;
    emailSent: boolean;
    emailSentAt?: string;
  }>;
  recipients: Array<{
    email: string;
    name: string;
    isCC: boolean;
    hasViewed: boolean;
    viewedAt?: string;
    emailSent: boolean;
    emailSentAt?: string;
  }>; // Legacy support
  viewCount: number;
  downloadCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  allowComments?: boolean;
  isOwner?: boolean;
}

export interface Comment {
  _id: string;
  documentId: string;
  author: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  position: {
    page: number;
    x: number;
    y: number;
  };
  timestamp: string;
  replies: Array<{
    _id: string;
    author: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    timestamp: string;
    mentions: string[];
  }>;
  resolved: boolean;
  mentions: string[];
  attachments: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  resolvedBy?: string;
  resolvedAt?: string;
  isAdminComment?: boolean;
  adminUserId?: string;
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

    const response = await fetch(`${DOCUMENT_API_BASE_URL}/api/pdf-share/upload`, withAuthFetch({
      method: 'POST',
      body: formData,
    }));

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
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/api/pdf-share/share`, withAuthFetch({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }));

    // Pass through detailed credit errors
    if (!response.ok) {
      let body: any = null;
      try { body = await response.json(); } catch {}
      const err: any = new Error(body?.message || 'Failed to share document');
      err.response = { status: response.status, data: body?.data || null };
      throw err;
    }

    return response.json();
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
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (email) queryParams.append('email', email);
    if (password) queryParams.append('password', password);
    
    const url = `${DOCUMENT_API_BASE_URL}/public/pdf-share/${shareToken}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to load document' }));
      throw new Error(errorData.message || 'Failed to load document');
    }

    return response.json();
  },

  /**
   * Get comments for shared document
   */
  async getSharedDocumentComments(shareToken: string): Promise<{
    success: boolean;
    data: Comment[];
  }> {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/public/pdf-share/${shareToken}/comments`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to load comments' }));
      throw new Error(errorData.message || 'Failed to load comments');
    }

    return response.json();
  },

  /**
   * Get comments for shared document (authenticated - for admins)
   */
  async getSharedDocumentCommentsAuth(shareToken: string): Promise<{
    success: boolean;
    data: Comment[];
  }> {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/api/pdf-share/comments/${shareToken}`, withAuthFetch({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to load comments' }));
      throw new Error(errorData.message || 'Failed to load comments');
    }

    return response.json();
  },

  /**
   * Add comment to shared document
   */
  async addSharedDocumentComment(shareToken: string, comment: {
    content: string;
    position?: { page: number; x: number; y: number };
    authorName?: string;
    authorEmail?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: Comment;
  }> {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/public/pdf-share/${shareToken}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comment),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to add comment' }));
      throw new Error(errorData.message || 'Failed to add comment');
    }

    return response.json();
  },

  /**
   * Add admin comment to shared document (authenticated)
   */
  async addAdminComment(shareToken: string, comment: {
    content: string;
    position?: { page: number; x: number; y: number };
  }): Promise<{
    success: boolean;
    message: string;
    data: Comment;
  }> {
    const response = await fetch(`${DOCUMENT_API_BASE_URL}/api/pdf-share/admin-comment/${shareToken}`, withAuthFetch({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comment),
    }));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to add admin comment' }));
      throw new Error(errorData.message || 'Failed to add admin comment');
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
