import React from 'react';
import { Settings, Trash2, Copy } from 'lucide-react';
import type { CanvasElement } from '../../types/template';

interface PropertiesPanelProps {
  selectedElement: CanvasElement | null;
  onElementUpdate: (element: CanvasElement) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onElementUpdate,
  onDelete,
  onDuplicate
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

  const handlePropertyChange = (property: keyof CanvasElement, value: any) => {
    onElementUpdate({ ...selectedElement, [property]: value });
  };

  const handleStyleChange = (styleProperty: string, value: any) => {
    onElementUpdate({
      ...selectedElement,
      styles: { ...selectedElement.styles, [styleProperty]: value }
    });
  };

  // helper to resize tableData preserving content
  const resizeTableData = (data: string[][] | undefined, newRows: number, newCols: number) => {
    const src = data ? data.map(r => r.slice()) : [];
    const out: string[][] = [];
    for (let r = 0; r < newRows; r++) {
      out[r] = [];
      for (let c = 0; c < newCols; c++) {
        out[r][c] = (src[r] && src[r][c]) ?? '';
      }
    }
    return out;
  };

  const renderTableEditor = () => {
    const rows = selectedElement.rows ?? 3;
    const cols = selectedElement.cols ?? 3;
    const tableData = selectedElement.tableData || Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));

    const onCellChange = (r: number, c: number, v: string) => {
      const next = tableData.map(row => row.slice());
      next[r][c] = v;
      onElementUpdate({ ...selectedElement, tableData: next });
    };

    return (
      <div>
        <label className="block text-xs text-gray-500 mb-1">Table Cells</label>
        <div className="border border-gray-200 rounded p-2 max-h-40 overflow-auto">
          <div className="inline-block">
            {tableData.map((row, rIdx) => (
              <div key={rIdx} className="flex">
                {row.map((cell, cIdx) => (
                  <input
                    key={cIdx}
                    value={cell}
                    onChange={(e) => onCellChange(rIdx, cIdx, e.target.value)}
                    className="text-xs border border-gray-200 px-2 py-1 m-0.5 w-24"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
        <div className="flex items-center space-x-2">
          <button onClick={onDuplicate} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Element Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Element Type</label>
          <div className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-600 capitalize">
            {selectedElement.type}
          </div>
        </div>

        {/* Content */}
        {(selectedElement.type === 'text' || selectedElement.type === 'checkbox') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={selectedElement.content || ''}
              onChange={(e) => handlePropertyChange('content', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
        )}

        {/* Image src */}
        {selectedElement.type === 'image' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
            <input
              type="url"
              value={selectedElement.src || ''}
              onChange={(e) => handlePropertyChange('src', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>
        )}

        {/* Input placeholder */}
        {selectedElement.type === 'input' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder</label>
            <input
              type="text"
              value={selectedElement.placeholder || ''}
              onChange={(e) => handlePropertyChange('placeholder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Signature required */}
        {selectedElement.type === 'signature' && (
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={!!selectedElement.required}
                onChange={(e) => handlePropertyChange('required', e.target.checked)}
              />
              <span className="text-sm text-gray-700">Required field</span>
            </label>
          </div>
        )}

        {/* Table config */}
        {selectedElement.type === 'table' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Rows</label>
                <input
                  type="number"
                  value={selectedElement.rows ?? 3}
                  min={1}
                  onChange={(e) => {
                    const newRows = Math.max(1, parseInt(e.target.value) || 1);
                    const newData = resizeTableData(selectedElement.tableData, newRows, selectedElement.cols ?? 3);
                    onElementUpdate({ ...selectedElement, rows: newRows, tableData: newData });
                  }}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cols</label>
                <input
                  type="number"
                  value={selectedElement.cols ?? 3}
                  min={1}
                  onChange={(e) => {
                    const newCols = Math.max(1, parseInt(e.target.value) || 1);
                    const newData = resizeTableData(selectedElement.tableData, selectedElement.rows ?? 3, newCols);
                    onElementUpdate({ ...selectedElement, cols: newCols, tableData: newData });
                  }}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Border Style</label>
                <select
                  value={selectedElement.styles?.borderStyle || 'solid'}
                  onChange={(e) => handleStyleChange('borderStyle', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Border Color</label>
                <input
                  type="color"
                  value={selectedElement.styles?.borderColor || '#9CA3AF'}
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
                  value={selectedElement.styles?.borderWidth ?? 1}
                  onChange={(e) => handleStyleChange('borderWidth', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Table cell editor grid */}
            {renderTableEditor()}
          </div>
        )}

        {/* Position & Size */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Position & Size</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X</label>
              <input
                type="number"
                value={selectedElement.x}
                onChange={(e) => handlePropertyChange('x', parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y</label>
              <input
                type="number"
                value={selectedElement.y}
                onChange={(e) => handlePropertyChange('y', parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Width</label>
              <input
                type="number"
                value={selectedElement.width}
                onChange={(e) => handlePropertyChange('width', parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Height</label>
              <input
                type="number"
                value={selectedElement.height}
                onChange={(e) => handlePropertyChange('height', parseInt(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Styling for non-table text */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Styling</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Background</label>
              <input
                type="color"
                value={selectedElement.styles?.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>

            {/* generic border color/width already provided above for table; keep for all types */}
            {selectedElement.type === 'text' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                  <input
                    type="number"
                    value={selectedElement.styles?.fontSize ?? 14}
                    onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                  <input
                    type="color"
                    value={selectedElement.styles?.color || '#111827'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
