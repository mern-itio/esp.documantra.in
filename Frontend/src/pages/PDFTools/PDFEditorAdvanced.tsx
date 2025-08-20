import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Note: PDF.js worker is served locally from /public/pdf.worker.min.mjs to avoid CORS issues
// This file was copied from node_modules/pdfjs-dist/build/pdf.worker.min.mjs
import { 
  Upload, 
  Download, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Type, 
  Plus, 
  Image as ImageIcon, 
  MousePointer, 
  Highlighter,
  X,
  RotateCcw,
  RotateCw,
  Bold,
  Italic,
  Underline,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from 'lucide-react';

// Set up PDF.js worker using local file to avoid CORS issues
// The CORS error occurs when trying to load PDF.js worker from external CDNs
// Solution: Copy the worker file to the public folder and serve it locally
const setupPDFWorker = () => {
  try {
    // Use the local worker file from public folder to avoid CORS issues
    pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
  } catch (error) {
    console.warn('Local PDF.js worker setup failed, using CDN fallback:', error);
    // Fallback to unpkg CDN
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    } catch (fallbackError) {
      console.warn('CDN fallback also failed:', fallbackError);
      // Last resort - use jsDelivr CDN
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
  }
};

// Initialize the worker
setupPDFWorker();

interface TextElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  textAlign: 'left' | 'center' | 'right' | 'justify';
}

interface ImageElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  src: string;
  alt: string;
}

interface EditHistory {
  elements: (TextElement | ImageElement)[];
  timestamp: number;
}

type Tool = 'select' | 'editText' | 'addText' | 'addImage' | 'highlight';

