import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FiUpload, FiFile, FiTrash2, FiDownload, FiMove, FiPlus, FiX } from 'react-icons/fi';
import { reorderPDFService } from '../../services/reorderPDFService';
import type { ReorderPDFResponse, ReorderPageItem } from '../../types/reorderPDF';
import type { PDFInfo } from '../../types/common';

// Type declarations for PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface ReorderPDFProps {
  onReorderResult: (result: ReorderPDFResponse) => void;
}

const ReorderPDF: React.FC<ReorderPDFProps> = ({ onReorderResult }) => {
  const [document, setDocument] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [reordering, setReordering] = useState(false);
  const [pageItems, setPageItems] = useState<ReorderPageItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showPagePreview, setShowPagePreview] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [pdfThumbnails, setPdfThumbnails] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize PDF.js
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Point to the worker file in your public folder
        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
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
          console.log("PDF.js worker set to local file: /pdf.worker.min.mjs");
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

  // Generate PDF thumbnails
  const generatePDFThumbnails = useCallback(async (pdfFile: File) => {
    try {
      const pdfjsLib = await loadPDFJS();
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const thumbnails: string[] = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.3 }); // Small thumbnails
        
        const canvas = window.document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        thumbnails.push(canvas.toDataURL());
      }
      
      return thumbnails;
    } catch (error) {
      console.error('Error generating PDF thumbnails:', error);
      return [];
    }
  }, [loadPDFJS]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file');
      return;
    }

    setDocument(file);

    // Get PDF info, generate thumbnails, and initialize page items
    try {
      const [info, thumbnails] = await Promise.all([
        reorderPDFService.getPDFInfo(file),
        generatePDFThumbnails(file)
      ]);
      
      setPdfInfo(info);
      setPdfThumbnails(thumbnails);

      const initialPages: ReorderPageItem[] = Array.from({ length: info.pages }, (_, i) => ({
        id: (i + 1).toString(),
        pageNumber: i + 1,
        originalIndex: i,
      }));
      setPageItems(initialPages);
    } catch (error) {
      console.error('Error processing PDF:', error);
      onReorderResult({
        success: false,
        error: 'Failed to get PDF information',
        message: (error as Error).message,
      });
      removeDocument();
    }
  }, [onReorderResult, generatePDFThumbnails]);

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
    setDocument(null);
    setPdfInfo(null);
    setPageItems([]);
    setPdfThumbnails([]);
    onReorderResult({
      success: false,
      message: 'Document removed'
    });
  }, [onReorderResult]);

  // Drag and drop for page reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDropPage = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;

    const newPageItems = [...pageItems];
    const draggedItem = newPageItems[dragIndex];
    
    // Remove dragged item from original position
    newPageItems.splice(dragIndex, 1);
    
    // Insert at new position
    newPageItems.splice(dropIndex, 0, draggedItem);
    
    setPageItems(newPageItems);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Handle reorder
  const handleReorder = useCallback(async () => {
    if (!document || pageItems.length === 0) return;

    setReordering(true);
    try {
      const order = pageItems.map(item => item.pageNumber);
      const result = await reorderPDFService.reorderPDF({
        file: document,
        order: order
      });

      onReorderResult(result);
    } catch (error) {
      console.error('Error reordering PDF:', error);
      onReorderResult({
        success: false,
        error: 'Failed to reorder PDF',
        message: (error as Error).message,
      });
    } finally {
      setReordering(false);
    }
  }, [document, pageItems, onReorderResult]);

  // Reset to original order
  const resetOrder = useCallback(() => {
    if (pdfInfo) {
      const originalPages: ReorderPageItem[] = Array.from({ length: pdfInfo.pages }, (_, i) => ({
        id: (i + 1).toString(),
        pageNumber: i + 1,
        originalIndex: i,
      }));
      setPageItems(originalPages);
    }
  }, [pdfInfo]);

  // Generate real PDF page preview
  const generatePagePreview = (pageNumber: number) => {
    const thumbnailIndex = pageNumber - 1; // Convert to 0-based index
    const thumbnail = pdfThumbnails[thumbnailIndex];
    
    if (thumbnail) {
      return (
        <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200 bg-white">
          <img 
            src={thumbnail} 
            alt={`Page ${pageNumber} preview`}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }
    
    // Fallback to loading state if thumbnail not available
    return (
      <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
        <div className="text-center text-gray-600">
          <div className="text-lg font-semibold mb-1">Page {pageNumber}</div>
          <div className="text-xs">Loading preview...</div>
        </div>
      </div>
    );
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      {/* <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Reorder PDF Pages</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Drag and drop pages to reorder them. Create the perfect sequence for your document.
        </p>
      </div> */}

      {/* File Upload Area */}
      {!document && (
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
          <p className="text-gray-600 mb-2 text-lg">
            Select a PDF file to reorder its pages
          </p>
           <p className="text-sm text-gray-500 mb-6">Maximum file size: 2MB</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors" style={{cursor: 'pointer'}}
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

      {/* Document Info */}
      {document && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FiFile className="w-12 h-12 text-blue-500" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{document.name}</h3>
                <p className="text-gray-600">
                  {formatFileSize(document.size)} • {pdfInfo?.pages || 0} pages
                </p>
              </div>
            </div>
            <button
              onClick={removeDocument}
              className="text-gray-400 hover:text-gray-600 transition-colors" style={{cursor: 'pointer'}}
            >
              <FiTrash2 className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Page Preview & Reordering Section */}
      {document && pdfInfo && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Page Reordering</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={resetOrder}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors" style={{cursor: 'pointer'}}
              >
                Reset Order
              </button>
              <button
                onClick={() => setShowPagePreview(!showPagePreview)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors" style={{cursor: 'pointer'}}
              >
                {showPagePreview ? <FiX className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                <span>{showPagePreview ? 'Hide' : 'Show'} Preview</span>
              </button>
            </div>
          </div>

          {showPagePreview && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pageItems.map((page, index) => (
                  <div
                    key={page.id}
                    className={`relative transition-all duration-200 ${
                      dragIndex === index ? 'opacity-50' : ''
                    } ${dragOverIndex === index ? 'ring-2 ring-blue-500' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDropPage(e, index)}
                  >
                    {/* Page Preview Card */}
                    <div className="border-2 rounded-lg p-3 transition-all cursor-move hover:border-blue-300 border-gray-200 bg-white">
                      {/* Page Preview */}
                      {generatePagePreview(page.pageNumber)}
                      
                      {/* Page Number Label */}
                      <div className="text-center mt-2">
                        <span className="text-sm font-medium text-gray-700">
                          Page {page.pageNumber}
                        </span>
                      </div>
                      
                      {/* Position Indicator */}
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>
                      
                      {/* Drag Handle */}
                      <div className="absolute top-2 left-2 text-gray-400">
                        <FiMove className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Order Summary */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-800">
                      New page order: <span className="font-semibold">{pageItems.map(p => p.pageNumber).join(' → ')}</span>
                    </p>
                    <p className="text-sm text-blue-600">
                      Total pages: {pageItems.length}
                    </p>
                  </div>
                  <div className="text-sm text-blue-600">
                    Drag pages to reorder • Click and drag to move
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reorder Button */}
      {document && pdfInfo && (
        <div className="text-center">
          <button
            onClick={handleReorder}
            disabled={reordering}
            className="bg-blue-600 text-white py-4 px-8 rounded-lg font-medium text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center mx-auto"
          >
            {reordering ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Reordering Pages...
              </>
            ) : (
              <>
                <FiDownload className="w-5 h-5 mr-2" />
                Reorder Pages
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReorderPDF;
