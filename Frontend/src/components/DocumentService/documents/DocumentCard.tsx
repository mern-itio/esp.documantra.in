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
  Presentation
} from 'lucide-react';
import type { Document } from '../../common/types';
import { Button } from '../ui/button';
import { useDocumentStore } from '../../common/store/documentStore';
import { cn, formatDate, formatFileSize } from '../../common/lib/utils';

interface DocumentCardProps {
  document: Document;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onClick?: (document: Document) => void;
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

export function DocumentCard({ document, isSelected, onSelect, onClick }: DocumentCardProps) {
  const { toggleFavorite, userPermissions } = useDocumentStore();
  const [showActions, setShowActions] = useState(false);

  const FileIcon = getFileTypeIcon(document.type);
  const fileTypeColor = getFileTypeColor(document.type);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(document.id);
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
          onClick={(e) => e.stopPropagation()} // 👈 stops modal trigger
          onChange={(e) => {
            console.log('🔍 Checkbox changed:', document.id, e.target.checked);
            console.log('🔍 onSelect function:', typeof onSelect);
            console.log('🔍 Calling onSelect with:', e.target.checked);
            onSelect(e.target.checked);
            console.log('🔍 onSelect called successfully');
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {/* Actions Menu */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
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
          "w-full h-24 rounded-lg flex items-center justify-center mb-3",
          fileTypeColor
        )}>
          <FileIcon className="w-8 h-8" />
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

        {/* Status Indicators */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {document.shared && (
              <Share2 className="w-3 h-3 text-blue-500" >Shared</Share2>
            )}
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