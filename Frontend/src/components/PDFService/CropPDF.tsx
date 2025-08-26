import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FiUpload, FiFile, FiTrash2, FiCrop, FiRotateCw } from 'react-icons/fi';
import { cropPDFService } from '../../services/cropPDFService';
import type { CropPDFResponse, CropData } from '../../types/cropPDF';
import type { PDFInfo } from '../../types/common';

// Type declarations for PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface CropPDFProps {
  onCropResult: (result: CropPDFResponse) => void;
}

interface CropSelection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  height: number;
}

interface PDFPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

const CropPDF: React.FC<CropPDFProps> = ({ onCropResult }) => {
  // Global override to prevent CDN worker loading
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Override any existing PDF.js worker settings
      if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
        if (window.pdfjsLib.GlobalWorkerOptions.workerSrc && 
            window.pdfjsLib.GlobalWorkerOptions.workerSrc.includes('cdnjs.cloudflare.com')) {
          console.log('Global override: Fixing CDN worker path...');
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        }
      }
      
      // Set up a mutation observer to catch any future PDF.js worker changes
      const observer = new MutationObserver(() => {
        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
          if (window.pdfjsLib.GlobalWorkerOptions.workerSrc && 
              window.pdfjsLib.GlobalWorkerOptions.workerSrc.includes('cdnjs.cloudflare.com')) {
            console.log('Mutation observer: Fixing CDN worker path...');
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          }
        }
      });
      
      observer.observe(document, { childList: true, subtree: true });
      
      return () => observer.disconnect();
    }
  }, []);

  const [pdfDocument, setPdfDocument] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [cropping, setCropping] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [cropSelection, setCropSelection] = useState<CropSelection | null>(null);
  const [cropAreas, setCropAreas] = useState<CropData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfPages, setPdfPages] = useState<PDFPage[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Load PDF.js dynamically
  const loadPDFJS = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && !window.pdfjsLib) {
        // console.log('Loading PDF.js...');
        
        // Import the main package
        const pdfjsLib = await import('pdfjs-dist');
        // console.log('PDF.js imported successfully');
        
        // Set worker path BEFORE setting it to window
        try {
          // First try the local worker file
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          // console.log('PDF.js worker set to local file: /pdf.worker.min.mjs');
        } catch (error) {
          console.warn('Failed to set local worker path:', error);
          
          try {
            // Try to use the worker that comes with pdfjs-dist
            const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url);
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.href;
            // console.log('PDF.js worker set to bundled worker:', workerUrl.href);
          } catch (workerError) {
            console.warn('Failed to set bundled worker path:', workerError);
            
            // Last resort: disable worker (will run in main thread)
            pdfjsLib.GlobalWorkerOptions.workerSrc = '';
            // console.log('PDF.js worker disabled, running in main thread');
          }
        }
        
        // Now set to window
        window.pdfjsLib = pdfjsLib;
        // console.log('PDF.js set to window.pdfjsLib');
      } else if (window.pdfjsLib) {
        // If PDF.js is already loaded, ensure worker path is set correctly
        // console.log('PDF.js already loaded, checking worker path...');
        
        // Immediately fix any CDN worker paths
        if (window.pdfjsLib.GlobalWorkerOptions.workerSrc && 
            window.pdfjsLib.GlobalWorkerOptions.workerSrc.includes('cdnjs.cloudflare.com')) {
          // console.log('Immediately fixing CDN worker path...');
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          // console.log('Worker path immediately fixed to local file');
        } else if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc || 
                   window.pdfjsLib.GlobalWorkerOptions.workerSrc.includes('cdnjs.cloudflare.com')) {
          // console.log('Fixing worker path for existing PDF.js instance...');
          try {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
            // console.log('Worker path fixed to local file');
          } catch (error) {
            console.warn('Failed to fix worker path:', error);
          }
        }
      }
      return window.pdfjsLib;
    } catch (error) {
      console.error('Error loading PDF.js:', error);
      throw error;
    }
  }, []);

  // Render PDF pages
  const renderPDFPages = useCallback(async (file: File) => {
    try {
      setLoading(true);
      // console.log('Starting PDF rendering...');
      
      const pdfjsLib = await loadPDFJS();
      // console.log('PDF.js loaded successfully');
      
      const arrayBuffer = await file.arrayBuffer();
      // console.log('File converted to ArrayBuffer, size:', arrayBuffer.byteLength);
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      // console.log('PDF document loaded, pages:', pdf.numPages);
      
      const pages: PDFPage[] = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        // console.log(`Rendering page ${pageNum}...`);
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        
        // console.log(`Page ${pageNum} viewport:`, viewport.width, 'x', viewport.height);
        
        // Create canvas for this page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        
        // Set canvas dimensions
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        // console.log(`Page ${pageNum} rendered to canvas`);
        
        pages.push({
          pageNumber: pageNum,
          canvas: canvas,
          width: viewport.width,
          height: viewport.height
        });
      }
      
      // console.log('All pages rendered, setting state...');
      setPdfPages(pages);
      setLoading(false);
    } catch (error) {
      console.error('Error rendering PDF:', error);
      setLoading(false);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('worker')) {
          errorMessage = 'PDF.js worker failed to load. This might be a browser compatibility issue.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Failed to load PDF.js resources. Please check your internet connection.';
        } else if (error.message.includes('canvas')) {
          errorMessage = 'Canvas rendering failed. Your browser might not support HTML5 Canvas.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Show error to user
      alert(`Failed to render PDF: ${errorMessage}\n\nCheck the browser console for more details.`);
    }
  }, [loadPDFJS]);

  // Effect to start PDF rendering when document is loaded
  useEffect(() => {
    if (pdfDocument && !loading && pdfPages.length === 0) {
      // console.log('Document loaded but no pages rendered, starting rendering...');
      renderPDFPages(pdfDocument);
    }
  }, [pdfDocument, loading, pdfPages.length, renderPDFPages]);

  // Effect to ensure PDF.js worker path is set correctly on mount
  useEffect(() => {
    const initializePDFJS = async () => {
      try {
        // console.log('Initializing PDF.js on component mount...');
        
        // Check if PDF.js is already loaded and fix worker path if needed
        // if (typeof window !== 'undefined' && window.pdfjsLib) {
        //   console.log('PDF.js already loaded, checking worker path...');
        //   if (window.pdfjsLib.GlobalWorkerOptions.workerSrc && 
        //       window.pdfjsLib.GlobalWorkerOptions.workerSrc.includes('cdnjs.cloudflare.com')) {
        //     console.log('Detected CDN worker path, fixing immediately...');
        //     window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        //     console.log('Worker path fixed to local file');
        //   }
        // }
        
        await loadPDFJS();
      } catch (error) {
        console.warn('Failed to initialize PDF.js on mount:', error);
      }
    };
    
    initializePDFJS();
  }, [loadPDFJS]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file');
      return;
    }

    setPdfDocument(file);

    try {
      const info = await cropPDFService.getPDFInfo(file);
      setPdfInfo(info);
      setCropAreas([]);
      setCropSelection(null);
      setCurrentPage(1);
      
      // Render PDF pages
      await renderPDFPages(file);
    } catch (error) {
      console.error('Error getting PDF info:', error);
      onCropResult({
        success: false,
        error: 'Failed to get PDF information',
        message: (error as Error).message,
      });
      removeDocument();
    }
  }, [onCropResult, renderPDFPages]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const removeDocument = useCallback(() => {
    setPdfDocument(null);
    setPdfInfo(null);
    setCropAreas([]);
    setCropSelection(null);
    setCurrentPage(1);
    setPdfPages([]);
    onCropResult({
      success: false,
      message: 'Document removed'
    });
  }, [onCropResult]);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= (pdfInfo?.pages || 1)) {
      setCurrentPage(page);
    }
  }, [pdfInfo?.pages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Handle mouse events for cropping
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!pdfContainerRef.current) return;
    
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsSelecting(true);
    setCropSelection({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      width: 0,
      height: 0
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !cropSelection || !pdfContainerRef.current) return;
    
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCropSelection(prev => prev ? {
      ...prev,
      endX: x,
      endY: y,
      width: Math.abs(x - prev.startX),
      height: Math.abs(y - prev.startY)
    } : null);
  }, [isSelecting, cropSelection]);

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !cropSelection) return;
    
    setIsSelecting(false);
    
    // Validate crop selection (minimum size)
    if (cropSelection.width < 20 || cropSelection.height < 20) {
      setCropSelection(null);
      return;
    }
    
    // Convert to PDF coordinates
    const currentPageData = pdfPages.find(p => p.pageNumber === currentPage);
    if (currentPageData && pdfContainerRef.current) {
      const rect = pdfContainerRef.current.getBoundingClientRect();
      const scaleX = currentPageData.width / rect.width;
      const scaleY = currentPageData.height / rect.height;
      
              const cropData: CropData = {
          page: currentPage,
          cropArea: {
            x: Math.min(cropSelection.startX, cropSelection.endY) * scaleX,
            y: Math.min(cropSelection.startY, cropSelection.endY) * scaleY,
            width: cropSelection.width * scaleX,
            height: cropSelection.height * scaleY
          }
        };
      
      setCropAreas(prev => [...prev, cropData]);
      setCropSelection(null);
    }
  }, [isSelecting, cropSelection, currentPage, pdfPages]);

  // Remove crop area
  const removeCropArea = useCallback((index: number) => {
    setCropAreas(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all crop areas
  const clearAllCrops = useCallback(() => {
    setCropAreas([]);
    setCropSelection(null);
  }, []);

  // Handle final crop
  const handleCrop = useCallback(async () => {
    if (!pdfDocument || cropAreas.length === 0) return;

    setCropping(true);
    try {
      const result = await cropPDFService.cropPDF({
        file: pdfDocument,
        crops: cropAreas
      });

      onCropResult(result);
    } catch (error) {
      console.error('Error cropping PDF:', error);
      onCropResult({
        success: false,
        error: 'Failed to crop PDF',
        message: (error as Error).message,
      });
    } finally {
      setCropping(false);
    }
  }, [pdfDocument, cropAreas, onCropResult]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render current page
  const renderCurrentPage = () => {
    // console.log('renderCurrentPage called, currentPage:', currentPage);
    // console.log('pdfPages:', pdfPages);
    
    const currentPageData = pdfPages.find(p => p.pageNumber === currentPage);
    // console.log('currentPageData:', currentPageData);
    
    if (!currentPageData) {
      // console.log('No page data found for current page');
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <p>Page {currentPage} not loaded</p>
            <p className="text-sm">Total pages: {pdfPages.length}</p>
          </div>
        </div>
      );
    }

    try {
      const dataUrl = currentPageData.canvas.toDataURL();
      // console.log('Canvas data URL generated, length:', dataUrl.length);
      
      return (
        <div className="w-full h-full relative">
          <img 
            src={dataUrl}
            alt={`Page ${currentPage}`}
            className="w-full h-auto"
            style={{ maxWidth: '100%', height: 'auto' }}
            onLoad={() => console.log(`Image loaded for page ${currentPage}`)}
            onError={(e) => console.error(`Image failed to load for page ${currentPage}:`, e)}
          />
        </div>
      );
    } catch (error) {
      console.error('Error rendering page:', error);
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center text-red-500">
            <p>Error rendering page {currentPage}</p>
            <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* File Upload Area */}
      {!pdfDocument && (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <FiUpload className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Drop your PDF here or click to browse
          </h3>
          <p className="text-gray-600 mb-6 text-lg">
            Select a PDF file to crop its pages
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            style={{cursor: 'pointer'}}
          >
            Choose PDF File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {pdfDocument && pdfInfo && (
        <>
          {/* Document Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FiFile className="w-12 h-12 text-blue-500" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{pdfDocument.name}</h3>
                  <p className="text-gray-600">
                    {formatFileSize(pdfDocument.size)} • {pdfInfo.pages} pages
                  </p>
                  <p className="text-sm text-gray-500">
                    File size: {formatFileSize(pdfInfo.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={removeDocument}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                style={{cursor: 'pointer'}}
              >
                <FiTrash2 className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* PDF Viewer and Cropping Area */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Crop PDF Pages</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={clearAllCrops}
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  style={{cursor: 'pointer'}}
                >
                  Clear All Crops
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>How to crop:</strong> Click and drag your mouse over the PDF page to select the area you want to keep. 
                The selected area will be highlighted in blue. You can make multiple selections on different pages.
              </p>
            </div>
            {/* Page Navigation */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <button
                onClick={prevPage}
                disabled={currentPage <= 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiRotateCw className="w-5 h-5" />
              </button>
              <span className="text-lg font-medium text-gray-900">
                Page {currentPage} of {pdfInfo.pages}
              </span>
              <button
                onClick={nextPage}
                disabled={currentPage >= pdfInfo.pages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiRotateCw className="w-5 h-5" />
              </button>
            </div>

            {/* PDF Viewer Container */}
            <div className="relative rounded-lg overflow-hidden mb-6">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading PDF pages...</span>
                </div>
              ) : pdfPages.length === 0 ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center text-gray-500">
                    <p>No PDF pages loaded</p>
                    <p className="text-sm">Please wait for the PDF to process...</p>
                  </div>
                </div>
              ) : (
                <div
                  ref={pdfContainerRef}
                  className="relative mx-auto cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ maxWidth: '500px', maxHeight: '100vh', border: '1px solid #ddd' }}
                >
                  {renderCurrentPage()}
                  
                  {/* Active crop selection */}
                  {cropSelection && (
                    <div 
                      className="absolute border-2 border-blue-500  bg-opacity-20"
                      style={{
                        left: Math.min(cropSelection.startX, cropSelection.endX),
                        top: Math.min(cropSelection.startY, cropSelection.endY),
                        width: cropSelection.width,
                        height: cropSelection.height
                      }}
                    />
                  )}
                  
                  {/* Applied crop areas for current page */}
                  {cropAreas.filter(crop => crop.page === currentPage).map((crop, index) => {
                    const currentPageData = pdfPages.find(p => p.pageNumber === currentPage);
                    if (!currentPageData) return null;
                    
                    const rect = pdfContainerRef.current?.getBoundingClientRect();
                    if (!rect) return null;
                    
                    const scaleX = rect.width / currentPageData.width;
                    const scaleY = rect.height / currentPageData.height;
                    
                    return (
                      <div 
                        key={index}
                        className="absolute border-2 border-green-500 bg-opacity-20"
                        style={{
                          left: crop.cropArea.x * scaleX,
                          top: crop.cropArea.y * scaleY,
                          width: crop.cropArea.width * scaleX,
                          height: crop.cropArea.height * scaleY
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Crop Summary */}
            {cropAreas.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-800 mb-3">Crop Areas Selected</h3>
                <div className="space-y-2">
                  {cropAreas.map((crop, index) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded p-3">
                      <div className="text-sm text-green-700">
                        <span className="font-medium">Page {crop.page}</span> - 
                        {Math.round(crop.cropArea.width)} × {Math.round(crop.cropArea.height)} pts
                      </div>
                      <button
                        onClick={() => removeCropArea(index)}
                        className="text-red-500 hover:text-red-700"
                        style={{cursor: 'pointer'}}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Crop Button */}
            <div className="text-center">
              <button
                onClick={handleCrop}
                disabled={cropping || cropAreas.length === 0}
                className="bg-blue-600 text-white py-4 px-8 rounded-lg font-medium text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center mx-auto"
                style={{cursor: 'pointer'}}
              >
                {cropping ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Cropping Pages...
                  </>
                ) : (
                  <>
                    <FiCrop className="w-5 h-5 mr-2" />
                    Crop Pages ({cropAreas.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CropPDF;
