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
  Users
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
  
  if (['pdf'].includes(lowerType)) return 'text-red-600 bg-red-50';
  if (['doc', 'docx'].includes(lowerType)) return 'text-blue-600 bg-blue-50';
  if (['xls', 'xlsx', 'csv'].includes(lowerType)) return 'text-green-600 bg-green-50';
  if (['ppt', 'pptx'].includes(lowerType)) return 'text-orange-600 bg-orange-50';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(lowerType)) return 'text-purple-600 bg-purple-50';
  
  return 'text-gray-600 bg-gray-50';
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
        "group relative bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer",
        isSelected && "ring-2 ring-blue-500 border-blue-500"
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
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {/* Collaboration Indicators */}
      {activeUsers.length > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex -space-x-1">
            {activeUsers.slice(0, 3).map((user, index) => (
              <div
                key={user.id}
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
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
              <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center text-xs font-medium text-gray-600">
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
            className="h-6 w-6 p-0 bg-white shadow-sm border"
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
          >
            <MoreVertical className="w-3 h-3" />
          </Button>
          
          {showActions && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
              <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50">
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50">
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50">
                <Move className="w-4 h-4" />
                <span>Move</span>
              </button>
              <div className="border-t border-gray-100 my-1" />
              {userPermissions.delete_own && (
                <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
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
              <Brain className="w-4 h-4 text-blue-600" title="AI Processed" />
            </div>
          )}
        </div>

        {/* Document Info */}
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-900 truncate" title={document.name}>
            {document.name}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatFileSize(document.size)}</span>
            <span>{document.type.toUpperCase()}</span>
          </div>
          
          <p className="text-xs text-gray-500">
            {formatDate(document.modifiedAt)}
          </p>
        </div>

        {/* Tags */}
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {document.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {document.tags.length > 2 && (
              <span className="text-xs text-gray-400">
                +{document.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Collaboration Status */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            {/* Comments */}
            {unresolvedComments > 0 && (
              <div className="flex items-center space-x-1" title={`${unresolvedComments} unresolved comments`}>
                <MessageCircle className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-orange-600">{unresolvedComments}</span>
              </div>
            )}
            
            {/* Versions */}
            {versions.length > 1 && (
              <div className="flex items-center space-x-1" title={`${versions.length} versions`}>
                <GitBranch className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600">{versions.length}</span>
              </div>
            )}
            
            {/* Active Workflows */}
            {activeWorkflows > 0 && (
              <div className="flex items-center space-x-1" title={`${activeWorkflows} active workflows`}>
                <Workflow className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">{activeWorkflows}</span>
              </div>
            )}
            
            {/* Shared indicator */}
            {document.shared && (
              <Share2 className="w-3 h-3 text-blue-500" title="Shared" />
            )}
            
            {/* Views */}
            {document.views > 0 && (
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{document.views}</span>
              </div>
            )}
          </div>
          
          <button
            onClick={handleFavoriteToggle}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {document.isFavorite ? (
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
            ) : (
              <StarOff className="w-3 h-3 text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}