export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  organizationId?: string;
}

export type UserRole = 'regular' | 'team_admin' | 'super_admin';

export interface UserPermissions {
  upload: boolean;
  view: boolean;
  download: boolean;
  delete_own: boolean;
  delete_any: boolean;
  create_folders: boolean;
  manage_team_docs: boolean;
  bulk_operations: boolean;
  analytics: boolean;
  admin_access: boolean;
  storageLimit: number; // in bytes, -1 for unlimited
  uploadLimit: number; // in bytes, -1 for unlimited
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  uploadedBy: string;
  folderId: string | null;
  tags: string[];
  shared: boolean;
  views: number;
  downloads: number;
  thumbnail?: string;
  content?: string; // For text documents
  sharedWith: SharePermission[];
  isArchived: boolean;
  isFavorite: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  icon: string;
  documentCount: number;
  createdAt: string;
  ownerId: string;
  isShared: boolean;
  permissions: FolderPermission[];
}

export interface SharePermission {
  userId: string;
  email: string;
  permission: 'view' | 'comment' | 'edit' | 'full';
  expiresAt?: string;
  createdAt: string;
}

export interface FolderPermission {
  userId: string;
  email: string;
  permission: 'view' | 'edit' | 'admin';
  createdAt: string;
}

export interface SharedLink {
  id: string;
  documentId: string;
  token: string;
  permission: 'view' | 'download';
  expiresAt?: string;
  createdAt: string;
  accessCount: number;
  isActive: boolean;
}

export interface UploadProgress {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface SearchFilters {
  type?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
  folderId?: string;
  sharedOnly?: boolean;
  favoriteOnly?: boolean;
}

export interface StorageStats {
  used: number;
  total: number;
  documentCount: number;
  folderCount: number;
  sharedCount: number;
}

export interface DocumentStats {
  totalDocuments: number;
  totalStorage: number;
  recentActivity: ActivityItem[];
  topDocuments: Document[];
  storageByType: { type: string; size: number; count: number }[];
}

export interface ActivityItem {
  id: string;
  type: 'upload' | 'download' | 'share' | 'delete' | 'move' | 'rename';
  documentId: string;
  documentName: string;
  userId: string;
  userName: string;
  timestamp: string;
  details?: any;
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'name' | 'date' | 'size' | 'type';
export type SortOrder = 'asc' | 'desc';