const PDFEditorAdvanced: React.FC = () => {
  // State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [elements, setElements] = useState<(TextElement | ImageElement)[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  // const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [showProperties, setShowProperties] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Initialize history
  useEffect(() => {
    if (elements.length === 0 && editHistory.length === 0) {
      const initialHistory: EditHistory = {
        elements: [],
        timestamp: Date.now()
      };
      setEditHistory([initialHistory]);
      setHistoryIndex(0);
    }
  }, [elements, editHistory]);

  // Save to history
  const saveToHistory = useCallback((newElements: (TextElement | ImageElement)[]) => {
    const newHistory: EditHistory = {
      elements: JSON.parse(JSON.stringify(newElements)),
      timestamp: Date.now()
    };
    
    // Remove any history after current index
    const updatedHistory = editHistory.slice(0, historyIndex + 1);
    updatedHistory.push(newHistory);
    
    setEditHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  }, [editHistory, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(editHistory[newIndex].elements);
    }
  }, [historyIndex, editHistory]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(editHistory[newIndex].elements);
    }
  }, [historyIndex, editHistory]);

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setElements([]);
      setSelectedElement(null);
      setCurrentPage(1);
      setScale(1);
      
      // Reset history
      const newHistory: EditHistory = {
        elements: [],
        timestamp: Date.now()
      };
      setEditHistory([newHistory]);
      setHistoryIndex(0);
    }
  };

  // PDF load success handler
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Zoom controls
  const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.3));
  const fitToScreen = () => setScale(1);
  const actualSize = () => setScale(1);

  // Tool selection
  const selectTool = (tool: Tool) => {
    setActiveTool(tool);
    setSelectedElement(null);
    // setIsEditingText(false);
    setEditingTextId(null);
  };

  // Add text element
  const addTextElement = (x: number, y: number) => {
    const newText: TextElement = {
      id: `text_${Date.now()}`,
      x: (x - (canvasRef.current?.offsetLeft || 0)) / scale,
      y: (y - (canvasRef.current?.offsetTop || 0)) / scale,
      width: 200,
      height: 50,
      text: 'New Text',
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000',
      isBold: false,
      isItalic: false,
      isUnderline: false,
      textAlign: 'left'
    };
    
    const newElements = [...elements, newText];
    setElements(newElements);
    setSelectedElement(newText.id);
    // setIsEditingText(true);
    setEditingTextId(newText.id);
    saveToHistory(newElements);
  };

  // Add image element
  const addImageElement = (file: File, x: number, y: number) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newImage: ImageElement = {
        id: `image_${Date.now()}`,
        x: (x - (canvasRef.current?.offsetLeft || 0)) / scale,
        y: (y - (canvasRef.current?.offsetTop || 0)) / scale,
        width: 200,
        height: 150,
        rotation: 0,
        src: e.target?.result as string,
        alt: file.name
      };
      
      const newElements = [...elements, newImage];
      setElements(newElements);
      setSelectedElement(newImage.id);
      saveToHistory(newElements);
    };
    reader.readAsDataURL(file);
  };

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent) => {
    if (activeTool === 'addText') {
      addTextElement(event.clientX, event.clientY);
    } else if (activeTool === 'addImage') {
      imageInputRef.current?.click();
    } else {
      setSelectedElement(null);
      // setIsEditingText(false);
      setEditingTextId(null);
    }
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Use center of canvas for image placement since we can't get click position from file input
      const x = (canvasRef.current?.offsetWidth || 0) / 2;
      const y = (canvasRef.current?.offsetHeight || 0) / 2;
      addImageElement(file, x, y);
    }
  };

  // Handle element selection
  const handleElementClick = (elementId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedElement(elementId);
    
    if (activeTool === 'editText') {
      const element = elements.find(el => el.id === elementId);
      if (element && 'text' in element) {
        // setIsEditingText(true);
        setEditingTextId(elementId);
      }
    }
  };

  // Handle text editing
  const handleTextEdit = (elementId: string, newText: string) => {
    const newElements = elements.map(el => 
      el.id === elementId && 'text' in el 
        ? { ...el, text: newText }
        : el
    );
    setElements(newElements);
    saveToHistory(newElements);
  };

  // Handle text property changes
  const handleTextPropertyChange = (property: keyof TextElement, value: any) => {
    if (!selectedElement) return;
    
    const newElements = elements.map(el => 
      el.id === selectedElement && 'text' in el
        ? { ...el, [property]: value }
        : el
    );
    setElements(newElements);
    saveToHistory(newElements);
  };

  // Handle image property changes
  const handleImagePropertyChange = (property: keyof ImageElement, value: any) => {
    if (!selectedElement) return;
    
    const newElements = elements.map(el => 
      el.id === selectedElement && 'src' in el
        ? { ...el, [property]: value }
        : el
    );
    setElements(newElements);
    saveToHistory(newElements);
  };

  // Handle drag start
  const handleDragStart = (elementId: string, event: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
    setSelectedElement(elementId);
  };

  // Handle drag
  const handleDrag = useCallback((event: MouseEvent) => {
    if (!isDragging || !dragStart || !selectedElement) return;
    
    const deltaX = (event.clientX - dragStart.x) / scale;
    const deltaY = (event.clientY - dragStart.y) / scale;
    
    const newElements = elements.map(el => 
      el.id === selectedElement
        ? { ...el, x: el.x + deltaX, y: el.y + deltaY }
        : el
    );
    
    setElements(newElements);
    setDragStart({ x: event.clientX, y: event.clientY });
  }, [isDragging, dragStart, selectedElement, scale, elements]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      saveToHistory(elements);
    }
  }, [isDragging, elements, saveToHistory]);

  // Handle resize start
  const handleResizeStart = (elementId: string, handle: string, event: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    
    setIsResizing(true);
    setResizeHandle(handle);
    setSelectedElement(elementId);
    event.stopPropagation();
  };

  // Handle resize
  const handleResize = useCallback((event: MouseEvent) => {
    if (!isResizing || !resizeHandle || !selectedElement) return;
    
    const element = elements.find(el => el.id === selectedElement);
    if (!element) return;
    
    const deltaX = event.movementX / scale;
    const deltaY = event.movementY / scale;
    
    let newElement = { ...element };
    
    if (resizeHandle.includes('right')) {
      newElement.width = Math.max(50, element.width + deltaX);
    }
    if (resizeHandle.includes('bottom')) {
      newElement.height = Math.max(50, element.height + deltaY);
    }
    
    const newElements = elements.map(el => 
      el.id === selectedElement ? newElement : el
    );
    
    setElements(newElements);
  }, [isResizing, resizeHandle, selectedElement, scale, elements]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      saveToHistory(elements);
    }
  }, [isResizing, elements, saveToHistory]);

  // Event listeners for drag and resize
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', isDragging ? handleDrag : handleResize);
      document.addEventListener('mouseup', isDragging ? handleDragEnd : handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', isDragging ? handleDrag : handleResize);
        document.removeEventListener('mouseup', isDragging ? handleDragEnd : handleResizeEnd);
      };
    }
  }, [isDragging, isResizing, handleDrag, handleResize, handleDragEnd, handleResizeEnd]);

  // Delete element
  const deleteElement = () => {
    if (!selectedElement) return;
    
    const newElements = elements.filter(el => el.id !== selectedElement);
    setElements(newElements);
    setSelectedElement(null);
    // setIsEditingText(false);
    setEditingTextId(null);
    saveToHistory(newElements);
  };

  // Download PDF (placeholder - would need backend integration)
  const handleDownload = () => {
    // This would integrate with your backend to generate the modified PDF
    alert('Download functionality would integrate with your backend PDF generation service');
  };

  // Get selected element
  const selectedElementData = elements.find(el => el.id === selectedElement);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Toolbar */}
      <div className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Upload size={18} />
              <span>Upload PDF</span>
            </button>
            
            {pdfFile && (
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {pdfFile.name}
              </span>
            )}
          </div>

          {/* Center - Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.3}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300 disabled:text-gray-600' 
                  : 'hover:bg-gray-100 text-gray-600 disabled:text-gray-400'
              }`}
            >
              <ZoomOut size={18} />
            </button>
            
            <span className={`text-sm font-medium min-w-[60px] text-center ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={zoomIn}
              disabled={scale >= 3}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300 disabled:text-gray-600' 
                  : 'hover:bg-gray-100 text-gray-600 disabled:text-gray-400'
              }`}
            >
              <ZoomIn size={18} />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <button
              onClick={fitToScreen}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Maximize2 size={18} />
            </button>
            
            <button
              onClick={actualSize}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Type size={18} />
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300 disabled:text-gray-600' 
                  : 'hover:bg-gray-100 text-gray-600 disabled:text-gray-400'
              }`}
            >
              <Undo2 size={18} />
            </button>
            
            <button
              onClick={redo}
              disabled={historyIndex >= editHistory.length - 1}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300 disabled:text-gray-600' 
                  : 'hover:bg-gray-100 text-gray-600 disabled:text-gray-400'
              }`}
            >
              <Redo2 size={18} />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <button
              onClick={handleDownload}
              disabled={!pdfFile}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600 disabled:text-gray-400' 
                  : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400 disabled:text-gray-200'
              }`}
            >
              <Download size={18} />
              <span>Download</span>
            </button>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Tools */}
        <div className={`w-16 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col items-center py-4 space-y-4`}>
          <button
            onClick={() => selectTool('select')}
            className={`p-3 rounded-lg transition-colors ${
              activeTool === 'select'
                ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600')
                : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
            }`}
            title="Select Tool"
          >
            <MousePointer size={20} />
          </button>
          
          <button
            onClick={() => selectTool('editText')}
            className={`p-3 rounded-lg transition-colors ${
              activeTool === 'editText'
                ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600')
                : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
            }`}
            title="Edit Text"
          >
            <Type size={20} />
          </button>
          
          <button
            onClick={() => selectTool('addText')}
            className={`p-3 rounded-lg transition-colors ${
              activeTool === 'addText'
                ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600')
                : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
            }`}
            title="Add Text"
          >
            <Plus size={20} />
          </button>
          
          <button
            onClick={() => selectTool('addImage')}
            className={`p-3 rounded-lg transition-colors ${
              activeTool === 'addImage'
                ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600')
                : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
            }`}
            title="Add Image"
          >
            <ImageIcon size={20} />
          </button>
          
          <button
            onClick={() => selectTool('highlight')}
            className={`p-3 rounded-lg transition-colors ${
              activeTool === 'highlight'
                ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600')
                : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
            }`}
            title="Highlight"
          >
            <Highlighter size={20} />
          </button>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {!pdfFile ? (
              <div className={`flex flex-col items-center justify-center h-96 rounded-lg border-2 border-dashed ${
                darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
              }`}>
                <Upload size={48} className="mb-4" />
                <p className="text-lg font-medium mb-2">Upload a PDF to get started</p>
                <p className="text-sm">Click the Upload button above to begin editing</p>
              </div>
            ) : (
              <div className="flex justify-center">
                <div 
                  ref={canvasRef}
                  className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-lg overflow-hidden`}
                  onClick={handleCanvasClick}
                >
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex flex-col items-center"
                  >
                    <Page
                      pageNumber={currentPage}
                      scale={scale}
                      className="shadow-lg"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                  
                  {/* Render Elements */}
                  {elements.map((element) => {
                    const isSelected = selectedElement === element.id;
                    const isEditing = editingTextId === element.id;
                    
                    if ('text' in element) {
                      // Text Element
                      return (
                        <div
                          key={element.id}
                          className={`absolute cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                          style={{
                            left: element.x * scale,
                            top: element.y * scale,
                            width: element.width * scale,
                            height: element.height * scale,
                          }}
                          onClick={(e) => handleElementClick(element.id, e)}
                          onMouseDown={(e) => handleDragStart(element.id, e)}
                        >
                          {isEditing ? (
                            <textarea
                              value={element.text}
                              onChange={(e) => handleTextEdit(element.id, e.target.value)}
                              onBlur={() => {
                                // setIsEditingText(false);
                                setEditingTextId(null);
                              }}
                              className="w-full h-full p-2 border-none outline-none resize-none bg-transparent"
                              style={{
                                fontSize: element.fontSize * scale,
                                fontFamily: element.fontFamily,
                                color: element.color,
                                fontWeight: element.isBold ? 'bold' : 'normal',
                                fontStyle: element.isItalic ? 'italic' : 'normal',
                                textDecoration: element.isUnderline ? 'underline' : 'none',
                                textAlign: element.textAlign,
                              }}
                              autoFocus
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center p-2"
                              style={{
                                fontSize: element.fontSize * scale,
                                fontFamily: element.fontFamily,
                                color: element.color,
                                fontWeight: element.isBold ? 'bold' : 'normal',
                                fontStyle: element.isItalic ? 'italic' : 'normal',
                                textDecoration: element.isUnderline ? 'underline' : 'none',
                                textAlign: element.textAlign,
                              }}
                            >
                              {element.text}
                            </div>
                          )}
                          
                          {/* Resize Handles */}
                          {isSelected && (
                            <>
                              <div
                                className="absolute right-0 top-0 w-3 h-3 bg-blue-500 cursor-e-resize"
                                onMouseDown={(e) => handleResizeStart(element.id, 'right', e)}
                              />
                              <div
                                className="absolute right-0 bottom-0 w-3 h-3 bg-blue-500 cursor-se-resize"
                                onMouseDown={(e) => handleResizeStart(element.id, 'right-bottom', e)}
                              />
                              <div
                                className="absolute left-0 bottom-0 w-3 h-3 bg-blue-500 cursor-s-resize"
                                onMouseDown={(e) => handleResizeStart(element.id, 'bottom', e)}
                              />
                            </>
                          )}
                        </div>
                      );
                    } else {
                      // Image Element
                      return (
                        <div
                          key={element.id}
                          className={`absolute cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                          style={{
                            left: element.x * scale,
                            top: element.y * scale,
                            width: element.width * scale,
                            height: element.height * scale,
                            transform: `rotate(${element.rotation}deg)`,
                          }}
                          onClick={(e) => handleElementClick(element.id, e)}
                          onMouseDown={(e) => handleDragStart(element.id, e)}
                        >
                          <img
                            src={element.src}
                            alt={element.alt}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Resize Handles */}
                          {isSelected && (
                            <>
                              <div
                                className="absolute right-0 top-0 w-3 h-3 bg-blue-500 cursor-e-resize"
                                onMouseDown={(e) => handleResizeStart(element.id, 'right', e)}
                              />
                              <div
                                className="absolute right-0 bottom-0 w-3 h-3 bg-blue-500 cursor-se-resize"
                                onMouseDown={(e) => handleResizeStart(element.id, 'right-bottom', e)}
                              />
                              <div
                                className="absolute left-0 bottom-0 w-3 h-3 bg-blue-500 cursor-s-resize"
                                onMouseDown={(e) => handleResizeStart(element.id, 'bottom', e)}
                              />
                            </>
                          )}
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        {showProperties && selectedElementData && (
          <div className={`w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l p-4 overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Properties
              </h3>
              <button
                onClick={() => setShowProperties(false)}
                className={`p-1 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X size={18} />
              </button>
            </div>
            
            {selectedElementData && 'text' in selectedElementData ? (
              // Text Properties
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Text
                  </label>
                  <textarea
                    value={selectedElementData.text}
                    onChange={(e) => handleTextPropertyChange('text', e.target.value)}
                    className={`w-full p-2 border rounded-lg resize-none ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Font Family
                  </label>
                  <select
                    value={selectedElementData.fontFamily}
                    onChange={(e) => handleTextPropertyChange('fontFamily', e.target.value)}
                    className={`w-full p-2 border rounded-lg ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={selectedElementData.fontSize}
                    onChange={(e) => handleTextPropertyChange('fontSize', parseInt(e.target.value))}
                    min="8"
                    max="72"
                    className={`w-full p-2 border rounded-lg ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={selectedElementData.color}
                      onChange={(e) => handleTextPropertyChange('color', e.target.value)}
                      className="w-10 h-10 border rounded-lg cursor-pointer"
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {selectedElementData.color}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Style
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleTextPropertyChange('isBold', !selectedElementData.isBold)}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedElementData.isBold
                          ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600')
                          : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
                      }`}
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      onClick={() => handleTextPropertyChange('isItalic', !selectedElementData.isItalic)}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedElementData.isItalic
                          ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600')
                          : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
                      }`}
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      onClick={() => handleTextPropertyChange('isUnderline', !selectedElementData.isUnderline)}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedElementData.isUnderline
                          ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600')
                          : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
                      }`}
                    >
                      <Underline size={16} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Alignment
                  </label>
                  <div className="flex space-x-2">
                    {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => handleTextPropertyChange('textAlign', align)}
                        className={`p-2 rounded-lg transition-colors ${
                          selectedElementData.textAlign === align
                            ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600')
                            : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
                        }`}
                      >
                        {align === 'left' && <AlignLeft size={16} />}
                        {align === 'center' && <AlignCenter size={16} />}
                        {align === 'right' && <AlignRight size={16} />}
                        {align === 'justify' && <AlignJustify size={16} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedElementData && 'src' in selectedElementData ? (
              // Image Properties
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Image
                  </label>
                  <img
                    src={selectedElementData.src}
                    alt={selectedElementData.alt}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Width
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedElementData.width)}
                    onChange={(e) => handleImagePropertyChange('width', parseInt(e.target.value))}
                    min="50"
                    className={`w-full p-2 border rounded-lg ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Height
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedElementData.height)}
                    onChange={(e) => handleImagePropertyChange('height', parseInt(e.target.value))}
                    min="50"
                    className={`w-full p-2 border rounded-lg ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Rotation
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleImagePropertyChange('rotation', selectedElementData.rotation - 15)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <RotateCcw size={16} />
                    </button>
                    <input
                      type="number"
                      value={selectedElementData.rotation}
                      onChange={(e) => handleImagePropertyChange('rotation', parseInt(e.target.value))}
                      className={`w-20 p-2 border rounded-lg text-center ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <button
                      onClick={() => handleImagePropertyChange('rotation', selectedElementData.rotation + 15)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <RotateCw size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            
            {/* Delete Button */}
            <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
              <button
                onClick={deleteElement}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Delete Element
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Floating Properties Button */}
      {selectedElement && !showProperties && (
        <button
          onClick={() => setShowProperties(true)}
          className={`fixed right-6 bottom-6 p-3 rounded-full shadow-lg transition-all hover:scale-110 ${
            darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <Palette size={20} />
        </button>
      )}

      {/* Page Navigation */}
      {numPages > 1 && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className={`p-2 rounded-full transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 disabled:text-gray-600' 
                : 'hover:bg-gray-100 disabled:text-gray-400'
            }`}
          >
            ←
          </button>
          
          <span className="text-sm font-medium">
            Page {currentPage} of {numPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
            disabled={currentPage >= numPages}
            className={`p-2 rounded-full transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 disabled:text-gray-600' 
                : 'hover:bg-gray-100 disabled:text-gray-400'
            }`}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFEditorAdvanced;
