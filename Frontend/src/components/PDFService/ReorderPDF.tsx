import React, { useState, useRef, useCallback } from 'react';
import { FiUpload, FiFile, FiTrash2, FiDownload, FiMove, FiPlus, FiX } from 'react-icons/fi';
import { reorderPDFService } from '../../services/reorderPDFService';
import type { ReorderPDFResponse, ReorderPageItem } from '../../types/reorderPDF';
import type { PDFInfo } from '../../types/common';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file');
      return;
    }

    setDocument(file);

    // Get PDF info and initialize page items
    try {
      const info = await reorderPDFService.getPDFInfo(file);
      setPdfInfo(info);

      const initialPages: ReorderPageItem[] = Array.from({ length: info.pages }, (_, i) => ({
        id: (i + 1).toString(),
        pageNumber: i + 1,
        originalIndex: i,
      }));
      setPageItems(initialPages);
    } catch (error) {
      console.error('Error getting PDF info:', error);
      onReorderResult({
        success: false,
        error: 'Failed to get PDF information',
        message: (error as Error).message,
      });
      removeDocument();
    }
  }, [onReorderResult]);

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

  // Generate mock page preview
  const generatePagePreview = (pageNumber: number) => {
    return (
      <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
        {/* Mock PDF content */}
        <div className="text-center text-gray-600">
          <div className="text-lg font-semibold mb-1">Page {pageNumber}</div>
          <div className="text-xs">PDF Content Preview</div>
        </div>
        
        {/* Mock watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="text-6xl font-bold text-gray-300">D</div>
        </div>
        
        {/* Mock logo */}
        <div className="absolute top-2 right-2 text-xs font-semibold text-orange-500">
          Dittio
        </div>
        
        {/* Mock content lines */}
        <div className="absolute bottom-8 left-2 right-2 space-y-1">
          <div className="h-1 bg-gray-300 rounded"></div>
          <div className="h-1 bg-gray-300 rounded w-3/4"></div>
          <div className="h-1 bg-gray-300 rounded w-1/2"></div>
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
          <p className="text-gray-600 mb-6 text-lg">
            Select a PDF file to reorder its pages
          </p>
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
