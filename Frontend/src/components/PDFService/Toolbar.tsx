import React from 'react';
import { 
  MousePointer, 
  Type, 
  Pen, 
  Square, 
  RectangleHorizontal,
  Circle,
  Minus,
  Image as ImageIcon, 
  Highlighter,
} from 'lucide-react';
import { Button } from '../DocumentService/ui/button';

interface ToolbarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  selectedShape?: string;
  onShapeSelect?: (shape: string) => void;
  selectedShapeElement?: any;
  onShapeColorChange?: (color: string) => void;
  highlightColor?: string;
  onHighlightColorChange?: (color: string) => void;
}

const tools = [
  { id: 'select', icon: MousePointer, label: 'Select', description: 'Select and edit text elements' },
  { id: 'text', icon: Type, label: 'Text', description: 'Add new text elements' },
  { id: 'pen', icon: Pen, label: 'Pen', description: 'Draw freehand lines' },
  { id: 'shape', icon: Square, label: 'Shape', description: 'Add shapes and lines' },
  { id: 'image', icon: ImageIcon, label: 'Image', description: 'Insert images' },
  { id: 'highlight', icon: Highlighter, label: 'Highlight', description: 'Highlight text' }
];

const shapes = [
  { id: 'square', icon: Square, label: 'Square', description: 'Add square shape' },
  { id: 'rectangle', icon: RectangleHorizontal, label: 'Rectangle', description: 'Add rectangle shape' },
  { id: 'circle', icon: Circle, label: 'Circle', description: 'Add circle shape' },
  { id: 'line', icon: Minus, label: 'Line', description: 'Add line shape' }
];

const colors = [
  { id: 'black', hex: '#000000', name: 'Black' },
  { id: 'red', hex: '#ef4444', name: 'Red' },
  { id: 'blue', hex: '#3b82f6', name: 'Blue' },
  { id: 'green', hex: '#22c55e', name: 'Green' },
  { id: 'yellow', hex: '#eab308', name: 'Yellow' },
  { id: 'purple', hex: '#a855f7', name: 'Purple' }
];

const highlightColors = [
  { id: 'yellow', hex: '#ffff00', name: 'Yellow' },
  { id: 'pink', hex: '#ff69b4', name: 'Pink' },
  { id: 'green', hex: '#00ff00', name: 'Green' },
  { id: 'blue', hex: '#00bfff', name: 'Blue' },
  { id: 'orange', hex: '#ffa500', name: 'Orange' },
  { id: 'purple', hex: '#da70d6', name: 'Purple' }
];

export const Toolbar: React.FC<ToolbarProps> = ({ 
  selectedTool, 
  onToolSelect, 
  selectedShape, 
  onShapeSelect, 
  selectedShapeElement, 
  onShapeColorChange,
  highlightColor = '#ffff00',
  onHighlightColorChange
}) => {
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
      
      {/* Shape Options - Show when shape tool is selected */}
      {selectedTool === 'shape' && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Shapes</h4>
          <div className="grid grid-cols-2 gap-2">
            {shapes.map((shape) => {
              const Icon = shape.icon;
              const isSelected = selectedShape === shape.id;
              
              return (
                <Button
                  key={shape.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onShapeSelect?.(shape.id)}
                  className={`h-auto p-2 flex flex-col items-center space-y-1 ${
                    isSelected 
                      ? 'bg-green-600 text-white border-green-600' 
                      : 'hover:bg-gray-50'
                  }`}
                  title={shape.description}
                >
                  <Icon className="w-3 h-3" />
                  <span className="text-xs">{shape.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Highlight Color Picker - Show when highlight tool is selected */}
      {selectedTool === 'highlight' && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Highlight Color</h4>
          <div className="grid grid-cols-3 gap-2">
            {highlightColors.map((color) => {
              const isSelected = highlightColor === color.hex;
              
              return (
                <Button
                  key={color.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onHighlightColorChange?.(color.hex)}
                  className={`h-auto p-2 flex flex-col items-center space-y-1 ${
                    isSelected 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'hover:bg-gray-50'
                  }`}
                  title={color.name}
                >
                  <div 
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-xs">{color.name}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Color Picker - Show when a shape is selected */}
      {selectedShapeElement && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Border Color</h4>
          <div className="grid grid-cols-3 gap-2">
            {colors.map((color) => {
              const isSelected = selectedShapeElement.style?.color === color.hex;
              
              return (
                <Button
                  key={color.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onShapeColorChange?.(color.hex)}
                  className={`h-auto p-2 flex flex-col items-center space-y-1 ${
                    isSelected 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'hover:bg-gray-50'
                  }`}
                  title={color.name}
                >
                  <div 
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-xs">{color.name}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Tool Description */}
      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
        {selectedTool === 'shape' && selectedShape 
          ? shapes.find(shape => shape.id === selectedShape)?.description
          : tools.find(tool => tool.id === selectedTool)?.description
        }
      </div>
    </div>
  );
};
