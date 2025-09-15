import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { DocumentCard } from '../../components/DocumentService/documents/DocumentCard';
import { CollaborationHub } from '../../components/DocumentService/collaboration/CollaborationHub';
import { useDocumentStore } from '../../components/common/store/documentStore';
import { EmptyState } from '../../components/DocumentService/common/EmptyState';
import Loader from '../../components/common/loader';
import type { Document } from '../../components/common/types';

const RecentPage: React.FC = () => {
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

  // Fetch recent documents when component mounts
  useEffect(() => {
    const loadRecentDocuments = async () => {
      try {
        await Promise.all([
          fetchDocuments({ 
            folderId: currentFolderId,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            limit: 100
          }),
          fetchFolders({ parentId: currentFolderId })
        ]);
      } catch (error) {
        console.error('Failed to load recent documents:', error);
      }
    };

    loadRecentDocuments();
  }, [currentFolderId, fetchDocuments, fetchFolders]);

  // Get filtered documents from store (already sorted by store's sorting settings)
  const allFilteredDocuments = getFilteredDocuments();
  const filteredDocuments = allFilteredDocuments
    .filter((doc: any) => !doc.isDeleted && !doc.isArchived)
    .slice(0, 100);

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
        icon={Clock}
        title="No recent documents"
        description="Your recently created or modified documents will appear here."
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

export default RecentPage;
