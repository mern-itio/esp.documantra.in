import { create } from 'zustand';
import { documentAPI, folderAPI } from '../../../services/api';
import { generateId } from '../lib/utils';
import type { Document, Folder, SearchFilters, SortBy, SortOrder, UploadProgress, User, UserRole, ViewMode } from '../types';

interface DocumentState {
  // User & Auth
  currentUser: User | null;
  userPermissions: any;

  // Documents & Folders
  documents: Document[];
  folders: Folder[];
  selectedDocuments: string[];
  currentFolderId: string | null;

  // Upload
  uploadProgress: UploadProgress[];

  // Search & Filters
  searchQuery: string;
  searchFilters: SearchFilters;

  // View Settings
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;

  // Loading States
  isLoading: boolean;
  isUploading: boolean;

  // Actions
  setCurrentUser: (user: User) => void;
  loadUserFromStorage: () => void;
  uploadFiles: (files: File[], folderId?: string) => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  deleteDocuments: (documentIds: string[]) => Promise<void>;
  moveDocuments: (documentIds: string[], folderId: string) => Promise<void>;
  shareDocument: (documentId: string, email: string, permission: 'view' | 'edit' | 'comment', message?: string) => Promise<void>;
  toggleFavorite: (documentId: string) => Promise<void>;
  toggleArchive: (documentId: string) => Promise<void>;
  setSelectedDocuments: (documentIds: string[]) => void;
  setCurrentFolder: (folderId: string | null) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSearchFilters: (filters: SearchFilters) => void;
  setViewMode: (mode: ViewMode) => void;
  setSorting: (sortBy: SortBy, sortOrder: SortOrder) => void;
  getFilteredDocuments: () => Document[];
  getFolderDocuments: (folderId: string | null) => Document[];
  getBreadcrumbs: () => Folder[];
  getStorageStats: () => { used: number; total: number; percentage: number };

  // New API-based actions
  fetchDocuments: (params?: any) => Promise<void>;
  fetchFolders: (params?: any) => Promise<void>;
  refreshData: () => Promise<void>;

  // Trash functionality
  moveToTrash: (documentId: string) => Promise<void>;
  restoreFromTrash: (documentId: string) => Promise<void>;
  permanentlyDelete: (documentId: string) => Promise<void>;

}

// Helper function to get user data from localStorage
const getUserFromStorage = (): User | null => {
  try {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      return {
        id: parsed.id,
        email: parsed.email,
        name: parsed.fullname || parsed.name,
        role: parsed.type || 'regular'
      };
    }
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
  }
  return null;
};

// Helper function to get user permissions based on role
const getUserPermissions = (role: UserRole) => {
  const basePermissions = {
    upload: true,
    view: true,
    download: true,
    delete_own: true,
    delete_any: false,
    create_folders: true,
    manage_team_docs: false,
    bulk_operations: true,
    analytics: false,
    admin_access: false,
    storageLimit: 1073741824, // 1GB default
    uploadLimit: 52428800 // 50MB default
  };

  switch (role) {
    case 'team_admin':
      return {
        ...basePermissions,
        manage_team_docs: true,
        analytics: true,
        storageLimit: 2147483648, // 2GB
        uploadLimit: 104857600 // 100MB
      };
    case 'super_admin':
      return {
        ...basePermissions,
        delete_any: true,
        manage_team_docs: true,
        analytics: true,
        admin_access: true,
        storageLimit: 5368709120, // 5GB
        uploadLimit: 209715200 // 200MB
      };
    default:
      return basePermissions;
  }
};

