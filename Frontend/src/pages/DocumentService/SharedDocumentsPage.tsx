import { useState, useEffect } from 'react';
import { useDocumentStore } from '../../components/common/store/documentStore';
import { DocumentCard } from '../../components/DocumentService/documents/DocumentCard';
import { DocumentHeader } from '../../components/DocumentService/layout/DocumentHeader';
import { EmptyState } from '../../components/DocumentService/common/EmptyState';
import { Users, Eye, Edit, MessageSquare } from 'lucide-react';
import { documentAPI } from '../../services/api';
import type { Document } from '../../components/common/types';

export function SharedDocumentsPage() {
  const [sharedDocuments, setSharedDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const { currentUser } = useDocumentStore();

  useEffect(() => {
    loadSharedDocuments();
  }, []);

  const loadSharedDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all documents and filter for shared ones
      const response = await documentAPI.getUserDocuments();
      
      if (response.success) {
        // Filter documents that are shared with the current user
        const filtered = response.data.documents.filter((doc: any) => {
          return doc.sharedWith && doc.sharedWith.some((share: any) => 
            share.userId === currentUser?.email || share.email === currentUser?.email
          );
        });

        // Transform to match Document interface
        const transformed = filtered.map((doc: any) => ({
          id: doc._id,
          name: doc.name,
          type: doc.type,
          size: doc.size,
          createdAt: doc.createdAt,
          modifiedAt: doc.modifiedAt,
          uploadedBy: doc.uploadedBy,
          ownerId: doc.ownerId,
          folderId: doc.folderId?._id || doc.folderId,
          tags: doc.tags || [],
          shared: true,
          views: doc.views || 0,
          downloads: doc.downloads || 0,
          sharedWith: doc.sharedWith || [],
          isArchived: doc.isArchived || false,
          isFavorite: doc.isFavorite || false,
          description: doc.description || '',
          thumbnail: doc.thumbnail,
          content: doc.content
        }));

        setSharedDocuments(transformed);
      } else {
        setError(response.message || 'Failed to load shared documents');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load shared documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSelect = (documentId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedDocuments([...selectedDocuments, documentId]);
    } else {
      setSelectedDocuments(selectedDocuments.filter(id => id !== documentId));
    }
  };

  const getPermissionForUser = (document: Document) => {
    const share = document.sharedWith?.find((s: any) => 
      s.userId === currentUser?.email || s.email === currentUser?.email
    );
    return share?.permission || 'view';
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'view':
        return <Eye className="w-4 h-4" />;
      case 'edit':
        return <Edit className="w-4 h-4" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'view':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'edit':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'comment':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Error Loading Documents</div>
          <div className="text-gray-500 mb-4">{error}</div>
          <button
            onClick={loadSharedDocuments}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (sharedDocuments.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No Shared Documents"
        description="Documents shared with you will appear here. Ask your team members to share documents with you."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DocumentHeader />
      
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shared with Me</h1>
              <p className="text-gray-500">
                {sharedDocuments.length} document{sharedDocuments.length !== 1 ? 's' : ''} shared with you
              </p>
            </div>
          </div>
        </div>

        {/* Selection Header */}
        {selectedDocuments.length > 0 && (
          <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700 font-medium">
              {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedDocuments([])}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Documents Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {sharedDocuments.map((document) => {
            const permission = getPermissionForUser(document);
            
            return (
              <div key={document.id} className="relative">
                <DocumentCard
                  document={document}
                  isSelected={selectedDocuments.includes(document.id)}
                  onSelect={(isSelected) => handleDocumentSelect(document.id, isSelected)}
                />
                
                {/* Permission Badge */}
                <div className="absolute top-2 right-2 z-20">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getPermissionColor(permission)}`}>
                    <div className="flex items-center space-x-1">
                      {getPermissionIcon(permission)}
                      <span className="capitalize">{permission}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
