import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FolderPlus,
  Star,
  Archive
} from 'lucide-react';
import { folderAPI, documentAPI } from '../../services/api';
import { Button } from '../../components/DocumentService/ui/button';
import { Card, CardContent } from '../../components/DocumentService/ui/card';
import { CreateFolderModal } from '../../components/DocumentService/modals/CreateFolderModal';
import { MoveDocumentsModal } from '../../components/DocumentService/modals/MoveDocumentsModal';
import { DocumentCard } from '../../components/DocumentService/documents/DocumentCard';
import { CollaborationHub } from '../../components/DocumentService/collaboration/CollaborationHub';
import type { Document } from '../../components/common/types';

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
  // const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string; color: string }>>([]);
  // const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewMode] = useState<'list' | 'grid'>('grid');

  // Load user folders
  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const response = await folderAPI.getUserFolders();
      if (response.success) {
        setFolders(response.data);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
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
      // setBreadcrumbs([{ id: folder._id, name: folder.name, color: folder.color }]);
    }
  };

  // const handleBackToRoot = () => {
  //   setCurrentFolder(null);
  //   setBreadcrumbs([]);
  //   setSelectedDocuments([]);
  // };

  const handleCreateFolder = async (folderData: { name: string; description: string; color: string; icon: string }) => {
    try {
      const parentId = currentFolder?.folder._id || undefined;
      const response = await folderAPI.createFolder({
        ...folderData,
        parentId
      });
      
      if (response.success) {
        setShowCreateModal(false);
        if (currentFolder) {
          // Refresh current folder
          await loadFolderDetails(currentFolder.folder._id);
        } else {
          // Refresh root folders
          await loadFolders();
        }
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleMoveDocuments = async (targetFolderId: string | null) => {
    try {
      if (selectedDocuments.length === 0) return;

      const response = await documentAPI.moveMultipleDocuments(selectedDocuments, targetFolderId);
      if (response.success) {
        setShowMoveModal(false);
        setSelectedDocuments([]);
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
      setSelectedDocuments(prev => 
        isSelected 
          ? [...prev, documentId]
          : prev.filter(id => id !== documentId)
      );
    } else {
      // Called from checkbox onChange
      setSelectedDocuments(prev => 
        prev.includes(documentId) 
          ? prev.filter(id => id !== documentId)
          : [...prev, documentId]
      );
    }
  };

  const handleSelectAll = () => {
    if (currentFolder?.documents) {
      if (selectedDocuments.length === currentFolder.documents.length) {
        setSelectedDocuments([]);
      } else {
        setSelectedDocuments(currentFolder.documents.map(doc => doc._id));
      }
    }
  };

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
  };

  const transformDocumentData = (doc: DocumentData): Document => ({
    id: doc._id,
    name: doc.name,
    type: doc.type,
    size: doc.size,
    createdAt: doc.createdAt,
    modifiedAt: doc.modifiedAt,
    uploadedBy: doc.uploadedBy,
    ownerId: doc.ownerId,
    folderId: doc.folderId || null,
    tags: [], // Add tags if available in your data
    shared: false, // Add shared status if available
    views: 0, // Add views if available
    downloads: 0, // Add downloads if available
    sharedWith: [], // Add sharedWith if available
    isArchived: doc.isArchived,
    isFavorite: doc.isFavorite
  });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">   

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentFolder ? (
          // Folder contents view
          <div className="space-y-6">
            {/* Subfolders */}
            {/* {currentFolder.subfolders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Subfolders</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {currentFolder.subfolders.map((subfolder) => (
                    <Card
                      key={subfolder._id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleFolderClick(subfolder)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: subfolder.color }}
                          >
                            <Folder className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {subfolder.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {subfolder.documentCount} documents, {subfolder.folderCount} subfolders
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )} */}

            {/* Documents */}
            {currentFolder.documents.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
                  {currentFolder.documents.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        {selectedDocuments.length === currentFolder.documents.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      
                      {selectedDocuments.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMoveModal(true)}
                          className="flex items-center space-x-2"
                        >
                          <span>Move {selectedDocuments.length} Document{selectedDocuments.length !== 1 ? 's' : ''}</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {currentFolder.documents.map((document) => {
                      const transformedDoc = transformDocumentData(document);
                      return (
                        <div key={document._id} className="relative">
                          <DocumentCard
                            document={transformedDoc}
                            isSelected={selectedDocuments.includes(document._id)}
                            onSelect={(isSelected) => handleDocumentSelect(document._id, isSelected)}
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
                              checked={selectedDocuments.length === currentFolder.documents.length}
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
                        {currentFolder.documents.map((document) => (
                          <tr key={document._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedDocuments.includes(document._id)}
                                onChange={() => handleDocumentSelect(document._id)}
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
                                    const transformedDoc = transformDocumentData(document);
                                    handleDocumentClick(transformedDoc);
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
                                    const transformedDoc = transformDocumentData(document);
                                    handleDocumentClick(transformedDoc);
                                  }}
                                >
                                  Open
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDocuments([document._id]);
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
            {currentFolder.subfolders.length === 0 && currentFolder.documents.length === 0 && (
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
            {folders.length === 0 ? (
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
                {folders.map((folder) => (
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
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateFolder}
        parentFolderName={currentFolder?.folder.name}
      />

      <MoveDocumentsModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onSubmit={handleMoveDocuments}
        selectedCount={selectedDocuments.length}
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
