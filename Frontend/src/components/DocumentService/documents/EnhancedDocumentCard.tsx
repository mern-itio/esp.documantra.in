import React, { useState } from 'react';
import {
  MoreVertical,
  Download,
  Share2,
  Star,
  StarOff,
  Eye,
  Move,
  Trash2,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation,
  MessageCircle,
  GitBranch,
  Workflow,
  Brain,
  // Users
} from 'lucide-react';
import type { Document } from '../../common/types';
import { Button } from '../ui/button';
import { useCollaborationStore } from '../../common/store/collaborationStore';
import { useDocumentStore } from '../../common/store/documentStore';
import { cn, formatDate, formatFileSize } from '../../common/lib/utils';

interface EnhancedDocumentCardProps {
  document: Document;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onOpenCollaboration: (documentId: string) => void;
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
    return 'text-violet-600 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-500/15';

  return 'text-muted-foreground bg-muted';
};

export function EnhancedDocumentCard({
  document,
  isSelected,
  onSelect,
  onOpenCollaboration
}: EnhancedDocumentCardProps) {
  const { toggleFavorite, userPermissions } = useDocumentStore();
  const {
    getDocumentComments,
    getDocumentVersions,
    getDocumentWorkflows,
    getActiveUsers,
    getDocumentAnalysis
  } = useCollaborationStore();

  const [showActions, setShowActions] = useState(false);

  const FileIcon = getFileTypeIcon(document.type);
  const fileTypeColor = getFileTypeColor(document.type);

  // Get collaboration data
  const comments = getDocumentComments(document.id);
  const versions = getDocumentVersions(document.id);
  const workflows = getDocumentWorkflows(document.id);
  const activeUsers = getActiveUsers(document.id);
  const analysis = getDocumentAnalysis(document.id);

  const unresolvedComments = comments.filter(c => !c.resolved).length;
  const activeWorkflows = workflows.filter(w => w.status === 'active').length;

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(document.id);
  };

  const handleCardClick = () => {
    onOpenCollaboration(document.id);
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
          onChange={(e) => {
            e.stopPropagation();
            onSelect(e.target.checked);
          }}
          className="rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Collaboration Indicators */}
      {activeUsers.length > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex -space-x-1">
            {activeUsers.slice(0, 3).map((user) => (
              <div
                key={user.id}
                className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center text-xs text-white font-medium">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
            ))}
            {activeUsers.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-muted border-2 border-background shadow-sm flex items-center justify-center text-xs font-medium text-muted-foreground">
                +{activeUsers.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions Menu */}
      <div className="absolute top-8 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                <Move className="w-4 h-4" />
                <span>Move</span>
              </button>
              <div className="border-t border-border my-1" />
              {userPermissions.delete_own && (
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Document Preview/Icon */}
      <div className="p-4 pb-2">
        <div className={cn(
          "w-full h-24 rounded-lg flex items-center justify-center mb-3 relative",
          fileTypeColor
        )}>
          <FileIcon className="w-8 h-8" />

          {/* Processing Status */}
          {analysis && (
            <div className="absolute top-1 right-1">
              <Brain className="w-3 h-3 text-primary">
                <title>Shared</title>
              </Brain>
            </div>
          )}
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

        {/* Collaboration Status */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
          <div className="flex items-center space-x-3">
            {/* Comments */}
            {unresolvedComments > 0 && (
              <div className="flex items-center space-x-1" title={`${unresolvedComments} unresolved comments`}>
                <MessageCircle className="w-3 h-3 text-orange-500 dark:text-orange-400" />
                <span className="text-xs text-orange-600 dark:text-orange-400">{unresolvedComments}</span>
              </div>
            )}

            {/* Versions */}
            {versions.length > 1 && (
              <div className="flex items-center space-x-1" title={`${versions.length} versions`}>
                <GitBranch className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary">{versions.length}</span>
              </div>
            )}

            {/* Active Workflows */}
            {activeWorkflows > 0 && (
              <div className="flex items-center space-x-1" title={`${activeWorkflows} active workflows`}>
                <Workflow className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400">{activeWorkflows}</span>
              </div>
            )}

            {/* Shared indicator */}
            {document.shared && (
              <Share2 className="w-3 h-3 text-primary">
                <title>Shared</title>
              </Share2>
            )}

            {/* Views */}
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