export interface DocumentTrackingRecord {
  _id: string;
  documentId: string;
  documentName: string;
  documentType: string;
  originalFilename: string;
  userId: string;
  action: 'view' | 'download' | 'edit' | 'delete' | 'upload' | 'permission_set' | 'metadata_removed' | 'compressed' | 'optimized';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  metadata: Record<string, any>;
  isTracked: boolean;
  trackingSource: 'automatic' | 'manual' | 'shared_link';
  shareableLink?: string;
  linkToken?: string;
  expiresAt?: string;
  accessCount: number;
  lastAccessed: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackedDocument {
  _id: string;
  documentName: string;
  documentType: string;
  originalFilename: string;
  trackingSource: 'automatic' | 'manual' | 'shared_link';
  shareableLink?: string;
  expiresAt?: string;
  accessCount: number;
  lastAccessed: string;
  totalActions: number;
  lastAction: string;
  actions: Array<{ action: string; timestamp: string }>;
}

export interface TrackingSummary {
  documentId: string;
  documentName: string;
  documentType: string;
  originalFilename: string;
  trackingSource: 'automatic' | 'manual' | 'shared_link';
  shareableLink?: string;
  expiresAt?: string;
  accessCount: number;
  lastAccessed: string;
  totalActions: number;
  actions: Array<{ action: string; timestamp: string; userId: string }>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface DocumentTrackingResponse {
  success: boolean;
  documentSummary: TrackingSummary | null;
  trackingRecords: DocumentTrackingRecord[];
  pagination: PaginationInfo;
}

export interface TrackedDocumentsResponse {
  success: boolean;
  documents: TrackedDocument[];
  pagination: PaginationInfo;
}

export interface UserActivityResponse {
  success: boolean;
  userActivity: DocumentTrackingRecord[];
  pagination: PaginationInfo;
}

export interface AuditTrailResponse {
  success: boolean;
  auditTrail: DocumentTrackingRecord[];
  pagination: PaginationInfo;
}

export interface DashboardStatsResponse {
  success: boolean;
  stats: {
    totalDocuments: number;
    totalActions: number;
    actionsByType: Array<{ _id: string; count: number }>;
    recentActivity: Array<{ documentName: string; action: string; timestamp: string; userId: string }>;
    topDocuments: Array<{ _id: string; documentName: string; actionCount: number; lastAction: string }>;
  };
}

export interface LogEventRequest {
  documentId: string;
  documentName: string;
  documentType?: string;
  originalFilename: string;
  userId?: string;
  action: 'view' | 'download' | 'edit' | 'delete' | 'upload' | 'permission_set' | 'metadata_removed' | 'compressed' | 'optimized';
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  metadata?: Record<string, any>;
}

export interface LogEventResponse {
  success: boolean;
  message: string;
  trackingId: string;
}

export interface UploadDocumentRequest {
  file: File;
  userId: string;
  documentName: string;
  expiresInDays?: number;
}

export interface UploadDocumentResponse {
  success: boolean;
  message: string;
  documentId: string;
  shareableLink: string;
  expiresAt: string;
  trackingId: string;
}

export interface TrackingFilters {
  page?: number;
  limit?: number;
  action?: string;
  startDate?: string;
  endDate?: string;
  documentId?: string;
}

export interface ExportRequest {
  format: 'json' | 'csv';
  startDate?: string;
  endDate?: string;
}
