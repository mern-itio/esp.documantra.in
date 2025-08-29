import React, { useState } from 'react';
import { 
  Layers, 
  Type, 
  Image, 
  Square, 
  Circle, 
  FileText, 
  Save, 
  Eye, 
  Undo, 
  Redo, 
  Settings,
  Palette
} from 'lucide-react';
import { DesignCanvas } from '../../components/Template/DesignCanvas';
import { ElementLibrary } from '../../components/Template/ElementLibrary';
import { PropertiesPanel } from '../../components/Template/PropertiesPanel';

export const TemplateDesigner: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState('select');
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [canvasElements, setCanvasElements] = useState<any[]>([]);

  const tools = [
    { id: 'select', name: 'Select', icon: Layers },
    { id: 'text', name: 'Text', icon: Type },
    { id: 'image', name: 'Image', icon: Image },
    { id: 'rectangle', name: 'Rectangle', icon: Square },
    { id: 'circle', name: 'Circle', icon: Circle },
    { id: 'signature', name: 'Signature Field', icon: FileText }
  ];

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - Tools & Elements */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Tools */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Design Tools</h2>
          <div className="grid grid-cols-3 gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedTool === tool.id
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-medium block">{tool.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Element Library */}
        <ElementLibrary onElementSelect={(element) => {
          setCanvasElements([...canvasElements, element]);
        }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Template Designer</h1>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                <Undo className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                <Redo className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-2"></div>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                <Settings className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                <Palette className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">
              Save Draft
            </button>
            <button className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-6 overflow-auto">
          <DesignCanvas 
            elements={canvasElements}
            selectedElement={selectedElement}
            onElementSelect={setSelectedElement}
            onElementsChange={setCanvasElements}
          />
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-white border-l border-gray-200">
        <PropertiesPanel 
          selectedElement={selectedElement}
          onElementUpdate={(updatedElement) => {
            setCanvasElements(elements => 
              elements.map(el => el.id === updatedElement.id ? updatedElement : el)
            );
          }}
        />
      </div>
    </div>
  );
};