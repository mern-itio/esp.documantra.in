import React, { useState } from 'react';
import {
  MoreVertical,
  Download,
  Share2,
  Star,
  StarOff,
  Eye,
  Trash2,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation
} from 'lucide-react';
import type { Document } from '../../common/types';
import { Button } from '../ui/button';
import { useDocumentStore } from '../../common/store/documentStore';
import { Archive, ArchiveRestore } from 'lucide-react';
import { cn, formatDate, formatFileSize } from '../../common/lib/utils';
import { documentAPI } from '../../../services/api';

interface DocumentCardProps {
  document: Document;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onClick?: (document: Document) => void;
  showActionsMenu?: boolean; // New prop to control actions menu visibility
}

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

const getFileTypeColor = (type: string) => {
  const lowerType = type.toLowerCase();

  if (['pdf'].includes(lowerType))
    return 'text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/15';
  if (['doc', 'docx'].includes(lowerType))
    return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/15';
  if (['xls', 'xlsx', 'csv'].includes(lowerType))
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15';
  if (['ppt', 'pptx'].includes(lowerType))
    return 'text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/15';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(lowerType))
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15';

  return 'text-muted-foreground bg-muted';
};

export function DocumentCard({ document, isSelected, onSelect, onClick, showActionsMenu = true }: DocumentCardProps) {
  const { toggleFavorite, toggleArchive, moveToTrash, userPermissions } = useDocumentStore();
  const [showActions, setShowActions] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const FileIcon = getFileTypeIcon(document.type);
  const fileTypeColor = getFileTypeColor(document.type); 
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(document.id);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // console.log('Download button clicked for document:', document.id, document.name);
    setIsDownloading(true);
    setShowActions(false); // Close the menu after clicking download
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
      // You could add a toast notification here if you have one
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(document);
    } else {
      // This will be handled by the parent component (DocumentView)
      // The onClick prop should be passed from DocumentView to open CollaborationHub
      console.log('Document clicked, should open in CollaborationHub:', document.id);
    }
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer',
        isSelected && 'ring-2 ring-primary border-primary'
      )}
      onClick={handleCardClick}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onClick={(e) => e.stopPropagation()} // 👈 stops modal trigger
          onChange={(e) => {
            // console.log('🔍 Checkbox changed:', document.id, e.target.checked);
            // console.log('🔍 onSelect function:', typeof onSelect);
            // console.log('🔍 Calling onSelect with:', e.target.checked);
            onSelect(e.target.checked);
            // console.log('🔍 onSelect called successfully');
          }}
          className="rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Actions Menu */}
      {showActionsMenu && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 bg-background shadow-sm border border-border"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
            >
              <MoreVertical className="w-3 h-3" />
            </Button>

            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg py-1 z-20">
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground" style={{ cursor: 'pointer' }}>
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
                <button
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  style={{ cursor: 'pointer' }}
                >
                  {isDownloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground/30 border-t-primary" />
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
                    e.stopPropagation();
                    toggleArchive(document.id);
                    setShowActions(false);
                    // Clear any selection so header bulk actions disappear
                    try {
                      useDocumentStore.getState().setSelectedDocuments([]);
                    } catch {
                      /* noop */
                    }
                  }}
                  style={{ cursor: 'pointer' }}
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
                      setShowActions(false);
                      // Clear any selection so header bulk actions disappear
                      try {
                        useDocumentStore.getState().setSelectedDocuments([]);
                      } catch {
                        /* noop */
                      }
                    }}
                    style={{ cursor: 'pointer' }}
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

      {/* Document Preview/Icon */}
      <div className="p-4 pb-2">
        <div className={cn(
          "w-full h-24 rounded-lg flex items-center justify-center mb-3",
          fileTypeColor
        )}>
          <FileIcon className="w-8 h-8" />
        </div>

        {/* Document Info */}
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-foreground truncate" title={document.name}>
            {document.name}
          </h3>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatFileSize(document.size)}</span>
            <span>{document.type.toUpperCase()}</span>
          </div>

          <p className="text-xs text-muted-foreground">
            {formatDate(document.modifiedAt)}
          </p>
        </div>

        {/* Tags */}
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {document.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {document.tags.length > 2 && (
              <span className="text-xs text-muted-foreground/80">
                +{document.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
          <div className="flex items-center space-x-2">
            {document.shared && (
              <Share2 className="w-3 h-3 text-primary" aria-hidden />
            )}
            {document.isArchived && (
              <Archive className="w-3 h-3 text-muted-foreground" />
            )}
            {document.views > 0 && (
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{document.views}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleFavoriteToggle}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            {document.isFavorite ? (
              <Star className="w-3 h-3 text-amber-500 dark:text-amber-400 fill-current" />
            ) : (
              <StarOff className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
     
    </div>
  );
}