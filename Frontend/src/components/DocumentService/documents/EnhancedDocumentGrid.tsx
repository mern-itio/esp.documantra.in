import { useEffect, useState } from 'react';
import { DocumentCard } from './DocumentCard';
import { useDocumentStore } from '../../common/store/documentStore';
import type { Document, ViewMode } from '../../common/types';
import { EmptyState } from '../common/EmptyState';
import Loader from '../../common/loader';
import { Upload, FolderOpen } from 'lucide-react';
import { Button } from '../ui/button';

interface EnhancedDocumentGridProps {
  viewMode?: ViewMode;
  onDocumentSelect?: (document: Document) => void;
  onDocumentAction?: (action: string, document: Document) => void;
}

export function EnhancedDocumentGrid({ 
  viewMode = 'grid',
  onDocumentSelect,
  onDocumentAction 
}: EnhancedDocumentGridProps) {
  const { 
    getFilteredDocuments, 
    fetchDocuments, 
    fetchFolders,
    currentFolderId,
    isLoading,
    selectedDocuments,
    setSelectedDocuments,
    // documents,
    // folders
  } = useDocumentStore();
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch documents and folders when component mounts or folder changes
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchDocuments({ folderId: currentFolderId }),
          fetchFolders({ parentId: currentFolderId })
        ]);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize data:', error);
      }
    };

    initializeData();
  }, [currentFolderId, fetchDocuments, fetchFolders]);

  // Get filtered documents based on current state
  const filteredDocuments = getFilteredDocuments();

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
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
        icon={currentFolderId ? FolderOpen : Upload}
        title="No documents found"
        description={
          currentFolderId 
            ? "This folder is empty. Upload some documents to get started."
            : "You haven't uploaded any documents yet. Upload your first document to get started."
        }
        action={
          <Button
            onClick={() => {
              if (onDocumentAction) {
                onDocumentAction('upload', {} as Document);
              }
            }}
          >
            Upload Document
          </Button>
        }
      />
    );
  }

  const gridClasses = viewMode === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'
    : 'space-y-2';

  const handleDocumentSelect = (documentId: string, isSelected: boolean) => {
    if (isSelected) {
      const newSelection = [...selectedDocuments, documentId];
      setSelectedDocuments(newSelection);
    } else {
      const newSelection = selectedDocuments.filter((id) => id !== documentId);
      setSelectedDocuments(newSelection);
    }
  };

  return (
    <div className={gridClasses}>
      {filteredDocuments.map((document) => {
        const isSelected = selectedDocuments.includes(document.id);
        return (
          <DocumentCard
            key={document.id}
            document={document}
            isSelected={isSelected}
            onSelect={(selected) => handleDocumentSelect(document.id, selected)}
            onClick={onDocumentSelect}
          />
        );
      })}
    </div>
  );
}