import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { Button } from '../../components/DocumentService/ui/button';
import { DocumentCard } from '../../components/DocumentService/documents/DocumentCard';
import { CollaborationHub } from '../../components/DocumentService/collaboration/CollaborationHub';
import { useDocumentStore } from '../../components/common/store/documentStore';
import { documentAPI } from '../../services/api';
import { EmptyState } from '../../components/DocumentService/common/EmptyState';
import Loader from '../../components/common/loader';
import type { Document } from '../../components/common/types';

const TrashPage: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deletedDocuments, setDeletedDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    selectedDocuments,
    setSelectedDocuments,
    restoreFromTrash, 
    permanentlyDelete 
  } = useDocumentStore();

  // Fetch deleted documents when component mounts
  useEffect(() => {
    const loadDeletedDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await documentAPI.getDeletedDocuments({
          limit: 100
        });

        if (response.success && response.data && response.data.documents) {
          // Transform API response to match our Document interface
          const transformedDocuments: Document[] = response.data.documents.map((doc: any) => ({
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
            shared: doc.shared || false,
            views: doc.views || 0,
            downloads: doc.downloads || 0,
            sharedWith: doc.sharedWith || [],
            isArchived: doc.isArchived || false,
            isFavorite: doc.isFavorite || false,
            isDeleted: doc.isDeleted || false,
            deletedAt: doc.deletedAt,
            description: doc.description || '',
            thumbnail: doc.thumbnail,
            content: doc.content
          }));
          
          setDeletedDocuments(transformedDocuments);
        } else {
          console.warn('Unexpected API response structure:', response);
          setDeletedDocuments([]);
        }
      } catch (error) {
        console.error('Failed to load deleted documents:', error);
        setDeletedDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeletedDocuments();
  }, []);

  const handleDocumentSelect = (documentId: string, isSelected: boolean) => {
    if (isSelected) {
      const newSelection = [...selectedDocuments, documentId];
      setSelectedDocuments(newSelection);
    } else {
      const newSelection = selectedDocuments.filter(id => id !== documentId);
      setSelectedDocuments(newSelection);
    }
  };
  const handleRestore = async (documentId: string) => {
    try {
      await restoreFromTrash(documentId);
      // Remove from local state after restore
      setDeletedDocuments(prev => prev.filter(doc => doc.id !== documentId));
      // Clear selection after restore
      setSelectedDocuments([]);
    } catch (error) {
      console.error('Failed to restore document:', error);
    }
  };

  const handlePermanentlyDelete = async (documentId: string) => {
    try {
      await permanentlyDelete(documentId);
      // Remove from local state after deletion
      setDeletedDocuments(prev => prev.filter(doc => doc.id !== documentId));
      // Clear selection after deletion
      setSelectedDocuments([]);
    } catch (error: any) {
      console.error('Failed to permanently delete document:', error);
      alert('Failed to permanently delete document. Please try again.');
    }
  };

  if (selectedDocument) {
    return (
      <CollaborationHub
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
    );
  }

  if (deletedDocuments.length === 0) {
    return (
      <EmptyState
        icon={Trash2}
        title="No deleted documents"
        description="Documents you delete will appear here. You can restore them or permanently delete them."
        action={null}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      {selectedDocuments.length > 0 && (
        <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700 font-medium">
            {selectedDocuments.length} document(s) selected
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              selectedDocuments.forEach(id => handleRestore(id));
            }}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restore All
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (window.confirm(`Are you sure you want to permanently delete ${selectedDocuments.length} document(s)? This action cannot be undone.`)) {
                selectedDocuments.forEach(id => handlePermanentlyDelete(id));
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Permanently
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {deletedDocuments.map((document: Document) => {
          const isSelected = selectedDocuments.includes(document.id);
          return (
            <div key={document.id} className="relative">
              <DocumentCard
                document={document}
                isSelected={isSelected}
                onSelect={(selected) => handleDocumentSelect(document.id, selected)}
                showActionsMenu={false}
                // onClick={handleDocumentClick}
              />
              
              {/* Trash-specific actions overlay */}
              <div className="absolute top-2 right-2 flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 bg-white shadow-sm border hover:bg-green-50 hover:text-green-600"
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
                  className="h-8 w-8 p-0 bg-white shadow-sm border text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to permanently delete this document? This action cannot be undone.')) {
                      handlePermanentlyDelete(document.id);
                    }
                  }}
                  title="Permanently delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Days remaining indicator - Removed since documents can be deleted immediately */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrashPage;
