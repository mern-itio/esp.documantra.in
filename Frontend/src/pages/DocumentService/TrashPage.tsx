import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/DocumentService/ui/button';
// import { Input } from '../../components/DocumentService/ui/input';
import { DocumentCard } from '../../components/DocumentService/documents/DocumentCard';
import { CollaborationHub } from '../../components/DocumentService/collaboration/CollaborationHub';
import { useDocumentStore } from '../../components/common/store/documentStore';
import { documentAPI } from '../../services/api';
import type { Document } from '../../components/common/types';

interface DocumentData {
  _id: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
  createdAt: string;
  modifiedAt: string;
  deletedAt: string;
  ownerId: string;
  uploadedBy: string;
  folderId?: string;
  tags?: string[];
  shared?: boolean;
  views?: number;
  downloads?: number;
  thumbnail?: string;
  content?: string;
  isFavorite: boolean;
  isArchived: boolean;
  isDeleted: boolean;
}

const TrashPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm] = useState('');
  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  // Get documents from store to listen for changes
  const storeDocuments = useDocumentStore((state: any) => state.documents);
  const { restoreFromTrash, permanentlyDelete } = useDocumentStore();

  // Load deleted documents
  useEffect(() => {
    loadDeletedDocuments();
  }, []);

  // Filter documents based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredDocuments(filtered);
    }
  }, [searchTerm, documents]);

  // Listen to changes in store documents and refresh deleted documents
  useEffect(() => {
    console.log('🔄 Store effect triggered - storeDocuments length:', storeDocuments.length, 'current documents length:', documents.length);
    if (storeDocuments.length > 0) {
      // Filter deleted documents from store
      const deletedFromStore = storeDocuments.filter((doc: any) => doc.isDeleted);
      console.log('📁 Deleted documents from store:', deletedFromStore.length);
      // Only update if we have more deleted documents than currently displayed
      if (deletedFromStore.length > documents.length) {
        console.log('✅ Updating documents from store');
        setDocuments(deletedFromStore);
        setFilteredDocuments(deletedFromStore);
      }
    }
  }, [storeDocuments, documents.length]);

  const loadDeletedDocuments = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading deleted documents...');
      const response = await documentAPI.getDeletedDocuments({
        limit: 100
      });

      console.log('📡 API Response:', response);

      if (response && response.success && response.data && response.data.documents && Array.isArray(response.data.documents)) {
        const transformedDocs = response.data.documents.map(transformDocumentData);
        console.log('✅ Transformed documents:', transformedDocs.length);
        setDocuments(transformedDocs);
        setFilteredDocuments(transformedDocs);
      } else if (response && response.success && Array.isArray(response.data)) {
        const transformedDocs = response.data.map(transformDocumentData);
        console.log('✅ Transformed documents (direct array):', transformedDocs.length);
        setDocuments(transformedDocs);
        setFilteredDocuments(transformedDocs);
      } else if (response && Array.isArray(response)) {
        const transformedDocs = response.map(transformDocumentData);
        console.log('✅ Transformed documents (response array):', transformedDocs.length);
        setDocuments(transformedDocs);
        setFilteredDocuments(transformedDocs);
      } else {
        console.warn('⚠️ Unexpected API response structure:', response);
        setDocuments([]);
        setFilteredDocuments([]);
      }
    } catch (error) {
      console.error('❌ Failed to load deleted documents:', error);
      setDocuments([]);
      setFilteredDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleDocumentClick = (document: Document) => {
  //   setSelectedDocument(document);
  // };

  const handleRestore = async (documentId: string) => {
    await restoreFromTrash(documentId);
    // Refresh the list
    loadDeletedDocuments();
  };

  const handlePermanentDelete = async (documentId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this document? This action cannot be undone.')) {
      await permanentlyDelete(documentId);
      // Refresh the list
      loadDeletedDocuments();
    }
  };

  const transformDocumentData = (doc: DocumentData): Document => {
    return {
      id: doc._id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      createdAt: doc.createdAt,
      modifiedAt: doc.modifiedAt,
      uploadedBy: doc.uploadedBy,
      ownerId: doc.ownerId,
      folderId: doc.folderId || null,
      tags: doc.tags || [],
      shared: doc.shared || false,
      views: doc.views || 0,
      downloads: doc.downloads || 0,
      thumbnail: doc.thumbnail,
      content: doc.content || '',
      sharedWith: [], // Empty array as SharePermission[] type
      isArchived: doc.isArchived || false,
      isFavorite: doc.isFavorite || false,
      isDeleted: doc.isDeleted || false,
      deletedAt: doc.deletedAt
    };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilPermanentDeletion = (deletedAt: string): number => {
    const deletedDate = new Date(deletedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - deletedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  if (selectedDocument) {
    return (
      <CollaborationHub
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    );
  }

  return (
    <div className="space-y-6">   


      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading deleted documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No deleted documents</h3>
          <p className="mt-1 text-sm text-gray-500">
            Documents you delete will appear here for 30 days before being permanently removed.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="relative">
              <DocumentCard
                document={document}
                isSelected={false}
                onSelect={() => {}}
                // onClick={() => handleDocumentClick(document)}
              />
              {/* Trash-specific actions overlay */}
              <div className="absolute top-2 right-2 flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 bg-white shadow-sm border"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(document.id);
                  }}
                  title="Restore document"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 bg-white shadow-sm border text-red-600 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePermanentDelete(document.id);
                  }}
                  title="Permanently delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {/* Days remaining indicator */}
              {document.deletedAt && (
                <div className="absolute bottom-2 left-2">
                  <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full shadow-sm border">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      {getDaysUntilPermanentDeletion(document.deletedAt)} days left
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deleted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Left
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {document.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {document.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {document.type.toUpperCase()} • {formatFileSize(document.size)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(document.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {document.deletedAt ? formatDate(document.deletedAt) : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {document.deletedAt && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={getDaysUntilPermanentDeletion(document.deletedAt) <= 7 ? 'text-red-600 font-medium' : ''}>
                          {getDaysUntilPermanentDeletion(document.deletedAt)} days
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(document.id)}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handlePermanentDelete(document.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Warning about permanent deletion */}
      {filteredDocuments.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Important Notice</h4>
              <p className="text-sm text-yellow-700">
                Documents in trash will be permanently deleted after 30 days. You can restore them at any time before then.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashPage;