export const useDocumentStore = create<DocumentState>((set, get) => ({
  // Initial state
  currentUser: null,
  userPermissions: getUserPermissions('regular'),
  documents: [],
  folders: [],
  selectedDocuments: [],
  currentFolderId: null,
  uploadProgress: [],
  searchQuery: '',
  searchFilters: {},
  viewMode: 'grid',
  sortBy: 'name',
  sortOrder: 'asc',
  isLoading: false,
  isUploading: false,

  // Actions
  setCurrentUser: (user: User) => {
    const permissions = getUserPermissions(user.role);
    set({ currentUser: user, userPermissions: permissions });
  },

  loadUserFromStorage: () => {
    const user = getUserFromStorage();
    if (user) {
      const permissions = getUserPermissions(user.role);
      set({ currentUser: user, userPermissions: permissions });
    }
  },

  // API-based document fetching
  fetchDocuments: async (params = {}) => {
    try {
      set({ isLoading: true });
      const response = await documentAPI.getUserDocuments(params);

      if (response.success) {
        
        // Transform API response to match our Document interface
        const transformedDocuments: Document[] = response.data.documents.map((doc: any) => {
          
          return {
            id: doc._id,
            name: doc.name,
            type: doc.type,
            size: doc.size,
            createdAt: doc.createdAt,
            modifiedAt: doc.modifiedAt,
            uploadedBy: doc.uploadedBy,
            folderId: doc.folderId?._id || doc.folderId,
            tags: doc.tags || [],
            shared: doc.shared || false,
            views: doc.views || 0,
            downloads: doc.downloads || 0,
            sharedWith: doc.sharedWith || [],
            isArchived: doc.isArchived || false,
            isFavorite: doc.isFavorite || false,
            description: doc.description || '',
            thumbnail: doc.thumbnail,
            content: doc.content
          };
        });
        set({ documents: transformedDocuments });
      }
    } catch (error: any) {
      console.error('Failed to fetch documents:', error);

      // If it's an authentication error, show a more helpful message
      if (error.message === 'Authentication token not found') {
        console.warn('🔐 Authentication required. Please ensure you have a valid JWT token.');
        console.warn('💡 You can use debugAuthStorage() in the console to check token status.');
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // API-based folder fetching
  fetchFolders: async (params = {}) => {
    try {
      set({ isLoading: true });
      const response = await folderAPI.getUserFolders(params);

      if (response.success) {
        // Transform API response to match our Folder interface
        const transformedFolders: Folder[] = response.data.map((folder: any) => ({
          id: folder._id,
          name: folder.name,
          parentId: folder.parentId?._id || folder.parentId,
          color: folder.color,
          icon: folder.icon,
          documentCount: folder.documentCount || 0,
          createdAt: folder.createdAt,
          ownerId: folder.ownerId,
          isShared: folder.isShared || false,
          permissions: folder.permissions || [],
          description: folder.description || '',
          isArchived: folder.isArchived || false,
          isFavorite: folder.isFavorite || false,
          folderCount: folder.folderCount || 0,
          totalSize: folder.totalSize || 0,
          modifiedAt: folder.modifiedAt
        }));

        set({ folders: transformedFolders });
      }
    } catch (error: any) {
      console.error('Failed to fetch folders:', error);

      // If it's an authentication error, show a more helpful message
      if (error.message === 'Authentication token not found') {
        console.warn('🔐 Authentication required. Please ensure you have a valid JWT token.');
        console.warn('💡 You can use debugAuthStorage() in the console to check token status.');
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh all data
  refreshData: async () => {
    const { currentFolderId } = get();
    await Promise.all([
      get().fetchDocuments({ folderId: currentFolderId }),
      get().fetchFolders({ parentId: currentFolderId })
    ]);
  },

  uploadFiles: async (files: File[], folderId?: string) => {
    const { userPermissions } = get();
    set({ isUploading: true });

    // Create upload progress entries
    const progressEntries: UploadProgress[] = files.map(file => ({
      id: generateId(),
      file,
      progress: 0,
      status: 'pending'
    }));

    set((state: any) => ({
      uploadProgress: [...state.uploadProgress, ...progressEntries]
    }));

    // Upload files using API
    for (const progress of progressEntries) {
      try {
        // Check file size limits
        if (userPermissions.uploadLimit !== -1 && progress.file.size > userPermissions.uploadLimit) {
          set((state: any) => ({
            uploadProgress: state.uploadProgress.map((p: any) =>
              p.id === progress.id
                ? { ...p, status: 'error', error: 'File size exceeds limit' }
                : p
            )
          }));
          continue;
        }

        // Update progress to uploading
        set((state: any) => ({
          uploadProgress: state.uploadProgress.map((p: any) =>
            p.id === progress.id
              ? { ...p, status: 'uploading', progress: 10 }
              : p
          )
        }));

        // Upload file via API
        const response = await documentAPI.uploadDocument(
          progress.file,
          folderId || get().currentFolderId || undefined
        );

        if (response.success) {
          // Update progress to success
          set((state: any) => ({
            uploadProgress: state.uploadProgress.map((p: any) =>
              p.id === progress.id
                ? { ...p, status: 'success', progress: 100 }
                : p
            )
          }));

          // Refresh documents list
          await get().refreshData();
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        set((state: any) => ({
          uploadProgress: state.uploadProgress.map((p: any) =>
            p.id === progress.id
              ? { ...p, status: 'error', error: error.message || 'Upload failed' }
              : p
          )
        }));
      }
    }

    // Clear progress after delay
    setTimeout(() => {
      set((state: any) => ({
        uploadProgress: state.uploadProgress.filter((p: any) => p.status !== 'success'),
        isUploading: false
      }));
    }, 2000);
  },

  createFolder: async (name: string, parentId?: string) => {
    try {
      set({ isLoading: true });

      const response = await folderAPI.createFolder({
        name,
        parentId: parentId || get().currentFolderId || undefined,
        color: '#3b82f6',
        icon: 'Folder'
      });

      if (response.success) {
        // Refresh folders list
        await get().fetchFolders();
      }
    } catch (error: any) {
      console.error('Failed to create folder:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteDocuments: async (documentIds: string[]) => {
    try {
      set({ isLoading: true });

      if (documentIds.length === 1) {
        // Single document delete
        const response = await documentAPI.deleteDocument(documentIds[0]);
        if (response.success) {
          set((state: any) => ({
            documents: state.documents.filter((doc: { id: string }) =>
              !documentIds.includes(doc.id)
            ),
            selectedDocuments: []
          }));
        }
      } else {
        // Bulk delete
        const response = await documentAPI.bulkDeleteDocuments(documentIds);
        if (response.success) {
          set((state: any) => ({
            documents: state.documents.filter((doc: any) => !documentIds.includes(doc.id)),
            selectedDocuments: []
          }));
        }
      }
    } catch (error: any) {
      console.error('Failed to delete documents:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  moveDocuments: async (documentIds: string[], folderId: string) => {
    try {
      set({ isLoading: true });

      // Update documents in local state
      set((state: any) => ({
        documents: state.documents.map((doc: any) =>
          documentIds.includes(doc.id)
            ? { ...doc, folderId, modifiedAt: new Date().toISOString() }
            : doc
        ),
        selectedDocuments: []
      }));

      // Refresh data to sync with server
      await get().refreshData();
    } catch (error: any) {
      console.error('Failed to move documents:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  shareDocument: async (documentId: string, email: string, permission: 'view' | 'edit' | 'comment', message?: string) => {
    try {
      const response = await documentAPI.shareDocument(documentId, email, permission, message);
      
      if (response.success) {
        // Refresh data to get updated document state
        await get().refreshData();
      } else {
        throw new Error(response.message || 'Failed to share document');
      }
    } catch (error: any) {
      console.error('Failed to share document:', error);
      throw error;
    }
  },

  toggleFavorite: async (documentId: string) => {
    try {
      const document = get().documents.find(doc => doc.id === documentId);
      if (document) {
        const response = await documentAPI.updateDocument(documentId, {
          isFavorite: !document.isFavorite
        });

        if (response.success) {
          set((state: any) => ({
            documents: state.documents.map((doc: any) =>
              doc.id === documentId
                ? { ...doc, isFavorite: !doc.isFavorite }
                : doc
            )
          }));
        }
      }
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
    }
  },

  toggleArchive: async (documentId: string) => {
    try {
      const document = get().documents.find(doc => doc.id === documentId);
      if (document) {
        const response = await documentAPI.updateDocument(documentId, {
          isArchived: !document.isArchived
        });

        if (response.success) {
          set((state: any) => ({
            documents: state.documents.map((doc: any) =>
              doc.id === documentId
                ? { ...doc, isArchived: !doc.isArchived }
                : doc
            )
          }));
        }
      }
    } catch (error: any) {
      console.error('Failed to toggle archive:', error);
    }
  },

  setSelectedDocuments: (documentIds: string[]) => {
    set({ selectedDocuments: documentIds });
  },

  setCurrentFolder: async (folderId: string | null) => {
    set({ currentFolderId: folderId, selectedDocuments: [] });
    // Refresh data for the new folder
    await get().refreshData();
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSearchFilters: (filters: SearchFilters) => {
    set({ searchFilters: filters });
  },

  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
  },

  setSorting: (sortBy: SortBy, sortOrder: SortOrder) => {
    set({ sortBy, sortOrder });
  },

  getFilteredDocuments: () => {
    const { documents, currentFolderId, searchQuery, searchFilters, sortBy, sortOrder } = get();


    let filtered = documents.filter(doc => {
      // Exclude deleted documents
      if (doc.isDeleted) return false;

      // Exclude shared PDF documents from regular document list
      if (doc.type === 'pdf' && doc.description === 'PDF uploaded for sharing') {
        return false;
      }

      // Folder filter
      if (currentFolderId && doc.folderId !== currentFolderId) return false;

      // Search query
      if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // File type filter
      if (searchFilters.type?.length && !searchFilters.type.includes(doc.type)) {
        return false;
      }

      // Tag filter
      if (searchFilters.tags?.length) {
        const hasTag = searchFilters.tags.some(tag => doc.tags.includes(tag));
        if (!hasTag) return false;
      }

      // Shared only filter
      if (searchFilters.sharedOnly && !doc.shared) return false;

      // Favorite only filter
      if (searchFilters.favoriteOnly && !doc.isFavorite) return false;

      return true;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.modifiedAt);
          bValue = new Date(b.modifiedAt);
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  },

  getFolderDocuments: (folderId: string | null) => {
    const { documents } = get();
    return documents.filter(doc => !doc.isDeleted && doc.folderId === folderId);
  },

  getBreadcrumbs: () => {
    const { folders, currentFolderId } = get();
    const breadcrumbs: Folder[] = [];

    let currentId = currentFolderId;
    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        breadcrumbs.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }

    return breadcrumbs;
  },

  getStorageStats: () => {
    const { documents, userPermissions } = get();
    const used = documents.filter(doc => !doc.isDeleted).reduce((total, doc) => total + doc.size, 0);
    const total = userPermissions.storageLimit;
    const percentage = total === -1 ? 0 : Math.round((used / total) * 100);

    return { used, total, percentage };
  },

  // Trash functionality
  moveToTrash: async (documentId: string) => {
    try {
      const document = get().documents.find(doc => doc.id === documentId);
      if (document) {
        const response = await documentAPI.deleteDocument(documentId);

        if (response.success) {
          set((state: any) => ({
            documents: state.documents.map((doc: any) =>
              doc.id === documentId
                ? { ...doc, isDeleted: true, deletedAt: new Date().toISOString() }
                : doc
            )
          }));
        }
      }
    } catch (error: any) {
      console.error('Failed to move document to trash:', error);
    }
  },

  restoreFromTrash: async (documentId: string) => {
    try {
      const response = await documentAPI.restoreDocument(documentId);

      if (response.success) {
        set((state: any) => ({
          documents: state.documents.map((doc: any) =>
            doc.id === documentId
              ? { ...doc, isDeleted: false, deletedAt: null }
              : doc
          )
        }));
      }
    } catch (error: any) {
      console.error('Failed to restore document from trash:', error);
    }
  },

  permanentlyDelete: async (documentId: string) => {
    try {
      const response = await documentAPI.permanentlyDeleteDocument(documentId);

      if (response.success) {
        set((state: any) => ({
          documents: state.documents.filter((doc: any) => doc.id !== documentId)
        }));
      }
    } catch (error: any) {
      console.error('Failed to permanently delete document:', error);
    }
  },

}));