import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { 
  Upload, 
  Download, 
  Save, 
  Type, 
  Plus,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
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

interface TextElement {
  id: string;
  pageNumber: number;
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
  alignment: 'left' | 'center' | 'right';
  isSelected: boolean;
  isDragging: boolean;
}

interface EditHistory {
  textElements: TextElement[];
  timestamp: number;
}

const AddTextToPdf: React.FC = () => {
  // State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  // const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [isAddingText, setIsAddingText] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('New Text');
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontFamily, setFontFamily] = useState<string>('Arial');
  const [textColor, setTextColor] = useState<string>('#000000');
  const [textStyle, setTextStyle] = useState<{ bold: boolean; italic: boolean; underline: boolean }>({
    bold: false,
    italic: false,
    underline: false
  });
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('left');

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<any>(null);

  // Initialize history
  useEffect(() => {
    if (textElements.length === 0 && editHistory.length === 0) {
      const initialHistory: EditHistory = {
        textElements: [],
        timestamp: Date.now()
      };
      setEditHistory([initialHistory]);
      setHistoryIndex(0);
    }
  }, [textElements, editHistory]);

  // Save to history
  const saveToHistory = useCallback((newTextElements: TextElement[]) => {
    const newHistory: EditHistory = {
      textElements: JSON.parse(JSON.stringify(newTextElements)),
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
      setTextElements(editHistory[newIndex].textElements);
    }
  }, [historyIndex, editHistory]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTextElements(editHistory[newIndex].textElements);
    }
  }, [historyIndex, editHistory]);

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setTextElements([]);
      setSelectedElement(null);
      setCurrentPage(1);
      setScale(1);
      
      const newHistory: EditHistory = {
        textElements: [],
        timestamp: Date.now()
      };
      setEditHistory([newHistory]);
      setHistoryIndex(0);
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

  // Add new text element
  const addTextElement = (x: number, y: number) => {
    if (!isAddingText || !textInput.trim()) return;

    const newElement: TextElement = {
      id: `text_${Date.now()}_${Math.random()}`,
      pageNumber: currentPage,
      x: x / scale,
      y: y / scale,
      width: textInput.length * fontSize * 0.6,
      height: fontSize,
      text: textInput,
      fontSize,
      fontFamily,
      color: textColor,
      isBold: textStyle.bold,
      isItalic: textStyle.italic,
      isUnderline: textStyle.underline,
      alignment: textAlignment,
      isSelected: false,
      isDragging: false
    };

    const newTextElements = [...textElements, newElement];
    setTextElements(newTextElements);
    saveToHistory(newTextElements);
    
    // Reset adding text mode
    setIsAddingText(false);
    setTextInput('New Text');
  };

  // Handle canvas click to add text
  const handleCanvasClick = (event: React.MouseEvent) => {
    if (!isAddingText) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      addTextElement(x, y);
    }
  };

  // Handle text element selection
  const handleElementClick = (elementId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedElement(elementId);
  };

  // Handle text editing
  const handleTextEdit = (elementId: string, newText: string) => {
    const newTextElements = textElements.map(element => 
      element.id === elementId 
        ? { ...element, text: newText, width: newText.length * element.fontSize * 0.6 }
        : element
    );
    setTextElements(newTextElements);
    saveToHistory(newTextElements);
  };

  // Handle element deletion
  const deleteElement = (elementId: string) => {
    const newTextElements = textElements.filter(element => element.id !== elementId);
    setTextElements(newTextElements);
    setSelectedElement(null);
    saveToHistory(newTextElements);
  };

  // Handle element property changes
  const updateElementProperty = (elementId: string, property: keyof TextElement, value: any) => {
    const newTextElements = textElements.map(element => 
      element.id === elementId 
        ? { ...element, [property]: value }
        : element
    );
    setTextElements(newTextElements);
    saveToHistory(newTextElements);
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
      link.download = `text_added_${pdfFile?.name || 'document.pdf'}`;
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
  const selectedElementData = textElements.find(element => element.id === selectedElement);

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
              disabled={textElements.length === 0 || isProcessing}
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
                <p className="text-lg font-medium mb-2">Upload a PDF to add text</p>
                <p className="text-sm">Click the Upload button above to begin adding text</p>
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
                  
                  {/* Text Elements Layer */}
                  {textElements
                    .filter(element => element.pageNumber === currentPage)
                    .map((element) => (
                      <div
                        key={element.id}
                        className={`absolute cursor-pointer transition-all z-10 ${
                          selectedElement === element.id 
                            ? 'ring-2 ring-blue-500' 
                            : ''
                        }`}
                        style={{
                          left: element.x * scale,
                          top: element.y * scale,
                          width: element.width * scale,
                          height: element.height * scale,
                          color: element.color,
                          fontSize: element.fontSize * scale,
                          fontFamily: element.fontFamily,
                          fontWeight: element.isBold ? 'bold' : 'normal',
                          fontStyle: element.isItalic ? 'italic' : 'normal',
                          textDecoration: element.isUnderline ? 'underline' : 'none',
                          textAlign: element.alignment,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '4px',
                          border: selectedElement === element.id ? '2px solid #3b82f6' : '1px solid transparent'
                        }}
                        onClick={(e) => handleElementClick(element.id, e)}
                      >
                        {element.text}
                      </div>
                    ))}
                  
                  {/* Add Text Mode Indicator */}
                  {isAddingText && (
                    <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg">
                      <div className="flex items-center space-x-2">
                        <Type size={16} />
                        <span>Click anywhere to add text</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Text Properties & Add Text */}
        <div className={`w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l p-4 overflow-y-auto`}>
          <div className="space-y-6">
            {/* Add New Text Section */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Add New Text
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Text Content
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className={`w-full p-2 border rounded-lg resize-none ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows={3}
                    placeholder="Enter text to add..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      min="8"
                      max="72"
                      className={`w-full p-2 border rounded-lg ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Font Family
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className={`w-full p-2 border rounded-lg ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Text Color
                  </label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full h-10 border rounded-lg cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Text Style
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setTextStyle(prev => ({ ...prev, bold: !prev.bold }))}
                      className={`p-2 rounded-lg transition-colors ${
                        textStyle.bold
                          ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                          : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                      }`}
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      onClick={() => setTextStyle(prev => ({ ...prev, italic: !prev.italic }))}
                      className={`p-2 rounded-lg transition-colors ${
                        textStyle.italic
                          ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                          : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                      }`}
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      onClick={() => setTextStyle(prev => ({ ...prev, underline: !prev.underline }))}
                      className={`p-2 rounded-lg transition-colors ${
                        textStyle.underline
                          ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                          : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
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
                    <button
                      onClick={() => setTextAlignment('left')}
                      className={`p-2 rounded-lg transition-colors ${
                        textAlignment === 'left'
                          ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                          : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                      }`}
                    >
                      <AlignLeft size={16} />
                    </button>
                    <button
                      onClick={() => setTextAlignment('center')}
                      className={`p-2 rounded-lg transition-colors ${
                        textAlignment === 'center'
                          ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                          : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                      }`}
                    >
                      <AlignCenter size={16} />
                    </button>
                    <button
                      onClick={() => setTextAlignment('right')}
                      className={`p-2 rounded-lg transition-colors ${
                        textAlignment === 'right'
                          ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                          : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                      }`}
                    >
                      <AlignRight size={16} />
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsAddingText(!isAddingText)}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isAddingText
                      ? (darkMode ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white')
                      : (darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')
                  }`}
                >
                  <Plus size={18} />
                  <span>{isAddingText ? 'Cancel Adding Text' : 'Start Adding Text'}</span>
                </button>
              </div>
            </div>

            {/* Selected Element Properties */}
            {selectedElementData && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Edit Text Element
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
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Text Content
                    </label>
                    <textarea
                      value={selectedElementData.text}
                      onChange={(e) => handleTextEdit(selectedElementData.id, e.target.value)}
                      className={`w-full p-2 border rounded-lg resize-none ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Font Size
                      </label>
                      <input
                        type="number"
                        value={selectedElementData.fontSize}
                        onChange={(e) => updateElementProperty(selectedElementData.id, 'fontSize', Number(e.target.value))}
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
                      <input
                        type="color"
                        value={selectedElementData.color}
                        onChange={(e) => updateElementProperty(selectedElementData.id, 'color', e.target.value)}
                        className="w-full h-10 border rounded-lg cursor-pointer"
                      />
                    </div>
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

      {/* Instructions */}
      {/* {pdfFile && textElements.length === 0 && (
        <div className={`fixed top-20 right-6 max-w-sm p-4 rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          <h4 className="font-medium mb-2">How to Add Text:</h4>
          <ul className="text-sm space-y-1">
            <li>• Configure text properties in the sidebar</li>
            <li>• Click "Start Adding Text" button</li>
            <li>• Click anywhere on the PDF to place text</li>
            <li>• Click on text elements to edit them</li>
            <li>• Save changes before downloading</li>
          </ul>
        </div>
      )} */}
    </div>
  );
};

export default AddTextToPdf;
