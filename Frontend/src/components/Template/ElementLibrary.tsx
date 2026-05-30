import React from 'react';
import { Type, Square, FileText, Image, Table, BarChart3, Circle } from 'lucide-react';
import { nanoid } from 'nanoid';
import type { CanvasElement } from '../../types/template';

interface ElementLibraryProps {
  onElementSelect: (element: CanvasElement) => void;
}

export const ElementLibrary: React.FC<ElementLibraryProps> = ({ onElementSelect }) => {
  const elementCategories = [
    {
      name: 'Basic Elements',
      elements: [
        { id: 'text', name: 'Text Block', icon: Type, type: 'text', defaultProps: { width: 200, height: 40, content: 'Sample Text', styles: { fontSize: 14, color: '#111827' } } },
        { id: 'rectangle', name: 'Rectangle', icon: Square, type: 'rectangle', defaultProps: { width: 150, height: 100, styles: { backgroundColor: '#FFFFFF', borderColor: '#9CA3AF', borderWidth: 1 } } },
        { id: 'circle', name: 'Circle', icon: Circle, type: 'circle', defaultProps: { width: 120, height: 120, styles: { backgroundColor: '#FFFFFF', borderColor: '#9CA3AF', borderWidth: 1 } } },
        { id: 'image', name: 'Image', icon: Image, type: 'image', defaultProps: { width: 200, height: 150, src: '' } }
      ]
    },
    {
      name: 'Form Fields',
      elements: [
        { id: 'signature', name: 'Signature Field', icon: FileText, type: 'signature', defaultProps: { width: 250, height: 80, required: true } },
        { id: 'input', name: 'Text Input', icon: Type, type: 'input', defaultProps: { width: 200, height: 40, placeholder: 'Enter text', required: false } },
        { id: 'checkbox', name: 'Checkbox', icon: Square, type: 'checkbox', defaultProps: { width: 160, height: 28, content: 'I agree', checked: false } }
      ]
    },
    {
      name: 'Advanced',
      elements: [
        // table defaultProps includes rows/cols and (optionally) tableData
        { id: 'table', name: 'Table', icon: Table, type: 'table', defaultProps: { width: 400, height: 200, rows: 6, cols: 3 } },
        { id: 'chart', name: 'Chart', icon: BarChart3, type: 'chart', defaultProps: { width: 300, height: 200, chartKind: 'bar', chartData: { labels: ['Jan','Feb'], datasets: [{ label: 'Data', data: [1,2], backgroundColor: 'rgba(59,130,246,0.5)' }] } } }

      ]
    }
  ];

  const handleAdd = (def: any) => {
    const isTable = def.type === 'table';
    const rows = isTable ? (def.defaultProps.rows ?? 3) : undefined;
    const cols = isTable ? (def.defaultProps.cols ?? 3) : undefined;

    // initialize tableData if table
    const tableData = isTable
      ? (def.defaultProps.tableData ||
          Array.from({ length: rows }, () => Array.from({ length: cols }, () => '')))
      : undefined;

    const newElement: CanvasElement = {
      id: `${def.type}_${nanoid(8)}`,
      type: def?.type,
      x: 100,
      y: 100,
      width: def?.defaultProps?.width,
      height: def?.defaultProps?.height,
      content: def?.defaultProps?.content,
      src: def?.defaultProps?.src,
      placeholder: def?.defaultProps?.placeholder,
      checked: def?.defaultProps?.checked,
      rows,
      cols,
      tableData,
      chartKind: def?.defaultProps?.chartKind,
      chartData: def?.defaultProps?.chartData,
      required: def?.defaultProps?.required,
      styles: {
        ...(def?.defaultProps?.styles || {}),
        // sensible table defaults
        ...(def?.type === 'table' ? { borderStyle: def?.defaultProps.styles?.borderStyle || 'solid', borderColor: def?.defaultProps.styles?.borderColor || '#9CA3AF', borderWidth: def?.defaultProps.styles?.borderWidth ?? 1 } : {})
      }
    };
    onElementSelect(newElement);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {elementCategories.map((category, categoryIndex) => (
        <div key={categoryIndex} className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{category.name}</h3>
          <div className="space-y-2">
            {category.elements.map((element: any) => {
              const Icon = element.icon;
              return (
                <button
                  key={element.id}
                  onClick={() => handleAdd(element)}
                  className="w-full flex items-center p-3 text-left hover:bg-[#F5F2EE] rounded-lg border border-gray-200 transition-colors"
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
