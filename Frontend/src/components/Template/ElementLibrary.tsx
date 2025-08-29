import React from 'react';
import { Type, Square, FileText, Image, Table, BarChart3 } from 'lucide-react';

interface ElementLibraryProps {
  onElementSelect: (element: any) => void;
}

export const ElementLibrary: React.FC<ElementLibraryProps> = ({ onElementSelect }) => {
  const elementCategories = [
    {
      name: 'Basic Elements',
      elements: [
        {
          id: 'text',
          name: 'Text Block',
          icon: Type,
          type: 'text',
          defaultProps: { width: 200, height: 40, content: 'Sample Text' }
        },
        {
          id: 'rectangle',
          name: 'Rectangle',
          icon: Square,
          type: 'rectangle',
          defaultProps: { width: 150, height: 100 }
        },
        {
          id: 'image',
          name: 'Image',
          icon: Image,
          type: 'image',
          defaultProps: { width: 200, height: 150 }
        }
      ]
    },
    {
      name: 'Form Fields',
      elements: [
        {
          id: 'signature',
          name: 'Signature Field',
          icon: FileText,
          type: 'signature',
          defaultProps: { width: 250, height: 80 }
        },
        {
          id: 'input',
          name: 'Text Input',
          icon: Type,
          type: 'input',
          defaultProps: { width: 200, height: 40 }
        },
        {
          id: 'checkbox',
          name: 'Checkbox',
          icon: Square,
          type: 'checkbox',
          defaultProps: { width: 20, height: 20 }
        }
      ]
    },
    {
      name: 'Advanced',
      elements: [
        {
          id: 'table',
          name: 'Table',
          icon: Table,
          type: 'table',
          defaultProps: { width: 400, height: 200 }
        },
        {
          id: 'chart',
          name: 'Chart',
          icon: BarChart3,
          type: 'chart',
          defaultProps: { width: 300, height: 200 }
        }
      ]
    }
  ];

  const handleElementDrag = (element: any) => {
    const newElement = {
      id: `${element.type}_${Date.now()}`,
      type: element.type,
      x: 100,
      y: 100,
      ...element.defaultProps
    };
    onElementSelect(newElement);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {elementCategories.map((category, categoryIndex) => (
        <div key={categoryIndex} className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{category.name}</h3>
          <div className="space-y-2">
            {category.elements.map((element) => {
              const Icon = element.icon;
              return (
                <button
                  key={element.id}
                  onClick={() => handleElementDrag(element)}
                  className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{element.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};