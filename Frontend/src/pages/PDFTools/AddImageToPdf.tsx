import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { 
  Upload, 
  Download, 
  Save, 
  Image as ImageIcon,
  Plus,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Trash2,
  Move,
} from 'lucide-react';

// Set up PDF.js worker using local file to avoid CORS issues
const setupPDFWorker = () => {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
  } catch (error) {
    console.warn('Local PDF.js worker setup failed, using CDN fallback:', error);
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    } catch (fallbackError) {
      console.warn('CDN fallback also failed:', fallbackError);
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
  }
};

setupPDFWorker();

interface ImageElement {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
  rotation: number;
  opacity: number;
  isSelected: boolean;
  isDragging: boolean;
  isResizing: boolean;
}

interface EditHistory {
  imageElements: ImageElement[];
  timestamp: number;
}

const AddImageToPdf: React.FC = () => {
  // State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [imageElements, setImageElements] = useState<ImageElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  // const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [isAddingImage, setIsAddingImage] = useState<boolean>(false);
  const [imageOpacity, setImageOpacity] = useState<number>(100);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 200, height: 150 });
  
  // Drag state
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<any>(null);

  // Initialize history
  useEffect(() => {
    if (imageElements.length === 0 && editHistory.length === 0) {
      const initialHistory: EditHistory = {
        imageElements: [],
        timestamp: Date.now()
      };
      setEditHistory([initialHistory]);
      setHistoryIndex(0);
    }
  }, [imageElements, editHistory]);

  // Save to history
  const saveToHistory = useCallback((newImageElements: ImageElement[]) => {
    const newHistory: EditHistory = {
      imageElements: JSON.parse(JSON.stringify(newImageElements)),
      timestamp: Date.now()
    };
    
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
      setImageElements(editHistory[newIndex].imageElements);
    }
  }, [historyIndex, editHistory]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setImageElements(editHistory[newIndex].imageElements);
    }
  }, [historyIndex, editHistory]);

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setImageElements([]);
      setSelectedElement(null);
      setCurrentPage(1);
      setScale(1);
      
      const newHistory: EditHistory = {
        imageElements: [],
        timestamp: Date.now()
      };
      setEditHistory([newHistory]);
      setHistoryIndex(0);
    }
  };

  // Image upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setIsAddingImage(true);
      
      // Create a temporary image to get dimensions
      const img = new Image();
      img.onload = () => {
        setImageSize({
          width: img.width,
          height: img.height
        });
        img.onload = null;
      };
      img.src = url;
    }
  };

  // PDF load success handler
  // const onDocumentLoadSuccess = ({ numPages, ...document }: { numPages: number; [key: string]: any }) => {
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number; [key: string]: any }) => {
    setNumPages(numPages);
    // setPdfDocument(document);
  };

  // Page load success handler
  const onPageLoadSuccess = (page: any) => {
    pageRef.current = page;
  };

  // Add new image element
  const addImageElement = (x: number, y: number) => {
    if (!isAddingImage) return;

    const imageFile = imageInputRef.current?.files?.[0];
    if (!imageFile) return;

    const imageUrl = URL.createObjectURL(imageFile);
    
    const newElement: ImageElement = {
      id: `image_${Date.now()}_${Math.random()}`,
      pageNumber: currentPage,
      x: x / scale,
      y: y / scale,
      width: imageSize.width,
      height: imageSize.height,
      imageUrl,
      originalWidth: imageSize.width,
      originalHeight: imageSize.height,
      rotation: imageRotation,
      opacity: imageOpacity / 100,
      isSelected: false,
      isDragging: false,
      isResizing: false
    };

    const newImageElements = [...imageElements, newElement];
    setImageElements(newImageElements);
    saveToHistory(newImageElements);
    
    // Reset adding image mode
    setIsAddingImage(false);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Handle canvas click to add image
  const handleCanvasClick = (event: React.MouseEvent) => {
    if (!isAddingImage) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      addImageElement(x, y);
    }
  };

  // Handle image element selection
  const handleElementClick = (elementId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedElement(elementId);
  };

  // Handle drag start
  const handleDragStart = (elementId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedElement(elementId);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const element = imageElements.find(el => el.id === elementId);
      if (element) {
        const startX = event.clientX - rect.left;
        const startY = event.clientY - rect.top;
        
        setDragStart({ x: startX, y: startY });
        setDragOffset({
          x: startX - (element.x * scale),
          y: startY - (element.y * scale)
        });
        
        // Update element to show it's being dragged
        const newImageElements = imageElements.map(el => 
          el.id === elementId 
            ? { ...el, isDragging: true }
            : el
        );
        setImageElements(newImageElements);
      }
    }
  };

  // Handle drag move
  const handleDragMove = useCallback((event: MouseEvent) => {
    if (!dragStart || !dragOffset || !selectedElement) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;
      
      const newX = (currentX - dragOffset.x) / scale;
      const newY = (currentY - dragOffset.y) / scale;
      
      const newImageElements = imageElements.map(el => 
        el.id === selectedElement 
          ? { ...el, x: newX, y: newY }
          : el
      );
      setImageElements(newImageElements);
    }
  }, [dragStart, dragOffset, selectedElement, scale, imageElements]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (selectedElement) {
      // Update element to show it's no longer being dragged
      const newImageElements = imageElements.map(el => 
        el.id === selectedElement 
          ? { ...el, isDragging: false }
          : el
      );
      setImageElements(newImageElements);
      saveToHistory(newImageElements);
    }
    
    setDragStart(null);
    setDragOffset(null);
  }, [selectedElement, imageElements, saveToHistory]);

  // Set up global mouse event listeners for dragging
  useEffect(() => {
    if (dragStart) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [dragStart, handleDragMove, handleDragEnd]);

  // Handle element deletion
  const deleteElement = (elementId: string) => {
    const newImageElements = imageElements.filter(element => element.id !== elementId);
    setImageElements(newImageElements);
    setSelectedElement(null);
    saveToHistory(newImageElements);
  };

  // Handle element property changes
  const updateElementProperty = (elementId: string, property: keyof ImageElement, value: any) => {
    const newImageElements = imageElements.map(element => 
      element.id === elementId 
        ? { ...element, [property]: value }
        : element
    );
    setImageElements(newImageElements);
    saveToHistory(newImageElements);
  };

  // Zoom controls
  const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.3));
  const fitToScreen = () => setScale(1);
  const resetZoom = () => setScale(1);

  // Save changes (placeholder - would integrate with backend)
  const handleSave = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('PDF saved successfully!');
    } catch (error) {
      alert('Error saving PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download modified PDF (placeholder - would integrate with backend)
  const handleDownload = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const link = document.createElement('a');
      link.href = '#';
      link.download = `images_added_${pdfFile?.name || 'document.pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('PDF downloaded successfully!');
    } catch (error) {
      alert('Error downloading PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get selected element
  const selectedElementData = imageElements.find(element => element.id === selectedElement);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Custom CSS to hide PDF text layer */}
      <style>{`
        .react-pdf__Page__textContent {
          display: none !important;
        }
        .react-pdf__Page__annotations {
          display: none !important;
        }
        .react-pdf__Page__canvas {
          pointer-events: none;
        }
        .react-pdf__Page__textContentLayer {
          display: none !important;
        }
        .react-pdf__Page__annotationLayer {
          display: none !important;
        }
      `}</style>
      
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
              onClick={resetZoom}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ImageIcon size={18} />
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
              <RotateCcw size={18} />
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
              <RotateCw size={18} />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <button
              onClick={handleSave}
              disabled={imageElements.length === 0 || isProcessing}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600 disabled:text-gray-400' 
                  : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400 disabled:text-gray-200'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleDownload}
              disabled={!pdfFile || isProcessing}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600 disabled:text-gray-400' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400 disabled:text-gray-200'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Canvas */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {!pdfFile ? (
              <div className={`flex flex-col items-center justify-center h-96 rounded-lg border-2 border-dashed ${
                darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
              }`}>
                <Upload size={48} className="mb-4" />
                <p className="text-lg font-medium mb-2">Upload a PDF to add images</p>
                <p className="text-sm">Click the Upload button above to begin adding images</p>
              </div>
            ) : (
              <div className="flex justify-center">
                <div 
                  ref={canvasRef}
                  className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-lg overflow-hidden`}
                  onClick={handleCanvasClick}
                >
                  {/* PDF Background */}
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
                      onLoadSuccess={onPageLoadSuccess}
                    />
                  </Document>
                  
                  {/* Image Elements Layer */}
                  {imageElements
                    .filter(element => element.pageNumber === currentPage)
                    .map((element) => (
                      <div
                        key={element.id}
                        className={`absolute cursor-move transition-all z-10 ${
                          selectedElement === element.id 
                            ? 'ring-2 ring-blue-500' 
                            : ''
                        } ${element.isDragging ? 'z-20' : ''}`}
                        style={{
                          left: element.x * scale,
                          top: element.y * scale,
                          width: element.width * scale,
                          height: element.height * scale,
                          transform: `rotate(${element.rotation}deg)`,
                          opacity: element.opacity,
                          border: selectedElement === element.id ? '2px solid #3b82f6' : '1px solid transparent',
                          cursor: element.isDragging ? 'grabbing' : 'grab'
                        }}
                        onMouseDown={(e) => handleDragStart(element.id, e)}
                        onClick={(e) => handleElementClick(element.id, e)}
                      >
                        <img
                          src={element.imageUrl}
                          alt="Added Image"
                          className="w-full h-full object-cover rounded pointer-events-none"
                          draggable={false}
                        />
                        {/* Drag handle indicator */}
                        <div className="absolute top-1 right-1 bg-blue-500 text-white p-1 rounded-full opacity-70 hover:opacity-100 transition-opacity">
                          <Move size={12} />
                        </div>
                      </div>
                    ))}
                  
                  {/* Add Image Mode Indicator */}
                  {isAddingImage && (
                    <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg">
                      <div className="flex items-center space-x-2">
                        <ImageIcon size={16} />
                        <span>Click anywhere to add image</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Drag Mode Indicator */}
                  {dragStart && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg">
                      <div className="flex items-center space-x-2">
                        <Move size={16} />
                        <span>Dragging image...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Image Properties & Add Image */}
        <div className={`w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l p-4 overflow-y-auto`}>
          <div className="space-y-6">
            {/* Add New Image Section */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Add New Image
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Select Image
                  </label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={`w-full p-2 border rounded-lg ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Width
                    </label>
                    <input
                      type="number"
                      value={imageSize.width}
                      onChange={(e) => setImageSize(prev => ({ ...prev, width: Number(e.target.value) }))}
                      min="50"
                      max="800"
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
                      value={imageSize.height}
                      onChange={(e) => setImageSize(prev => ({ ...prev, height: Number(e.target.value) }))}
                      min="50"
                      max="800"
                      className={`w-full p-2 border rounded-lg ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Opacity: {imageOpacity}%
                  </label>
                  <input
                    type="range"
                    value={imageOpacity}
                    onChange={(e) => setImageOpacity(Number(e.target.value))}
                    min="10"
                    max="100"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Rotation: {imageRotation}°
                  </label>
                  <input
                    type="range"
                    value={imageRotation}
                    onChange={(e) => setImageRotation(Number(e.target.value))}
                    min="0"
                    max="360"
                    className="w-full"
                  />
                </div>
                
                <button
                  onClick={() => setIsAddingImage(!isAddingImage)}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isAddingImage
                      ? (darkMode ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white')
                      : (darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')
                  }`}
                >
                  <Plus size={18} />
                  <span>{isAddingImage ? 'Cancel Adding Image' : 'Start Adding Image'}</span>
                </button>
              </div>
            </div>

            {/* Selected Element Properties */}
            {selectedElementData && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Edit Image Element
                  </h3>
                  <button
                    onClick={() => setSelectedElement(null)}
                    className={`p-1 rounded-lg transition-colors ${
                      darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Width
                      </label>
                      <input
                        type="number"
                        value={selectedElementData.width}
                        onChange={(e) => updateElementProperty(selectedElementData.id, 'width', Number(e.target.value))}
                        min="50"
                        max="800"
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
                        value={selectedElementData.height}
                        onChange={(e) => updateElementProperty(selectedElementData.id, 'height', Number(e.target.value))}
                        min="50"
                        max="800"
                        className={`w-full p-2 border rounded-lg ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Opacity: {Math.round(selectedElementData.opacity * 100)}%
                    </label>
                    <input
                      type="range"
                      value={selectedElementData.opacity * 100}
                      onChange={(e) => updateElementProperty(selectedElementData.id, 'opacity', Number(e.target.value) / 100)}
                      min="10"
                      max="100"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Rotation: {selectedElementData.rotation}°
                    </label>
                    <input
                      type="range"
                      value={selectedElementData.rotation}
                      onChange={(e) => updateElementProperty(selectedElementData.id, 'rotation', Number(e.target.value))}
                      min="0"
                      max="360"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => deleteElement(selectedElementData.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Instructions */}
            <div className="border-t pt-6">
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                How to Use
              </h3>
              <div className={`text-sm space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p>• <strong>Add Image:</strong> Select image file, configure properties, click "Start Adding Image", then click on PDF</p>
                <p>• <strong>Move Image:</strong> Click and drag any image to reposition it</p>
                <p>• <strong>Edit Image:</strong> Click on image to edit properties in sidebar</p>
                <p>• <strong>Delete Image:</strong> Select image and click delete button</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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

export default AddImageToPdf;
