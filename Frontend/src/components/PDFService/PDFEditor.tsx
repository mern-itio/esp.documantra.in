import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Type, 
  Image, 
  Square, 
  Highlighter, 
  MessageCircle,
  PenTool,
  Stamp,
  Undo,
  Redo,
  Save,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  MousePointer
} from 'lucide-react';

interface PDFEditorProps {
  onBack: () => void;
}

export const PDFEditor: React.FC<PDFEditorProps> = ({ onBack }) => {
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(5);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const editorTools = [
    { id: 'select', name: 'Select', icon: MousePointer },
    { id: 'text', name: 'Add Text', icon: Type },
    { id: 'image', name: 'Add Image', icon: Image },
    { id: 'shape', name: 'Add Shape', icon: Square },
    { id: 'highlight', name: 'Highlight', icon: Highlighter },
    { id: 'comment', name: 'Comment', icon: MessageCircle },
    { id: 'draw', name: 'Draw', icon: PenTool },
    { id: 'stamp', name: 'Stamp', icon: Stamp }
  ];

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 25));
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900">PDF Editor</h1>
              <p className="text-sm text-gray-600">document.pdf</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Undo className="w-4 h-4" />
              <span className="text-sm">Undo</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Redo className="w-4 h-4" />
              <span className="text-sm">Redo</span>
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Save className="w-4 h-4" />
              <span className="text-sm">Save</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm">Download</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Tools Sidebar */}
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-2">
          {editorTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  selectedTool === tool.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={tool.name}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Editor Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleZoomOut}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-px h-6 bg-gray-300" />

                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange('prev')}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange('next')}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-gray-100 p-8 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div 
                className="bg-white shadow-lg mx-auto relative"
                style={{ 
                  width: `${(8.5 * 96 * zoomLevel) / 100}px`,
                  height: `${(11 * 96 * zoomLevel) / 100}px`
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full border border-gray-300"
                  style={{ cursor: selectedTool === 'select' ? 'default' : 'crosshair' }}
                />
                
                {/* Sample PDF Content Overlay */}
                <div className="absolute inset-0 p-8 pointer-events-none">
                  <div className="text-gray-800" style={{ fontSize: `${(16 * zoomLevel) / 100}px` }}>
                    <h1 className="text-2xl font-bold mb-4">Sample PDF Document</h1>
                    <p className="mb-4">
                      This is a sample PDF document for editing demonstration. 
                      You can add text, images, annotations, and other elements using the tools on the left.
                    </p>
                    <p className="mb-4">
                      The editor supports various editing operations including:
                    </p>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>Text editing and formatting</li>
                      <li>Image insertion and manipulation</li>
                      <li>Shape and drawing tools</li>
                      <li>Highlighting and annotations</li>
                      <li>Comments and collaboration</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties</h3>
          
          {selectedTool === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option>Arial</option>
                  <option>Times New Roman</option>
                  <option>Helvetica</option>
                  <option>Courier New</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                <input 
                  type="number" 
                  defaultValue={12}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <input 
                  type="color" 
                  defaultValue="#000000"
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}

          {selectedTool === 'highlight' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Highlight Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {['#FFFF00', '#00FF00', '#FF00FF', '#00FFFF', '#FFA500', '#FF69B4', '#98FB98', '#DDA0DD'].map(color => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Opacity</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  defaultValue="50"
                  className="w-full"
                />
              </div>
            </div>
          )}

          {selectedTool === 'shape' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shape Type</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option>Rectangle</option>
                  <option>Circle</option>
                  <option>Line</option>
                  <option>Arrow</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fill Color</label>
                <input 
                  type="color" 
                  defaultValue="#0000FF"
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Border Width</label>
                <input 
                  type="number" 
                  defaultValue={2}
                  min="0"
                  max="10"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          )}

          {selectedTool === 'comment' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comment Text</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                  placeholder="Enter your comment..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                <input 
                  type="text" 
                  defaultValue="Current User"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Actions</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div>Added text at (120, 45)</div>
              <div>Highlighted paragraph 2</div>
              <div>Inserted image</div>
              <div>Added comment</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};