import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  Star,
  Archive,
  Search,
  SortAsc,
  SortDesc,
  ChevronRight,
  Home,
  ArrowLeft
} from 'lucide-react';
import { folderAPI, documentAPI } from '../../services/api';
import { Button } from '../../components/DocumentService/ui/button';
import { Card, CardContent } from '../../components/DocumentService/ui/card';
import { Input } from '../../components/DocumentService/ui/input';
import { CreateFolderModal } from '../../components/DocumentService/modals/CreateFolderModal';
import { MoveDocumentsModal } from '../../components/DocumentService/modals/MoveDocumentsModal';
import { DocumentCard } from '../../components/DocumentService/documents/DocumentCard';
import { CollaborationHub } from '../../components/DocumentService/collaboration/CollaborationHub';
import { useDocumentStore } from '../../components/common/store/documentStore';
import type { Document } from '../../components/common/types';
import { cn } from '../../components/common/lib/utils';
import { Link } from 'react-router-dom';

interface FolderData {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  documentCount: number;
  folderCount: number;
  totalSize: number;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  modifiedAt: string;
  ownerId: string;
  parentId?: string;
  path: string;
}

interface DocumentData {
  _id: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
  createdAt: string;
  modifiedAt: string;
  ownerId: string;
  uploadedBy: string;
  folderId?: string;
  isFavorite: boolean;
  isArchived: boolean;
}

interface FolderDetails {
  folder: FolderData;
  subfolders: FolderData[];
  documents: DocumentData[];
}

