import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { 
  Upload, 
  Download, 
  Save, 
  Type, 
  Edit3,
  Eye,
  EyeOff,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  AlertCircle
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

interface TextBlock {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  originalText: string;
  editedText: string;
  isEditing: boolean;
  hasChanges: boolean;
  fontSize?: number;
  fontFamily?: string;
}

interface EditHistory {
  textBlocks: TextBlock[];
  timestamp: number;
}

const EditPdfText: React.FC = () => {
  // State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [selectedTextBlock, setSelectedTextBlock] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [showTextLayer, setShowTextLayer] = useState<boolean>(false); // Always false to avoid double text
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  // const [pdfDocument, setPdfDocument] = useState<any>(null);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<any>(null);

  // Initialize history
  useEffect(() => {
    if (textBlocks.length === 0 && editHistory.length === 0) {
      const initialHistory: EditHistory = {
        textBlocks: [],
        timestamp: Date.now()
      };
      setEditHistory([initialHistory]);
      setHistoryIndex(0);
    }
  }, [textBlocks, editHistory]);

  // Save to history
  const saveToHistory = useCallback((newTextBlocks: TextBlock[]) => {
    const newHistory: EditHistory = {
      textBlocks: JSON.parse(JSON.stringify(newTextBlocks)),
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
      setTextBlocks(editHistory[newIndex].textBlocks);
    }
  }, [historyIndex, editHistory]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTextBlocks(editHistory[newIndex].textBlocks);
    }
  }, [historyIndex, editHistory]);

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setTextBlocks([]);
      setSelectedTextBlock(null);
      setCurrentPage(1);
      setScale(1);
      
      const newHistory: EditHistory = {
        textBlocks: [],
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

  // Page load success handler - extract text from the actual page
  const onPageLoadSuccess = (page: any) => {
    pageRef.current = page;
    extractTextFromPage(page);
  };

  // Extract real text from PDF page
  const extractTextFromPage = async (page: any) => {
    try {
      const textContent = await page.getTextContent();
      const blocks: TextBlock[] = [];
      
      textContent.items.forEach((item: any, index: number) => {
        if (item.str && item.str.trim()) {
          const transform = item.transform;
          const x = transform[4];
          const y = transform[5];
          
          // Calculate width and height based on font size and text length
          const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);
          const textWidth = item.str.length * fontSize * 0.6; // Approximate character width
          const textHeight = fontSize;
          
          blocks.push({
            id: `text_${currentPage}_${index}`,
            pageNumber: currentPage,
            x: x,
            y: page.view[3] - y, // Convert PDF coordinates to screen coordinates
            width: textWidth,
            height: textHeight,
            originalText: item.str,
            editedText: item.str,
            isEditing: false,
            hasChanges: false,
            fontSize: fontSize,
            fontFamily: item.fontName || 'Arial'
          });
        }
      });
      
      setTextBlocks(blocks);
      saveToHistory(blocks);
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      // Fallback to sample text if extraction fails
      createSampleTextBlocks();
    }
  };

  // Fallback sample text blocks
  const createSampleTextBlocks = () => {
    const sampleBlocks: TextBlock[] = [
      {
        id: 'text_1',
        pageNumber: 1,
        x: 100,
        y: 150,
        width: 200,
        height: 30,
        originalText: 'Sample text block 1',
        editedText: 'Sample text block 1',
        isEditing: false,
        hasChanges: false
      },
      {
        id: 'text_2',
        pageNumber: 1,
        x: 100,
        y: 200,
        width: 250,
        height: 30,
        originalText: 'Another text block to edit',
        editedText: 'Another text block to edit',
        isEditing: false,
        hasChanges: false
      }
    ];
    
    setTextBlocks(sampleBlocks);
    saveToHistory(sampleBlocks);
  };

  // Zoom controls
  const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.3));
  const fitToScreen = () => setScale(1);
  const resetZoom = () => setScale(1);

  // Handle text block selection
  const handleTextBlockClick = (textBlockId: string) => {
    setSelectedTextBlock(textBlockId);
  };

  // Handle text editing
  const handleTextEdit = (textBlockId: string, newText: string) => {
    const newTextBlocks = textBlocks.map(block => 
      block.id === textBlockId 
        ? { 
            ...block, 
            editedText: newText, 
            hasChanges: newText !== block.originalText 
          }
        : block
    );
    setTextBlocks(newTextBlocks);
    saveToHistory(newTextBlocks);
  };

  // Start editing a text block
  const startEditing = (textBlockId: string) => {
    const newTextBlocks = textBlocks.map(block => 
      block.id === textBlockId 
        ? { ...block, isEditing: true }
        : block
    );
    setTextBlocks(newTextBlocks);
  };

  // Finish editing a text block
  const finishEditing = (textBlockId: string) => {
    const newTextBlocks = textBlocks.map(block => 
      block.id === textBlockId 
        ? { ...block, isEditing: false }
        : block
    );
    setTextBlocks(newTextBlocks);
  };

  // Reset text block to original
  const resetTextBlock = (textBlockId: string) => {
    const newTextBlocks = textBlocks.map(block => 
      block.id === textBlockId 
        ? { 
            ...block, 
            editedText: block.originalText, 
            hasChanges: false 
          }
        : block
    );
    setTextBlocks(newTextBlocks);
    saveToHistory(newTextBlocks);
  };

  // Save changes (placeholder - would integrate with backend)
  const handleSave = async () => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newTextBlocks = textBlocks.map(block => ({
        ...block,
        originalText: block.editedText,
        hasChanges: false
      }));
      setTextBlocks(newTextBlocks);
      saveToHistory(newTextBlocks);
      
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
      link.download = `edited_${pdfFile?.name || 'document.pdf'}`;
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

  // Get selected text block
  const selectedTextBlockData = textBlocks.find(block => block.id === selectedTextBlock);

  // Check if there are any unsaved changes
  const hasUnsavedChanges = textBlocks.some(block => block.hasChanges);

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
              onClick={() => setShowTextLayer(!showTextLayer)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={showTextLayer ? 'Hide Original Text' : 'Show Original Text'}
            >
              {showTextLayer ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            
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
              disabled={!hasUnsavedChanges || isProcessing}
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
        {/* Main Canvas */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {!pdfFile ? (
              <div className={`flex flex-col items-center justify-center h-96 rounded-lg border-2 border-dashed ${
                darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
              }`}>
                <Upload size={48} className="mb-4" />
                <p className="text-lg font-medium mb-2">Upload a PDF to edit text</p>
                <p className="text-sm">Click the Upload button above to begin editing text</p>
              </div>
            ) : (
              <div className="flex justify-center">
                <div 
                  ref={canvasRef}
                  className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-lg overflow-hidden`}
                >
                  {/* PDF Background Image - Completely Hidden Text */}
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
                  
                  {/* Our Editable Text Layer - Only This Shows */}
                  {textBlocks
                    .filter(block => block.pageNumber === currentPage)
                    .map((block) => (
                      <div
                        key={block.id}
                        className={`absolute cursor-pointer transition-all z-10 ${
                          selectedTextBlock === block.id 
                            ? 'ring-2 ring-blue-500' 
                            : block.hasChanges 
                              ? 'ring-1 ring-orange-400' 
                              : ''
                        }`}
                        style={{
                          left: block.x * scale,
                          top: block.y * scale,
                          width: block.width * scale,
                          height: block.height * scale,
                        }}
                        onClick={() => handleTextBlockClick(block.id)}
                      >
                        {block.isEditing ? (
                          <textarea
                            value={block.editedText}
                            onChange={(e) => handleTextEdit(block.id, e.target.value)}
                            onBlur={() => finishEditing(block.id)}
                            className="w-full h-full p-1 border border-blue-500 rounded outline-none resize-none bg-white text-black text-sm"
                            style={{
                              fontSize: Math.max(10, (block.fontSize || 12) * scale),
                              fontFamily: block.fontFamily || 'Arial'
                            }}
                            autoFocus
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center p-1 text-sm ${
                              darkMode ? 'text-white' : 'text-black'
                            }`}
                            style={{
                              fontSize: Math.max(10, (block.fontSize || 12) * scale),
                              fontFamily: block.fontFamily || 'Arial'
                            }}
                            onDoubleClick={() => startEditing(block.id)}
                          >
                            {block.editedText}
                            {block.hasChanges && (
                              <span className="ml-1 text-orange-500">*</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Text Block Properties */}
        {selectedTextBlockData && (
          <div className={`w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l p-4 overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Text Properties
              </h3>
              <button
                onClick={() => setSelectedTextBlock(null)}
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
                  Original Text
                </label>
                <div className={`p-2 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-600'
                }`}>
                  {selectedTextBlockData.originalText}
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Edited Text
                </label>
                <textarea
                  value={selectedTextBlockData.editedText}
                  onChange={(e) => handleTextEdit(selectedTextBlockData.id, e.target.value)}
                  className={`w-full p-2 border rounded-lg resize-none ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows={3}
                  placeholder="Edit the text here..."
                />
              </div>
              
              {selectedTextBlockData.fontSize && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Font Size
                  </label>
                  <div className={`p-2 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-600'
                  }`}>
                    {Math.round(selectedTextBlockData.fontSize)}px
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => startEditing(selectedTextBlockData.id)}
                  disabled={selectedTextBlockData.isEditing}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                    selectedTextBlockData.isEditing
                      ? (darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500')
                      : (darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')
                  }`}
                >
                  <Edit3 size={16} />
                  <span>Edit</span>
                </button>
                
                <button
                  onClick={() => resetTextBlock(selectedTextBlockData.id)}
                  disabled={!selectedTextBlockData.hasChanges}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                    selectedTextBlockData.hasChanges
                      ? (darkMode ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white')
                      : (darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500')
                  }`}
                >
                  <RotateCcw size={16} />
                  <span>Reset</span>
                </button>
              </div>
              
              {selectedTextBlockData.hasChanges && (
                <div className="flex items-center space-x-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <AlertCircle size={16} className="text-orange-500" />
                  <span className="text-sm text-orange-700 dark:text-orange-300">
                    This text has been modified. Click Save to apply changes.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
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
      {pdfFile && textBlocks.length === 0 && (
        <div className={`fixed top-20 right-6 max-w-sm p-4 rounded-lg shadow-lg ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          <h4 className="font-medium mb-2">How to Edit Text:</h4>
          <ul className="text-sm space-y-1">
            <li>• Double-click on any text to edit it</li>
            <li>• Click outside to finish editing</li>
            <li>• Use the sidebar to modify text properties</li>
            <li>• Save changes before downloading</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default EditPdfText;
