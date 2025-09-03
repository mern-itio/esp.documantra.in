import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Eye } from 'lucide-react';

// Type declarations for PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface PDFPreviewProps {
  file: File | null;
  onPageChange?: (pageNumber: number) => void;
  showControls?: boolean;
  className?: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ 
  file, 
  onPageChange, 
  showControls = true,
  className = ""
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize PDF.js
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Point to the worker file in your public folder
        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          // console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
        }
      } catch (err) {
        console.warn("Failed to set PDF.js worker:", err);
      }
    }
  }, []);

  // Load PDF.js dynamically
  const loadPDFJS = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && !window.pdfjsLib) {
        const pdfjsLib = await import('pdfjs-dist');

        // Set worker path to local file
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          // console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
        } catch (error) {
          console.warn("Failed to set PDF.js worker:", error);
          pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        }

        // Assign to window
        window.pdfjsLib = pdfjsLib;
      }

      return window.pdfjsLib;
    } catch (error) {
      console.error('Error loading PDF.js:', error);
      throw error;
    }
  }, []);

  // Render PDF page
  const renderPage = useCallback(async (pageNumber: number) => {
    if (!pdfDocument || !canvasRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const page = await pdfDocument.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Calculate viewport with scale and rotation
      const viewport = page.getViewport({ 
        scale: scale, 
        rotation: rotation 
      });

      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      setLoading(false);
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render PDF page');
      setLoading(false);
    }
  }, [pdfDocument, scale, rotation]);

  // Load PDF document
  const loadPDF = useCallback(async (pdfFile: File) => {
    try {
      setLoading(true);
      setError(null);

      const pdfjsLib = await loadPDFJS();
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setLoading(false);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF file');
      setLoading(false);
    }
  }, [loadPDFJS]);

  // Load PDF when file changes
  useEffect(() => {
    if (file) {
      loadPDF(file);
    } else {
      setPdfDocument(null);
      setTotalPages(0);
      setCurrentPage(1);
      setError(null);
    }
  }, [file, loadPDF]);

  // Render page when dependencies change
  useEffect(() => {
    if (pdfDocument && currentPage > 0) {
      renderPage(currentPage);
      onPageChange?.(currentPage);
    }
  }, [pdfDocument, currentPage, renderPage, onPageChange]);

  // Navigation functions
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Zoom functions
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  if (!file) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <div className="text-center">
          <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No PDF file selected</p>
          <p className="text-sm text-gray-400">Upload a PDF to see preview</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 bg-red-50 rounded-lg border border-red-200 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <p className="text-red-600 font-medium">Error loading PDF</p>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Controls */}
      {showControls && totalPages > 0 && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={zoomOut}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600 min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={zoomIn}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            <button
              onClick={rotate}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PDF Canvas */}
      <div ref={containerRef} className="relative overflow-auto max-h-96">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading page...</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-center p-4">
          <canvas
            ref={canvasRef}
            className="border border-gray-200 shadow-sm"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>

      {/* Page Navigation (if multiple pages) */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm text-gray-600">Go to page:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">of {totalPages}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFPreview;