const FoldersPage: React.FC = () => {
  // const { user } = useAuth();
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderDetails | null>(null);
  // const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewMode] = useState<'list' | 'grid'>('grid');
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key for forcing re-renders

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date' | 'docCount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Get folders and functions from the document store
  const { 
    folders: storeFolders,
    fetchDocuments,
    fetchFolders,
    getFilteredDocuments,
    selectedDocuments: storeSelectedDocuments,
    setSelectedDocuments: setStoreSelectedDocuments
  } = useDocumentStore();

  // Load user folders
  useEffect(() => {
    const loadInitialData = async () => {
      await loadFolders();
      // Also load folders into the store
      await fetchFolders();
      // Load root documents into the store
      await fetchDocuments({ 
        folderId: null,
        sortBy: 'modifiedAt',
        sortOrder: 'desc'
      });
    };
    
    loadInitialData();
  }, [fetchFolders, fetchDocuments]);

  // Debug: Monitor folders state changes
  useEffect(() => {
  }, [folders]);

  // Listen for folder creation events from DocumentHeader
  useEffect(() => {
    const handleFolderCreated = () => {
      loadFolders();
    };

    // Listen for custom event
    window.addEventListener('folderCreated', handleFolderCreated);

    return () => {
      window.removeEventListener('folderCreated', handleFolderCreated);
    };
  }, []);

  // Sync store folders with local state
  useEffect(() => {
    if (storeFolders && storeFolders.length > 0) {
      // Transform store folders to match local FolderData interface
      const transformedFolders: FolderData[] = storeFolders.map(folder => ({
        _id: folder.id,
        name: folder.name,
        description: '', // Default value since not in store Folder interface
        color: folder.color || '#3b82f6',
        icon: folder.icon || 'Folder',
        documentCount: folder.documentCount || 0,
        folderCount: 0, // Default value since not in store Folder interface
        totalSize: 0, // Default value since not in store Folder interface
        isFavorite: false, // Default value since not in store Folder interface
        isArchived: false, // Default value since not in store Folder interface
        createdAt: folder.createdAt || new Date().toISOString(),
        modifiedAt: folder.createdAt || new Date().toISOString(), // Use createdAt as fallback
        ownerId: folder.ownerId || '',
        parentId: folder.parentId || undefined, // Convert null to undefined
        path: '' // Default value since not in store Folder interface
      }));

      setFolders(transformedFolders);
    }
  }, [storeFolders]);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const response = await folderAPI.getUserFolders();

      if (response.success) {
        setFolders(response.data);
      } else {
        console.error('❌ Failed to load folders:', response.message);
      }
    } catch (error) {
      console.error('❌ Failed to load folders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolderDetails = async (folderId: string) => {
    try {
      setIsLoading(true);
      const response = await folderAPI.getFolder(folderId);
      if (response.success) {
        setCurrentFolder(response.data);
        
        // Load documents into the document store so DocumentCard can access them
        await fetchDocuments({ 
          folderId: folderId,
          sortBy: 'modifiedAt',
          sortOrder: 'desc'
        });
        
        // await loadBreadcrumbs(folderId);
      }
    } catch (error) {
      console.error('Failed to load folder details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // const loadBreadcrumbs = async (folderId: string) => {
  //   try {
  //     const response = await folderAPI.getFolderBreadcrumbs(folderId);
  //     if (response.success) {
  //       setBreadcrumbs(response.data);
  //     }
  //   } catch (error) {
  //     console.error('Failed to load breadcrumbs:', error);
  //   }
  // };

  const handleFolderClick = (folder: FolderData) => {
    if (folder.folderCount > 0 || folder.documentCount > 0) {
      loadFolderDetails(folder._id);
    } else {
      // Empty folder - show create document or subfolder options
      setCurrentFolder({
        folder,
        subfolders: [],
        documents: []
      });
    }
  };

  const handleBackToRoot = async () => {
    setCurrentFolder(null);
    setStoreSelectedDocuments([]);
    
    // Load root documents into the document store
    await fetchDocuments({ 
      folderId: null,
      sortBy: 'modifiedAt',
      sortOrder: 'desc'
    });
  };


  const handleCreateFolder = useCallback(async (folderData: { name: string; description: string; color: string; icon: string }) => {
    try {
      const parentId = currentFolder?.folder._id || undefined;

      const response = await folderAPI.createFolder({
        ...folderData,
        parentId
      });


      if (response.success) {
        setShowCreateModal(false);

        // Force immediate state update by adding the new folder to local state
        if (response.data) {
          const newFolder = {
            _id: response.data._id || response.data.id,
            name: response.data.name,
            description: response.data.description || '',
            color: response.data.color || '#3b82f6',
            icon: response.data.icon || 'Folder',
            documentCount: 0,
            folderCount: 0,
            totalSize: 0,
            isFavorite: false,
            isArchived: false,
            createdAt: response.data.createdAt || new Date().toISOString(),
            modifiedAt: response.data.modifiedAt || new Date().toISOString(),
            ownerId: response.data.ownerId || '',
            parentId: response.data.parentId,
            path: response.data.path || ''
          };


          // Add to local state immediately
          setFolders(prev => {
            const updated = [...prev, newFolder];
            return updated;
          });
        }

        await loadFolders();

        // Force a UI update by incrementing the refresh key
        setRefreshKey(prev => prev + 1);
      } else {
        console.error('❌ Folder creation failed:', response.message);
      }
    } catch (error) {
      console.error('❌ Failed to create folder:', error);
    }
  }, [currentFolder]);

  const handleMoveDocuments = async (targetFolderId: string | null) => {
    try {
      if (storeSelectedDocuments.length === 0) return;

      const response = await documentAPI.moveMultipleDocuments(storeSelectedDocuments, targetFolderId);
      if (response.success) {
        setShowMoveModal(false);
        setStoreSelectedDocuments([]);
        // Refresh current folder
        if (currentFolder) {
          await loadFolderDetails(currentFolder.folder._id);
        }
      }
    } catch (error) {
      console.error('Failed to move documents:', error);
    }
  };

  const handleDocumentSelect = (documentId: string, isSelected?: boolean) => {
    if (isSelected !== undefined) {
      // Called from DocumentCard with boolean
      if (isSelected) {
        const newSelection = [...storeSelectedDocuments, documentId];
        setStoreSelectedDocuments(newSelection);
      } else {
        const newSelection = storeSelectedDocuments.filter(id => id !== documentId);
        setStoreSelectedDocuments(newSelection);
      }
    } else {
      // Called from checkbox onChange
      if (storeSelectedDocuments.includes(documentId)) {
        const newSelection = storeSelectedDocuments.filter(id => id !== documentId);
        setStoreSelectedDocuments(newSelection);
      } else {
        const newSelection = [...storeSelectedDocuments, documentId];
        setStoreSelectedDocuments(newSelection);
      }
    }
  };

  const handleSelectAll = () => {
    const folderDocuments = getFilteredAndSortedDocuments();
    if (folderDocuments.length > 0) {
      if (storeSelectedDocuments.length === folderDocuments.length) {
        setStoreSelectedDocuments([]);
      } else {
        setStoreSelectedDocuments(folderDocuments.map(doc => doc.id));
      }
    }
  };

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
  };


  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Filter and sort functions
  const getFilteredAndSortedFolders = () => {
    let filtered = [...folders];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(folder =>
        folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (folder.description && folder.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }  

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.totalSize - b.totalSize;
          break;
        case 'date':
          comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
          break;
        case 'docCount':
          comparison = a.documentCount - b.documentCount;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const getFilteredAndSortedDocuments = () => {
    if (!currentFolder) return [];

    // Use the store's getFilteredDocuments which handles real-time updates
    const allFilteredDocuments = getFilteredDocuments();
    
    // Filter by current folder
    const folderDocuments = allFilteredDocuments.filter(doc => 
      doc.folderId === currentFolder.folder._id || 
      (currentFolder.folder._id === null && !doc.folderId)
    );

    // Apply additional search filter if needed
    let filtered = [...folderDocuments];
    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div key={refreshKey} className="min-h-screen bg-gray-50">
      {/* Filter Bar */}
      {/* Static Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center space-x-1 text-sm">
            {/* Root/Home */}
            <Link to="/all-documents"
              className={cn(
                "flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"

              )}
            >
              <span><ArrowLeft className='w-4 h-4 text-gray-500' /></span>
            </Link>
          
            <button
              onClick={handleBackToRoot}
              className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
            >
              <Home className="w-4 h-4" />
              <span>Folders</span>
            </button>

            {/* Current folder breadcrumb */}
            {currentFolder && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <div className="flex items-center space-x-2 px-2 py-1 rounded-md text-gray-900 font-medium">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: currentFolder.folder.color }}
                  />
                  <span>{currentFolder.folder.name}</span>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between space-x-4">
            {/* Search and Quick Filters */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search folders and documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
             
            </div>

            {/* Sort and Filter Controls */}
            <div className="flex items-center space-x-2">
              {/* Sort Dropdown */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center space-x-1"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  <span>Sort</span>
                </Button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                  <option value="date">Date</option>
                  {!currentFolder && <option value="docCount">Documents</option>}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentFolder ? (
          // Folder contents view
          <div className="space-y-6">


            {/* Documents */}
            {getFilteredAndSortedDocuments().length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Documents ({getFilteredAndSortedDocuments().length})
                  </h2>
                  {getFilteredAndSortedDocuments().length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
{storeSelectedDocuments.length === getFilteredAndSortedDocuments().length && getFilteredAndSortedDocuments().length > 0 ? 'Deselect All' : 'Select All'}
                      </Button>

                      {storeSelectedDocuments.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMoveModal(true)}
                          className="flex items-center space-x-2"
                        >
                          <span>Move {storeSelectedDocuments.length} Document{storeSelectedDocuments.length !== 1 ? 's' : ''}</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {getFilteredAndSortedDocuments().map((document) => {
                      return (
                        <div key={document.id} className="relative">
                          <DocumentCard
                            document={document}
                            isSelected={storeSelectedDocuments.includes(document.id)}
                            onSelect={(isSelected) => handleDocumentSelect(document.id, isSelected)}
                            onClick={handleDocumentClick}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={storeSelectedDocuments.length === getFilteredAndSortedDocuments().length && getFilteredAndSortedDocuments().length > 0}
                              onChange={handleSelectAll}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Modified
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredAndSortedDocuments().map((document) => (
                          <tr key={document.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={storeSelectedDocuments.includes(document.id)}
                                onChange={() => handleDocumentSelect(document.id)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-5 h-5 bg-gray-100 rounded mr-3 flex items-center justify-center">
                                  <span className="text-xs text-gray-600">{document.type.toUpperCase()}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    handleDocumentClick(document);
                                  }}
                                  className="text-sm font-medium text-gray-900 hover:text-primary-600 hover:underline cursor-pointer"
                                >
                                  {document.name}
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatFileSize(document.size)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(document.modifiedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    handleDocumentClick(document);
                                  }}
                                >
                                  Open
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setStoreSelectedDocuments([document.id]);
                                    setShowMoveModal(true);
                                  }}
                                >
                                  Move
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {getFilteredAndSortedFolders().length === 0 && getFilteredAndSortedDocuments().length === 0 && (
              <div className="text-center py-12">
                <Folder className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No items in this folder</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by moving documents here.
                </p>
                {/* <div className="mt-6 flex justify-center space-x-3">
                  <Button onClick={() => setShowCreateModal(true)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Subfolder
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </div> */}
              </div>
            )}
          </div>
        ) : (
          // Root folders view
          <div className="space-y-6">
            {getFilteredAndSortedFolders().length === 0 ? (
              <div className="text-center py-12">
                <Folder className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No folders yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first folder to organize your documents.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setShowCreateModal(true)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create Your First Folder
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {getFilteredAndSortedFolders().map((folder) => (
                  <Card
                    key={folder._id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                    onClick={() => handleFolderClick(folder)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-16 h-16 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: folder.color }}
                        >
                          <FolderOpen className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {folder.name}
                          </h3>
                          {folder.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {folder.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <div className="w-3 h-3 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-xs text-gray-600">D</span>
                              </div>
                              <span>{folder.documentCount}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Folder className="h-3 w-3" />
                              <span>{folder.folderCount}</span>
                            </span>
                            <span>{formatFileSize(folder.totalSize)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          {folder.isFavorite && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                          {folder.isArchived && (
                            <Archive className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(folder.modifiedAt)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        onSubmit={async (folderData) => {
          await handleCreateFolder(folderData);
        }}
        parentFolderName={currentFolder?.folder.name}
      />

      <MoveDocumentsModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onSubmit={handleMoveDocuments}
        selectedCount={storeSelectedDocuments.length}
        availableFolders={folders}
      />

      {/* Collaboration Hub - Document Detail View */}
      {selectedDocument && (
        <CollaborationHub
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
};

export default FoldersPage;
