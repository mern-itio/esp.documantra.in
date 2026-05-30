import React from 'react';
import { History, Trash2, Type, Square, Image as ImageIcon, Highlighter } from 'lucide-react';
import { Button } from '../DocumentService/ui/button';
import type { EditOperation } from '../../types/advancedPdfEditor';

interface EditHistoryProps {
  edits: EditOperation[];
  onClear: () => void;
}

export const EditHistory: React.FC<EditHistoryProps> = ({ edits, onClear }) => {
  const getEditIcon = (type: string) => {
    switch (type) {
      case 'replaceText':
      case 'addText':
        return <Type className="w-3 h-3" />;
      case 'addShape':
        return <Square className="w-3 h-3" />;
      case 'addImage':
        return <ImageIcon className="w-3 h-3" />;
      case 'highlight':
        return <Highlighter className="w-3 h-3" />;
      default:
        return <Type className="w-3 h-3" />;
    }
  };

  const getEditDescription = (edit: EditOperation) => {
    switch (edit.type) {
      case 'replaceText':
        return `Replaced text: "${edit.oldText?.substring(0, 20)}..." → "${edit.newText?.substring(0, 20)}..."`;
      case 'addText':
        return `Added text: "${edit.text?.substring(0, 30)}..."`;
      case 'addShape':
        return `Added ${edit.shapeType} shape`;
      case 'addImage':
        return 'Added image';
      case 'highlight':
        return 'Added highlight';
      default:
        return edit.type;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-gray-500" />
          <h4 className="font-medium text-gray-700">Edit History</h4>
        </div>
        {edits.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>

      {edits.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No edits yet
        </p>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {edits.map((edit, index) => (
            <div
              key={index}
              className="flex items-start space-x-2 p-2 bg-[#F5F2EE] rounded text-xs"
            >
              <div className="flex-shrink-0 mt-0.5 text-gray-500">
                {getEditIcon(edit.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 truncate">
                  {getEditDescription(edit)}
                </p>
                <p className="text-gray-500">
                  Page {edit.pageNumber}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {edits.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {edits.length} edit{edits.length !== 1 ? 's' : ''} pending
          </p>
        </div>
      )}
    </div>
  );
};
