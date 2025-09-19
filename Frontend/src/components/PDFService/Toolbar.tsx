import React from 'react';
import { 
  MousePointer, 
  Type, 
  Pen, 
  Square, 
  Image as ImageIcon, 
  Highlighter,
} from 'lucide-react';
import { Button } from '../DocumentService/ui/button';

interface ToolbarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
}

const tools = [
  { id: 'select', icon: MousePointer, label: 'Select', description: 'Select and edit text elements' },
  { id: 'text', icon: Type, label: 'Text', description: 'Add new text elements' },
  { id: 'pen', icon: Pen, label: 'Pen', description: 'Draw freehand lines' },
  { id: 'shape', icon: Square, label: 'Shape', description: 'Add shapes and lines' },
  { id: 'image', icon: ImageIcon, label: 'Image', description: 'Insert images' },
  { id: 'highlight', icon: Highlighter, label: 'Highlight', description: 'Highlight text' }
];

export const Toolbar: React.FC<ToolbarProps> = ({ selectedTool, onToolSelect }) => {
  return (
    <div className="border-b border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Tools</h3>
      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selectedTool === tool.id;
          
          return (
            <Button
              key={tool.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onToolSelect(tool.id)}
              className={`h-auto p-3 flex flex-col items-center space-y-1 ${
                isSelected 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'hover:bg-gray-50'
              }`}
              title={tool.description}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs">{tool.label}</span>
            </Button>
          );
        })}
      </div>
      
      {/* Tool Description */}
      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
        {tools.find(tool => tool.id === selectedTool)?.description}
      </div>
    </div>
  );
};
