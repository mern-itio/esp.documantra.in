import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Rnd } from 'react-rnd';
import type { CanvasElement } from '../../types/template';

interface DesignCanvasProps {
  elements: CanvasElement[];
  selectedElement: CanvasElement | null;
  onElementSelect: (element: CanvasElement | null) => void;
  onElementsChange: (elements: CanvasElement[]) => void;
}

export const DesignCanvas: React.FC<DesignCanvasProps> = ({
  elements,
  selectedElement,
  onElementSelect,
  onElementsChange
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // editing state for inline cell editor
  const [editingCell, setEditingCell] = useState<{
    elementId: string;
    row: number;
    col: number;
    value: string;
  } | null>(null);

  const updateElement = (id: string, patch: Partial<CanvasElement>) => {
    const next = elements.map(el => (el.id === id ? { ...el, ...patch } : el));
    onElementsChange(next);
  };

  const handleElementClick = (element: CanvasElement, e: React.MouseEvent) => {
    e.stopPropagation();
    onElementSelect(element);
  };

  const handleCanvasClick = (e?: React.MouseEvent) => {
    // only deselect if clicked directly on canvas background
    if (e && e.target !== canvasRef.current) return;
    onElementSelect(null);
  };

  // commit inline edit to element.tableData
  const commitCellEdit = () => {
    if (!editingCell) return;
    const { elementId, row, col, value } = editingCell;
    const el = elements.find(x => x.id === elementId);
    if (!el) {
      setEditingCell(null);
      return;
    }
    const rows = el.rows ?? 3;
    const cols = el.cols ?? 3;
    const data = el.tableData ? el.tableData.map(r => r.slice()) : Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
    // ensure dimensions
    while (data.length < (el.rows ?? rows)) data.push(Array.from({ length: el.cols ?? cols }, () => ''));
    for (let r = 0; r < data.length; r++) {
      if (!data[r]) data[r] = Array.from({ length: el.cols ?? cols }, () => '');
      while (data[r].length < (el.cols ?? cols)) data[r].push('');
    }
    data[row][col] = value;
    updateElement(elementId, { tableData: data });
    setEditingCell(null);
  };

  // open editor for a particular cell
  const startCellEdit = (elementId: string, row: number, col: number, initialValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCell({ elementId, row, col, value: initialValue ?? '' });
    // select element if not already
    const el = elements.find(x => x.id === elementId);
    if (el) onElementSelect(el);
  };

  const renderInnerByType = (el: CanvasElement) => {
    switch (el.type) {
      case 'text':
        return (
          <div className="p-2 select-none" style={{ color: el.styles?.color, fontSize: el.styles?.fontSize }}>
            {el.content || 'Text'}
          </div>
        );

      case 'rectangle':
        return <div className="w-full h-full" />;

      case 'circle':
        return <div className="w-full h-full rounded-full" />;

      case 'signature':
        return (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Signature Field
          </div>
        );

      case 'image':
        return el.src ? (
          <img src={el.src} alt="img" className="w-full h-full object-contain" draggable={false} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">Image (set src)</div>
        );

      case 'input':
        return (
          <input
            className="w-full h-full bg-transparent outline-none px-2 text-sm"
            placeholder={el.placeholder || 'Text input'}
            readOnly
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center h-full px-2 cursor-default select-none">
            <input type="checkbox" checked={!!el.checked} readOnly className="mr-2" />
            {el.content || 'Checkbox'}
          </label>
        );

      case 'table': {
        const rows = el.rows ?? 3;
        const cols = el.cols ?? 3;
        const tableData = el.tableData || Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));

        // table-level styles
        const tableBorderStyle = el.styles?.borderStyle || 'solid';
        const tableBorderColor = el.styles?.borderColor || '#9CA3AF';
        const tableBorderWidth = el.styles?.borderWidth ?? 1;

        return (
          <div className="w-full h-full overflow-auto">
            <table
              className="w-full h-full"
              style={{
                borderCollapse: 'collapse',
                width: '100%',
                height: '100%'
              }}
            >
              <tbody>
                {Array.from({ length: rows }).map((_, rowIdx) => (
                  <tr key={rowIdx} style={{ height: `${100 / rows}%` }}>
                    {Array.from({ length: cols }).map((_, colIdx) => {
                      const cellValue = (tableData[rowIdx] && tableData[rowIdx][colIdx]) ?? '';
                      const isEditing =
                        editingCell &&
                        editingCell.elementId === el.id &&
                        editingCell.row === rowIdx &&
                        editingCell.col === colIdx;

                      return (
                        <td
                          key={colIdx}
                          onClick={(e) => startCellEdit(el.id, rowIdx, colIdx, cellValue, e)}
                          className="text-left text-xs"
                          style={{
                            width: `${100 / cols}%`,
                            verticalAlign: 'top',
                            padding: '6px',
                            boxSizing: 'border-box',
                            borderStyle: tableBorderStyle,
                            borderColor: tableBorderColor,
                            borderWidth: `${tableBorderWidth}px`
                          }}
                        >
                          {/* inline editor */}
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editingCell?.value ?? ''}
                              onChange={(e) => setEditingCell(prev => prev ? { ...prev, value: e.target.value } : prev)}
                              onBlur={() => commitCellEdit()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                                } else if (e.key === 'Escape') {
                                  setEditingCell(null);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full h-full p-1 text-xs outline-none border border-blue-200 rounded"
                              style={{ boxSizing: 'border-box' }}
                            />
                          ) : (
                            <div className="truncate" style={{ minHeight: 20 }}>
                              {cellValue}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'chart':
        return (
          <div className="w-full h-full text-xs text-gray-600 flex items-center justify-center select-none">
            Chart: {el.chartKind || 'bar'}
          </div>
        );

      default:
        return null;
    }
  };

  const renderElement = (el: CanvasElement) => {
    const isSelected = selectedElement?.id === el.id;

    const borderStyle = isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-300';

    const baseStyle: React.CSSProperties = {
      backgroundColor: el.styles?.backgroundColor || (el.type === 'signature' ? '#F9FAFB' : 'transparent'),
      borderStyle: el.type === 'signature' ? 'dashed' : 'solid',
      borderColor: el.styles?.borderColor || (el.type === 'signature' ? '#9CA3AF' : '#9CA3AF'),
      borderWidth: el.styles?.borderWidth ?? (el.type === 'signature' ? 2 : 1),
      color: el.styles?.color,
      fontSize: el.styles?.fontSize,
      borderRadius: el.type === 'circle' ? 9999 : undefined,
      boxSizing: 'border-box'
    };

    return (
      <Rnd
        key={el.id}
        size={{ width: el.width, height: el.height }}
        position={{ x: el.x, y: el.y }}
        bounds="parent"
        onDragStop={(_, d) => updateElement(el.id, { x: d.x, y: d.y })}
        onResizeStop={(_, __, ref, delta, pos) =>
          updateElement(el.id, {
            width: Math.round(ref.offsetWidth),
            height: Math.round(ref.offsetHeight),
            x: pos.x,
            y: pos.y
          })
        }
        onClick={(e: any) => {
          e.stopPropagation();
          handleElementClick(el, e);
        }}
        enableUserSelectHack={false}
        className={`absolute cursor-move bg-clip-padding ${borderStyle}`}
      >
        <div className="w-full h-full" style={baseStyle}>
          {renderInnerByType(el)}
        </div>
      </Rnd>
    );
  };

  return (
    <div className="flex justify-center">
      <div
        ref={canvasRef}
        className="bg-white border border-gray-300 shadow-lg relative"
        style={{ width: '8.5in', height: '11in', transform: 'scale(0.8)', transformOrigin: 'top center' }}
        onClick={() => handleCanvasClick()}
      >
        {/* Canvas Grid */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Elements */}
        {elements.map(renderElement)}

        {/* Empty State */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Plus className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Start designing your template</p>
              <p className="text-sm">Click elements from the sidebar to add</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
