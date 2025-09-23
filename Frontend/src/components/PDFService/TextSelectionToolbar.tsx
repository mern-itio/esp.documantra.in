import React from 'react';
import { X } from 'lucide-react';

interface TextSelectionToolbarProps {
  selectedText: string;
  position: { x: number; y: number };
  onHighlight: (color: string) => void;
  onClose: () => void;
  highlightColors?: Array<{id: string, hex: string, name: string}>;
}

const defaultHighlightColors = [
  { id: 'yellow', hex: '#ffff00', name: 'Yellow' },
  { id: 'pink', hex: '#ff69b4', name: 'Pink' },
  { id: 'green', hex: '#00ff00', name: 'Green' },
  { id: 'blue', hex: '#00bfff', name: 'Blue' },
  { id: 'orange', hex: '#ffa500', name: 'Orange' },
  { id: 'purple', hex: '#da70d6', name: 'Purple' }
];

export const TextSelectionToolbar: React.FC<TextSelectionToolbarProps> = ({
  selectedText,
  position,
  onHighlight,
  onClose,
  highlightColors = defaultHighlightColors
}) => {
  return (
    <div
      className="text-selection-toolbar absolute bg-white border border-gray-300 rounded-lg shadow-xl p-3 flex items-center space-x-3 z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)', // Center horizontally
        minWidth: '200px'
      }}
    >
      {/* Selected text preview */}
      <div className="text-sm text-gray-700 font-medium max-w-40 truncate mr-3">
        "{selectedText}"
      </div>
      
      {/* Highlight color buttons */}
      <div className="flex space-x-2">
        {highlightColors.map((color) => (
          <button
            key={color.id}
            onClick={() => onHighlight(color.hex)}
            className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
            style={{ backgroundColor: color.hex }}
            title={`Highlight with ${color.name}`}
          />
        ))}
      </div>
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
        title="Close toolbar"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
};
