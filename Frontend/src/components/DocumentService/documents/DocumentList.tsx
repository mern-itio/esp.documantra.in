
import { 
  MoreVertical, 
  Share2, 
  Star, 
  StarOff,
  Eye,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../ui/button';
import { useDocumentStore } from '../../common/store/documentStore';
import { cn, formatDate, formatFileSize } from '../../common/lib/utils';


const getFileTypeIcon = (type: string) => {
  const lowerType = type.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(lowerType)) {
    return Image;
  }
  if (['xls', 'xlsx', 'csv'].includes(lowerType)) {
    return FileSpreadsheet;
  }
  if (['ppt', 'pptx'].includes(lowerType)) {
    return Presentation;
  }
  return FileText;
};

interface DocumentListProps {
  onDocumentSelect?: (document: Document) => void;
}

export function DocumentList({ onDocumentSelect }: DocumentListProps) {
  const { 
    getFilteredDocuments, 
    selectedDocuments, 
    setSelectedDocuments,
    toggleFavorite,
    searchQuery 
  } = useDocumentStore();
  
  const documents = getFilteredDocuments();

  const handleDocumentSelect = (documentId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedDocuments([...selectedDocuments, documentId]);
    } else {
      setSelectedDocuments(selectedDocuments.filter(id => id !== documentId));
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
    <div className="p-6">
      {/* Table Header */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selectedDocuments.length === documents.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="grid grid-cols-12 gap-4 flex-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Modified</div>
              <div className="col-span-1">Shared</div>
              <div className="col-span-1">Actions</div>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {documents.map((document) => {
            const FileIcon = getFileTypeIcon(document.type);
            const isSelected = selectedDocuments.includes(document.id);
            
            return (
              <div
                key={document.id}
                className={cn(
                  "px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer",
                  isSelected && "bg-blue-50"
                )}
                onClick={() => onDocumentSelect?.(document as any)}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleDocumentSelect(document.id, e.target.checked);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  
                  <div className="grid grid-cols-12 gap-4 flex-1 items-center">
                    {/* Name */}
                    <div className="col-span-4 flex items-center space-x-3">
                      <FileIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {document.name}
                        </p>
                        {document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {document.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Size */}
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">{formatFileSize(document.size)}</p>
                    </div>

                    {/* Type */}
                    <div className="col-span-2">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {document.type.toUpperCase()}
                      </span>
                    </div>

                    {/* Modified */}
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">{formatDate(document.modifiedAt)}</p>
                    </div>

                    {/* Shared */}
                    <div className="col-span-1">
                      <div className="flex items-center space-x-2">
                        {document.shared && (
                          <Share2 className="w-4 h-4 text-blue-500" />
                        )}
                        {document.views > 0 && (
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{document.views}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(document.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {document.isFavorite ? (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
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