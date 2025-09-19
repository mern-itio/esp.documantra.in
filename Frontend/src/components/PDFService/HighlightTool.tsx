import React from 'react';
import { Highlighter } from 'lucide-react';
import { Button } from '../DocumentService/ui/button';

interface HighlightToolProps {
  currentPage: number;
  onAddEdit: (edit: any) => void;
}

export const HighlightTool: React.FC<HighlightToolProps> = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Highlighter className="w-4 h-4 text-gray-500" />
        <h4 className="font-medium text-gray-700">Highlight Tool</h4>
      </div>

      <div className="text-sm text-gray-600">
        <p>Select text on the PDF to highlight it.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Highlight Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm">Highlight</Button>
          <Button variant="outline" size="sm">Underline</Button>
          <Button variant="outline" size="sm">Strikethrough</Button>
          <Button variant="outline" size="sm">Squiggly</Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Color
        </label>
        <div className="flex space-x-2">
          {['#FFFF00', '#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF'].map((color) => (
            <button
              key={color}
              className="w-6 h-6 rounded border border-gray-300"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Opacity
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          defaultValue="0.3"
          className="w-full"
        />
      </div>
    </div>
  );
};
