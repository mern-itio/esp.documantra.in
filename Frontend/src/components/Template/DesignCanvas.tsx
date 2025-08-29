import React, { useRef } from 'react';
import { Plus } from 'lucide-react';

interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  styles?: any;
}

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
  // onElementsChange
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  // const [isDragging, setIsDragging] = useState(false);
  // const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleElementClick = (element: CanvasElement, e: React.MouseEvent) => {
    e.stopPropagation();
    onElementSelect(element);
  };

  const handleCanvasClick = () => {
    onElementSelect(null);
  };

  const handleMouseDown = (element: CanvasElement, e: React.MouseEvent) => {
    console.log(e);
    if (selectedElement?.id === element.id) {
      // setIsDragging(true);
      // const rect = (e.target as HTMLElement).getBoundingClientRect();
      // setDragOffset({
      //   x: e.clientX - rect.left,
      //   y: e.clientY - rect.top
      // });
    }
  };

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedElement?.id === element.id;
    
    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            className={`absolute border-2 cursor-move ${
              isSelected ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
            }`}
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height
            }}
            onClick={(e) => handleElementClick(element, e)}
            onMouseDown={(e) => handleMouseDown(element, e)}
          >
            <div className="p-2 text-gray-800 select-none">
              {element.content || 'Text Element'}
            </div>
          </div>
        );
      
      case 'rectangle':
        return (
          <div
            key={element.id}
            className={`absolute border-2 cursor-move ${
              isSelected ? 'border-blue-500' : 'border-gray-400'
            }`}
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              backgroundColor: element.styles?.backgroundColor || 'transparent'
            }}
            onClick={(e) => handleElementClick(element, e)}
            onMouseDown={(e) => handleMouseDown(element, e)}
          />
        );
      
      case 'signature':
        return (
          <div
            key={element.id}
            className={`absolute border-2 border-dashed cursor-move bg-gray-50 ${
              isSelected ? 'border-blue-500' : 'border-gray-400'
            }`}
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height
            }}
            onClick={(e) => handleElementClick(element, e)}
            onMouseDown={(e) => handleMouseDown(element, e)}
          >
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              Signature Field
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex justify-center">
      <div 
        ref={canvasRef}
        className="bg-white border border-gray-300 shadow-lg relative"
        style={{ width: '8.5in', height: '11in', transform: 'scale(0.8)' }}
        onClick={handleCanvasClick}
      >
        {/* Canvas Grid */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* Canvas Elements */}
        {elements.map(renderElement)}
        
        {/* Empty State */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Plus className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Start designing your template</p>
              <p className="text-sm">Drag elements from the sidebar to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};