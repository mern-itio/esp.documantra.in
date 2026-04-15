import React, { useState, useEffect } from 'react';
import { Folder } from 'lucide-react';
import { DocumentCard } from '../../components/DocumentService/documents/DocumentCard';
import { DocumentList } from '../../components/DocumentService/documents/DocumentList';
import { CollaborationHub } from '../../components/DocumentService/collaboration/CollaborationHub';
import { useDocumentStore } from '../../components/common/store/documentStore';
import { EmptyState } from '../../components/DocumentService/common/EmptyState';
import Loader from '../../components/common/loader';
import type { Document } from '../../components/common/types';

const ArchivedPage: React.FC = () => {
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

  // Fetch archived documents when component mounts
  useEffect(() => {
    const loadArchivedDocuments = async () => {
      try {
        await Promise.all([
          fetchDocuments({ 
            folderId: currentFolderId,
            archivedOnly: true,
            sortBy: 'modifiedAt',
            sortOrder: 'desc',
            limit: 100
          }),
          fetchFolders({ parentId: currentFolderId })
        ]);
      } catch (error) {
        console.error('Failed to load archived documents:', error);
      }
    };

    loadArchivedDocuments();
  }, [currentFolderId, fetchDocuments, fetchFolders]);

  // Get filtered documents from store - only archived ones
  const filteredDocuments = getFilteredDocuments({ archivedOnly: true });

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
        icon={Folder}
        title="No archived documents"
        description="Documents you archive will appear here. Use the archive action in the document menu to archive documents."
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
};

export default ArchivedPage;
