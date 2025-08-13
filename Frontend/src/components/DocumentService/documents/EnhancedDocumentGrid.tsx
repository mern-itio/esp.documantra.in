import React, { useEffect, useState } from 'react';
import { DocumentCard } from './DocumentCard';
import { useDocumentStore } from '../../common/store/documentStore';
import type { Document, ViewMode } from '../../common/types';
import { EmptyState } from '../common/EmptyState';
import Loader from '../../common/loader';
import { Upload, FolderOpen } from 'lucide-react';

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
    documents,
    folders
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
          <button
            onClick={() => {
              if (onDocumentAction) {
                onDocumentAction('upload', {} as Document);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Upload Document
          </button>
        }
      />
    );
  }

  const gridClasses = viewMode === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'
    : 'space-y-2';

  return (
    <div className={gridClasses}>
      {filteredDocuments.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          isSelected={false}
          onSelect={(selected) => {
            // Handle selection logic here if needed
            console.log('Document selected:', document.id, selected);
          }}
          onClick={onDocumentSelect}
        />
      ))}
    </div>
  );
}