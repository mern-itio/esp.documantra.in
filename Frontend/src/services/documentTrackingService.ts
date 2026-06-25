import axios from 'axios';
import { getAccountContextHeaders, getCurrentUserId, getUserProfileSnapshot, isLoggedInSnapshot } from '../utils/authSession';
import type { 
  DocumentTrackingResponse, 
  TrackedDocumentsResponse,
  LogEventRequest, 
  LogEventResponse, 
  TrackingFilters, 
  ExportRequest,
  UploadDocumentRequest,
  UploadDocumentResponse,
  DashboardStatsResponse,
  AuditTrailResponse,
  UserActivityResponse
} from '../types/documentTracking';

const API_BASE_URL = import.meta.env?.VITE_PDF_SERVICE_URL || 'http://localhost:2104';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const accountHeaders = getAccountContextHeaders();
    Object.entries(accountHeaders).forEach(([key, value]) => {
      config.headers[key] = value;
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const documentTrackingService = {
  // Log an event
  async logEvent(request: LogEventRequest): Promise<LogEventResponse> {
    const response = await api.post(`/document-tracking/log`, request);
    return response.data;
  },

  // Upload document for tracking
  async uploadDocumentForTracking(request: UploadDocumentRequest): Promise<UploadDocumentResponse> {
    const formData = new FormData();
    formData.append('document', request.file);
    formData.append('userId', request.userId);
    formData.append('documentName', request.documentName);
    if (request.expiresInDays) {
      formData.append('expiresInDays', request.expiresInDays.toString());
    }

    const response = await api.post(`/document-tracking/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get tracked documents
  async getTrackedDocuments(filters: TrackingFilters = {}): Promise<TrackedDocumentsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/document-tracking/documents?${params}`);
    return response.data;
  },

  // Get document tracking
  async getDocumentTracking(documentId: string, filters: TrackingFilters = {}): Promise<DocumentTrackingResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/document-tracking/document/${documentId}?${params}`);
    return response.data;
  },

  // Get user activity (for current authenticated user)
  async getUserActivity(filters: TrackingFilters = {}): Promise<UserActivityResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/document-tracking/user/activity?${params}`);
    return response.data;
  },

  // Get audit trail
  async getAuditTrail(filters: TrackingFilters = {}): Promise<AuditTrailResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/document-tracking/audit-trail?${params}`);
    return response.data;
  },

  // Get dashboard stats
  async getDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStatsResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/document-tracking/dashboard-stats?${params}`);
    return response.data;
  },

  // Export tracking data
  async exportTrackingData(request: ExportRequest): Promise<void> {
    const params = new URLSearchParams();
    params.append('format', request.format);
    if (request.startDate) params.append('startDate', request.startDate);
    if (request.endDate) params.append('endDate', request.endDate);

    const response = await api.get(`/document-tracking/export?${params}`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `document_tracking.${request.format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Get user information by ID
  async getUserInfo(userId: string): Promise<{ name: string; email: string } | null> {
    try {
      const currentUser = getUserProfileSnapshot();
      if (currentUser && currentUser.id === userId) {
        return {
          name: currentUser.fullname || currentUser.email || 'Current User',
          email: currentUser.email || '',
        };
      }

      // If not current user, try to get from auth service
      // This would need to be implemented in your auth service
      // For now, return a generic name
      return {
        name: `User ${userId.slice(0, 8)}`,
        email: 'user@example.com'
      };
    } catch (error) {
      console.error('Failed to get user info:', error);
      return {
        name: `User ${userId.slice(0, 8)}`,
        email: 'Unknown'
      };
    }
  },

  // Helper methods for logging specific actions
  async logDocumentView(documentId: string, documentName: string, originalFilename: string, metadata?: Record<string, any>): Promise<void> {
    try {
      // Get user ID from localStorage automatically
      const currentUserId = getCurrentUserId();
      
      await this.logEvent({
        documentId,
        documentName,
        originalFilename,
        userId: currentUserId,
        action: 'view',
        metadata
      });
    } catch (error) {
      console.error('Failed to log document view:', error);
    }
  },

  async logDocumentDownload(documentId: string, documentName: string, originalFilename: string, metadata?: Record<string, any>): Promise<void> {
    try {
      // Get user ID from localStorage automatically
      const currentUserId = getCurrentUserId();
      
      await this.logEvent({
        documentId,
        documentName,
        originalFilename,
        userId: currentUserId,
        action: 'download',
        metadata
      });
    } catch (error) {
      console.error('Failed to log document download:', error);
    }
  },

  async logDocumentEdit(documentId: string, documentName: string, originalFilename: string, metadata?: Record<string, any>): Promise<void> {
    try {
      // Get user ID from localStorage automatically
      const currentUserId = getCurrentUserId();
      
      await this.logEvent({
        documentId,
        documentName,
        originalFilename,
        userId: currentUserId,
        action: 'edit',
        metadata
      });
    } catch (error) {
      console.error('Failed to log document edit:', error);
    }
  },

  async logDocumentPermissionSet(documentId: string, documentName: string, originalFilename: string, metadata?: Record<string, any>): Promise<void> {
    try {
      // Get user ID from localStorage automatically
      const currentUserId = getCurrentUserId();
      
      await this.logEvent({
        documentId,
        documentName,
        originalFilename,
        userId: currentUserId,
        action: 'permission_set',
        metadata
      });
    } catch (error) {
      console.error('Failed to log document permission set:', error);
    }
  },

  async logDocumentMetadataRemoved(documentId: string, documentName: string, originalFilename: string, metadata?: Record<string, any>): Promise<void> {
    try {
      // Get user ID from localStorage automatically
      const currentUserId = getCurrentUserId();
      
      await this.logEvent({
        documentId,
        documentName,
        originalFilename,
        userId: currentUserId,
        action: 'metadata_removed',
        metadata
      });
    } catch (error) {
      console.error('Failed to log document metadata removal:', error);
    }
  },

  async logDocumentCompressed(documentId: string, documentName: string, originalFilename: string, metadata?: Record<string, any>): Promise<void> {
    try {
      // Get user ID from localStorage automatically
      const currentUserId = getCurrentUserId();
      
      await this.logEvent({
        documentId,
        documentName,
        originalFilename,
        userId: currentUserId,
        action: 'compressed',
        metadata
      });
    } catch (error) {
      console.error('Failed to log document compression:', error);
    }
  },

  async logDocumentOptimized(documentId: string, documentName: string, originalFilename: string, metadata?: Record<string, any>): Promise<void> {
    try {
      // Get user ID from localStorage automatically
      const currentUserId = getCurrentUserId();
      
      await this.logEvent({
        documentId,
        documentName,
        originalFilename,
        userId: currentUserId,
        action: 'optimized',
        metadata
      });
    } catch (error) {
      console.error('Failed to log document optimization:', error);
    }
  }
};
