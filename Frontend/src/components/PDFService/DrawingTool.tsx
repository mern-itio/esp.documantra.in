import React from 'react';
import { Pen, Square} from 'lucide-react';

interface DrawingToolProps {
  currentPage: number;
  tool: string;
  onAddEdit: (edit: any) => void;
}

export const DrawingTool: React.FC<DrawingToolProps> = ({
  
  tool,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        {tool === 'pen' ? <Pen className="w-4 h-4 text-gray-500" /> : <Square className="w-4 h-4 text-gray-500" />}
        <h4 className="font-medium text-gray-700">
          {tool === 'pen' ? 'Drawing Tool' : 'Shape Tool'}
        </h4>
      </div>

      <div className="text-sm text-gray-600">
        <p>Click and drag on the PDF to {tool === 'pen' ? 'draw' : 'create shapes'}.</p>
        <p className="mt-2 text-xs text-gray-500">
          {tool === 'pen' 
            ? 'Draw freehand lines and curves'
            : 'Create rectangles, circles, and lines'
          }
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Stroke Width
        </label>
        <input
          type="range"
          min="1"
          max="10"
          defaultValue="2"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Color
        </label>
        <div className="flex space-x-2">
          {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'].map((color) => (
            <button
              key={color}
              className="w-6 h-6 rounded border border-gray-300"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
