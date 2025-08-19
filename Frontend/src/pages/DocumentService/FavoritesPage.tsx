import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { DocumentCard } from '../../components/DocumentService/documents/DocumentCard';
import { CollaborationHub } from '../../components/DocumentService/collaboration/CollaborationHub';
import { useDocumentStore } from '../../components/common/store/documentStore';
import { EmptyState } from '../../components/DocumentService/common/EmptyState';
import Loader from '../../components/common/loader';
import type { Document } from '../../components/common/types';

const FavoritesPage: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
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

  // Fetch favorite documents when component mounts
  useEffect(() => {
    const loadFavoriteDocuments = async () => {
      try {
        await Promise.all([
          fetchDocuments({ 
            folderId: currentFolderId,
            favoritesOnly: true,
            sortBy: 'modifiedAt',
            sortOrder: 'desc',
            limit: 100
          }),
          fetchFolders({ parentId: currentFolderId })
        ]);
      } catch (error) {
        console.error('Failed to load favorite documents:', error);
      }
    };

    loadFavoriteDocuments();
  }, [currentFolderId, fetchDocuments, fetchFolders]);

  // Get filtered documents from store and filter for favorite ones
  const allFilteredDocuments = getFilteredDocuments();
  const filteredDocuments = allFilteredDocuments.filter((doc: any) => doc.isFavorite);

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

  if (filteredDocuments.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No favorite documents"
        description="Documents you mark as favorite will appear here. Use the star icon in the document menu to add documents to favorites."
        action={null}
      />
    );
  }

  // Use the same grid/list logic as EnhancedDocumentGrid
  const gridClasses = viewMode === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'
    : 'space-y-2';

  return (
    <div className="space-y-6">
      {/* Content */}
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
};

export default FavoritesPage;
