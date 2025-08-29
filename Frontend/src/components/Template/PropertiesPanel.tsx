import React from 'react';
import { Settings, Trash2, Copy } from 'lucide-react';

interface PropertiesPanelProps {
  selectedElement: any;
  onElementUpdate: (element: any) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onElementUpdate
}) => {
  if (!selectedElement) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400 mt-8">
          <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No Element Selected</p>
          <p className="text-sm">Select an element to edit its properties</p>
        </div>
      </div>
    );
  }

  const handlePropertyChange = (property: string, value: any) => {
    const updatedElement = {
      ...selectedElement,
      [property]: value
    };
    onElementUpdate(updatedElement);
  };

  const handleStyleChange = (styleProperty: string, value: any) => {
    const updatedElement = {
      ...selectedElement,
      styles: {
        ...selectedElement.styles,
        [styleProperty]: value
      }
    };
    onElementUpdate(updatedElement);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
            <Copy className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Element Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Element Type
          </label>
          <div className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-600 capitalize">
            {selectedElement.type}
          </div>
        </div>

        {/* Content (for text elements) */}
        {selectedElement.type === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={selectedElement.content || ''}
              onChange={(e) => handlePropertyChange('content', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
        )}

        {/* Position & Size */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Position & Size</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X Position</label>
              <input
                type="number"
                value={selectedElement.x}
                onChange={(e) => handlePropertyChange('x', parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y Position</label>
              <input
                type="number"
                value={selectedElement.y}
                onChange={(e) => handlePropertyChange('y', parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Width</label>
              <input
                type="number"
                value={selectedElement.width}
                onChange={(e) => handlePropertyChange('width', parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Height</label>
              <input
                type="number"
                value={selectedElement.height}
                onChange={(e) => handlePropertyChange('height', parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Styling */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Styling</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Background Color</label>
              <input
                type="color"
                value={selectedElement.styles?.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Border Color</label>
              <input
                type="color"
                value={selectedElement.styles?.borderColor || '#000000'}
                onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Border Width</label>
              <input
                type="range"
                min="0"
                max="10"
                value={selectedElement.styles?.borderWidth || 1}
                onChange={(e) => handleStyleChange('borderWidth', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Element-specific properties */}
        {selectedElement.type === 'signature' && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Signature Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-gray-700">Required field</span>
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Placeholder Text</label>
                <input
                  type="text"
                  placeholder="Sign here..."
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};