import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthService/AuthContext';
import { useAuthInitialization } from '../../hooks/useAuthInitialization';
import { DocumentCard } from '../../components/DocumentService/documents/DocumentCard';
import { DocumentList } from '../../components/DocumentService/documents/DocumentList';
import { EmptyState } from '../../components/DocumentService/common/EmptyState';
import { CollaborationHub } from '../../components/DocumentService/collaboration/CollaborationHub';
import { Users } from 'lucide-react';
import { useDocumentStore } from '../../components/common/store/documentStore';
import Loader from '../../components/common/loader';
import type { Document } from '../../components/common/types';

export function SharedDocumentsPage() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use AuthContext for user data
  const { user: currentUser } = useAuth();
  
  // Initialize document store with user data
  useAuthInitialization();

  const { 
    fetchDocuments, 
    fetchFolders,
    currentFolderId,
    isLoading,
    selectedDocuments,
    setSelectedDocuments,
    getFilteredDocuments,
    viewMode
  } = useDocumentStore();

  // Fetch documents when component mounts
  useEffect(() => {
    if (currentUser) {
      const loadDocuments = async () => {
        try {
          await Promise.all([
            fetchDocuments({ 
              folderId: currentFolderId,
              limit: 100
            }),
            fetchFolders({ parentId: currentFolderId })
          ]);
        } catch (error) {
          console.error('Failed to load documents:', error);
          setError('Failed to load documents');
        }
      };

      loadDocuments();
    }
  }, [currentUser, currentFolderId, fetchDocuments, fetchFolders]);

  // Get filtered documents from store and filter for shared ones
  const allFilteredDocuments = getFilteredDocuments();
  const filteredDocuments = allFilteredDocuments.filter((doc: any) => {
    if (!doc.sharedWith || !Array.isArray(doc.sharedWith)) {
      return false;
    }
    
    return doc.sharedWith.some((share: any) => {
      const emailMatch = share.email === currentUser?.email;
      const userIdMatch = share.userId === currentUser?.email || share.userId === currentUser?.id;
      return emailMatch || userIdMatch;
    });
  });

  const handleDocumentSelect = (documentId: string, isSelected: boolean) => {
    if (isSelected) {
      const newSelection = [...selectedDocuments, documentId];
      setSelectedDocuments(newSelection);
    } else {
      const newSelection = selectedDocuments.filter(id => id !== documentId);
      setSelectedDocuments(newSelection);
    }
  };

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
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

  if (error) {
    return (
      <EmptyState
        icon={Users}
        title="Error loading documents"
        description={error}
        action={null}
      />
    );
  }

  if (filteredDocuments.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No shared documents"
        description="Documents shared with you will appear here. Ask someone to share a document with you to get started."
        action={null}
      />
    );
  }

  if (viewMode === 'list') {
    return (
      <DocumentList
        documents={filteredDocuments}
        onDocumentSelect={(doc) => setSelectedDocument(doc)}
      />
    );
  }

  const gridClasses =
    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4';

  return (
    <div className="space-y-6">
      <div className={gridClasses}>
        {filteredDocuments.map((document: Document) => {
          const isSelected = selectedDocuments.includes(document.id);
          return (
            <DocumentCard
              key={document.id}
              document={document}
              isSelected={isSelected}
              onSelect={(selected) => handleDocumentSelect(document.id, selected)}
              onClick={handleDocumentClick}
            />
          );
        })}
      </div>
    </div>
  );
}
