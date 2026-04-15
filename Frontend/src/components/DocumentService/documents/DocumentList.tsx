
import { 
  MoreVertical, 
  Share2, 
  Star, 
  StarOff,
  Eye,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation,
  Download,
  Trash2,
  Archive,
  ArchiveRestore,
  RotateCcw
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../ui/button';
import { useDocumentStore } from '../../common/store/documentStore';
import { cn, formatDate, formatFileSize } from '../../common/lib/utils';
import { useState } from 'react';
import type { Document } from '../../common/types';
import { documentAPI } from '../../../services/api';


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
  /** When provided, shows this list instead of store-filtered documents (Favorites, Recent, etc.). */
  documents?: Document[];
  /** Trash page: compact row actions instead of the default menu. */
  variant?: 'default' | 'trash';
  onRestore?: (documentId: string) => void;
  onPermanentDelete?: (documentId: string) => void;
}

export function DocumentList({
  onDocumentSelect,
  documents: documentsProp,
  variant = 'default',
  onRestore,
  onPermanentDelete,
}: DocumentListProps) {
  const { 
    getFilteredDocuments, 
    selectedDocuments, 
    setSelectedDocuments,
    toggleFavorite,
    searchQuery,
    userPermissions,
    toggleArchive,
    moveToTrash
  } = useDocumentStore();
  
  const documents = documentsProp ?? getFilteredDocuments();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

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

  const handleDropdownToggle = (documentId: string) => {
    console.log('🔍 Toggling dropdown for document:', documentId, 'Current open:', openDropdown);
    setOpenDropdown(openDropdown === documentId ? null : documentId);
  };

  const handleDownload = async (document: Document) => {
    setIsDownloading(document.id);
    setOpenDropdown(null);
    try {
      const result = await documentAPI.downloadDocument(document.id);
      console.log('Download result:', result);
      if (result.success) {
        console.log('Download started successfully');
      } else {
        console.error('Download failed:', result.message);
      }
    } catch (error) {
      console.error('Failed to download document:', error);
    } finally {
      setIsDownloading(null);
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
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selectedDocuments.length === documents.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="grid grid-cols-12 gap-4 flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
          <div className="divide-y divide-border">
          {documents.map((document) => {
            const FileIcon = getFileTypeIcon(document.type);
            const isSelected = selectedDocuments.includes(document.id);
            
            return (
              <div
                key={document.id}
                className={cn(
                  "px-4 py-3 hover:bg-accent hover:text-accent-foreground transition-colors",
                  isSelected && "bg-accent/50"
                )}
                onDoubleClick={() => onDocumentSelect?.(document as any)}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleDocumentSelect(document.id, e.target.checked);
                    }}
                    className="rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  
                  <div className="grid grid-cols-12 gap-4 flex-1 items-center">
                    {/* Name */}
                    <div className="col-span-4 flex items-center space-x-3">
                      <FileIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {document.name}
                        </p>
                        {document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {document.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
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
                        <p className="text-sm text-muted-foreground">{formatFileSize(document.size)}</p>
                    </div>

                    {/* Type */}
                    <div className="col-span-2">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                        {document.type.toUpperCase()}
                      </span>
                    </div>

                    {/* Modified */}
                    <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">{formatDate(document.modifiedAt)}</p>
                    </div>

                    {/* Shared */}
                    <div className="col-span-1">
                      <div className="flex items-center space-x-2">
                        {document.shared && (
                          <Share2 className="w-4 h-4 text-primary" />
                        )}
                        {document.views > 0 && (
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{document.views}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1">
                      {variant === 'trash' && onRestore && onPermanentDelete ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRestore(document.id);
                            }}
                            title="Restore document"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  'Permanently delete this document? This cannot be undone.'
                                )
                              ) {
                                onPermanentDelete(document.id);
                              }
                            }}
                            title="Permanently delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(document.id);
                          }}
                            className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                          title={document.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          {document.isFavorite ? (
                            <Star className="w-4 h-4 text-primary fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        
                        <div className="relative">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDropdownToggle(document.id);
                            }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                          
                          {openDropdown === document.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-20">
                              <button 
                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground" 
                                style={{cursor: 'pointer'}}
                              >
                                <Eye className="w-4 h-4" />
                                <span>Preview</span>
                              </button>
                              <button 
                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed" 
                                onClick={(e) => {
                                  console.log('🔍 Download button clicked for:', document.name);
                                  e.stopPropagation();
                                  handleDownload(document);
                                }}
                                disabled={isDownloading === document.id}
                                style={{cursor: 'pointer'}}
                              >
                                {isDownloading === document.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted-foreground"></div>
                                    <span>Downloading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-4 h-4" />
                                    <span>Download</span>
                                  </>
                                )}
                              </button>
                              <button 
                                className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                onClick={(e) => {
                                  console.log('🔍 Archive button clicked for:', document.name);
                                  e.stopPropagation();
                                  toggleArchive(document.id);
                                  setOpenDropdown(null);
                                }}
                                style={{cursor: 'pointer'}}
                              >
                                {document.isArchived ? (
                                  <>
                                    <ArchiveRestore className="w-4 h-4" />
                                    <span>Unarchive</span>
                                  </>
                                ) : (
                                  <>
                                    <Archive className="w-4 h-4" />
                                    <span>Archive</span>
                                  </>
                                )}
                              </button>
                                <div className="border-t border-border my-1" />
                              {userPermissions.delete_own && (
                                <button 
                                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveToTrash(document.id);
                                    setOpenDropdown(null);
                                  }}
                                  style={{cursor: 'pointer'}}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Move to Trash</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      )}
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