import React, { useState, useEffect } from 'react';
import { Folder } from 'lucide-react';
// import { Button } from '../../components/DocumentService/ui/button';
// import { Input } from '../../components/DocumentService/ui/input';
import { DocumentCard } from '../../components/DocumentService/documents/DocumentCard';
import { CollaborationHub } from '../../components/DocumentService/collaboration/CollaborationHub';
import { useDocumentStore } from '../../components/common/store/documentStore';
import { documentAPI } from '../../services/api';
import type { Document } from '../../components/common/types';

interface DocumentData {
  _id: string;
  name: string;
  description?: string;
  type: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
  uploadedBy: string;
  ownerId: string;
  folderId?: string;
  tags?: string[];
  content?: string;
  isArchived?: boolean;
  isFavorite?: boolean;
  isPublic?: boolean;
  shared?: boolean;
  views?: number;
  downloads?: number;
  sharedWith?: string[];
  createdAt: string;
  modifiedAt: string;
  lastAccessedAt?: string;
  updatedAt?: string;
}

const ArchivedPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm] = useState('');
  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  // Get documents from store to listen for changes
  const storeDocuments = useDocumentStore((state: any) => state.documents);

  // Load archived documents
  useEffect(() => {
    loadArchivedDocuments();
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

  // Listen to changes in store documents and refresh archived documents
  useEffect(() => {
    if (storeDocuments.length > 0) {
      // Filter archived documents from store
      const archivedFromStore = storeDocuments.filter((doc: any) => doc.isArchived);
      if (archivedFromStore.length !== documents.length) {
        setDocuments(archivedFromStore);
        setFilteredDocuments(archivedFromStore);
      }
    }
  }, [storeDocuments, documents.length]);

  const loadArchivedDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await documentAPI.getUserDocuments({
        archivedOnly: true,
        sortBy: 'modifiedAt',
        sortOrder: 'desc',
        limit: 100
      });

      if (response && response.success && response.data && response.data.documents && Array.isArray(response.data.documents)) {
        const transformedDocs = response.data.documents.map(transformDocumentData);
        setDocuments(transformedDocs);
        setFilteredDocuments(transformedDocs);
      } else if (response && response.success && Array.isArray(response.data)) {
        const transformedDocs = response.data.map(transformDocumentData);
        setDocuments(transformedDocs);
        setFilteredDocuments(transformedDocs);
      } else if (response && Array.isArray(response)) {
        const transformedDocs = response.map(transformDocumentData);
        setDocuments(transformedDocs);
        setFilteredDocuments(transformedDocs);
      } else {
        console.warn('Unexpected API response structure:', response);
        setDocuments([]);
        setFilteredDocuments([]);
      }
    } catch (error) {
      console.error('Failed to load archived documents:', error);
      setDocuments([]);
      setFilteredDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
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
      isFavorite: doc.isFavorite || false
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
          <p className="mt-2 text-sm text-gray-500">Loading archived documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No archived documents</h3>
          <p className="mt-1 text-sm text-gray-500">
            Documents you archive will appear here. Use the archive action in the document menu to archive documents.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              isSelected={false}
              onSelect={() => {}}
              onClick={() => handleDocumentClick(document)}
            />
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
                  Modified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((document) => (
                <tr
                  key={document.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleDocumentClick(document)}
                >
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
                    {formatDate(document.modifiedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {document.type.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ArchivedPage;
