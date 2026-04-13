import { DocumentCard } from './DocumentCard';
import { EmptyState } from '../common/EmptyState';
import { FileText } from 'lucide-react';
import { useDocumentStore } from '../../common/store/documentStore';
import type { Document } from '../../common/types';

export function DocumentGrid() {
  const { 
    getFilteredDocuments, 
    selectedDocuments, 
    setSelectedDocuments,
    searchQuery 
  } = useDocumentStore();
  
  const documents = getFilteredDocuments();

  const handleDocumentSelect = (documentId: string, isSelected: boolean) => {
    console.log('🔍 Document selection changed:', documentId, isSelected);
    console.log('🔍 Current selected documents:', selectedDocuments);
    
    if (isSelected) {
      const newSelection = [...selectedDocuments, documentId];
      console.log('🔍 Adding to selection:', newSelection);
      setSelectedDocuments(newSelection);
    } else {
      const newSelection = selectedDocuments.filter(id => id !== documentId);
      console.log('🔍 Removing from selection:', newSelection);
      setSelectedDocuments(newSelection);
    }
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedDocuments(documents.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={searchQuery ? "No documents found" : "No documents yet"}
        description={
          searchQuery 
            ? "Try adjusting your search or filters"
            : "Upload your first document to get started"
        }
      />
    );
  }

  return (
    <div className="p-6 text-foreground">
      {/* Selection Header */}
      {documents.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedDocuments.length === documents.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="text-sm text-muted-foreground">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {selectedDocuments.length > 0 && (
            <span className="text-sm font-medium text-primary">
              {selectedDocuments.length} selected
            </span>
          )}
        </div>
      )}

      {/* Document Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {documents.map((document: Document) => (
          <DocumentCard
            key={document.id}
            document={document}
            isSelected={selectedDocuments.includes(document.id)}
            onSelect={(isSelected) => handleDocumentSelect(document.id, isSelected)}
          />
        ))}
      </div>
    </div>
  );
}