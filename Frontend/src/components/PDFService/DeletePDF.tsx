import React, { useState, useRef, useCallback } from 'react';
import { FiUpload, FiFile, FiTrash2, FiEye, FiX } from 'react-icons/fi';
import { deletePDFService } from '../../services/deletePDFService';
import type { DeletePDFResponse, DeletePageItem } from '../../types/deletePDF';
import type { PDFInfo } from '../../types/common';

interface DeletePDFProps {
  onDeleteComplete?: (result: DeletePDFResponse) => void;
}



const DeletePDF: React.FC<DeletePDFProps> = ({ onDeleteComplete }) => {
  const [document, setDocument] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'individual' | 'bulk'>('individual');
  const [selectedPages, setSelectedPages] = useState<DeletePageItem[]>([]);
  const [pageNumbers, setPageNumbers] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [showPagePreview, setShowPagePreview] = useState(true); // Default to true
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file');
      return;
    }

    setDocument(file);

    // Get PDF info
    try {
      const info = await deletePDFService.getPDFInfo(file);
      setPdfInfo(info);
      
      // Initialize page selections
      const pages: DeletePageItem[] = [];
      for (let i = 1; i <= info.pages; i++) {
        pages.push({
          id: i.toString(),
          pageNumber: i,
          isSelected: false
        });
      }
      setSelectedPages(pages);
    } catch (error) {
      console.error('Error getting PDF info:', error);
    }
  }, []);

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

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Remove document
  const removeDocument = () => {
    setDocument(null);
    setPdfInfo(null);
    setSelectedPages([]);
    setPageNumbers('');
    onDeleteComplete?.({
      success: false,
      message: 'Document removed'
    });
  };

  // Toggle page selection
  const togglePageSelection = (pageId: string) => {
    setSelectedPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, isSelected: !page.isSelected } : page
    ));
  };

  // Select all pages
  const selectAllPages = () => {
    setSelectedPages(prev => prev.map(page => ({ ...page, isSelected: true })));
  };

  // Deselect all pages
  const deselectAllPages = () => {
    setSelectedPages(prev => prev.map(page => ({ ...page, isSelected: false })));
  };

  // Parse page numbers from text input
  const parsePageNumbers = (input: string): number[] => {
    const pages: number[] = [];
    const parts = input.split(',').map(p => p.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(p => parseInt(p.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= (pdfInfo?.pages || 0)) {
              pages.push(i);
            }
          }
        }
      } else {
        const page = parseInt(part);
        if (!isNaN(page) && page >= 1 && page <= (pdfInfo?.pages || 0)) {
          pages.push(page);
        }
      }
    }
    
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  // Delete PDF pages
  const handleDelete = async () => {
    if (!document) return;

    let pagesToDelete: number[];

    if (deleteMode === 'individual') {
      pagesToDelete = selectedPages.filter(p => p.isSelected).map(p => p.pageNumber);
    } else {
      pagesToDelete = parsePageNumbers(pageNumbers);
    }

    if (pagesToDelete.length === 0) {
      alert('Please select at least one page to delete');
      return;
    }

    setDeleting(true);
    try {
      const result = await deletePDFService.deletePDF({
        file: document,
        pagesToDelete: pagesToDelete
      });

      onDeleteComplete?.(result);
    } catch (error) {
      console.error('Error deleting PDF pages:', error);
      onDeleteComplete?.({
        success: false,
        error: 'Failed to delete PDF pages'
      });
    } finally {
      setDeleting(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Generate mock page preview (in a real app, you'd use a PDF rendering library)
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      {/* <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Delete PDF Pages</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Remove unwanted pages from your PDF documents. Choose individual pages or specify ranges for bulk deletion.
        </p>
      </div> */}

      {/* File Upload Section */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload PDF Document</h2>
        
        {!document ? (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 mb-2">
              Drag and drop your PDF here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                browse files
              </button>
            </p>
            <p className="text-sm text-gray-500">Maximum file size: 100MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FiFile className="h-8 w-8 text-red-500" />
                <div>
                  <h3 className="font-medium text-gray-900">{document.name}</h3>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(document.size)} • {pdfInfo?.pages || 'Unknown'} pages
                  </p>
                </div>
              </div>
              <button
                onClick={removeDocument}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiTrash2 className="h-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Page Preview Section - Always visible when PDF is loaded */}
      {document && pdfInfo && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Page Preview & Selection</h2>
            <button
              onClick={() => setShowPagePreview(!showPagePreview)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              {showPagePreview ? <FiX className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              <span>{showPagePreview ? 'Hide' : 'Show'} Preview</span>
            </button>
          </div>

          {showPagePreview && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedPages.map((page) => (
                  <div key={page.id} className="relative">
                    {/* Page Preview Card */}
                    <div className={`border-2 rounded-lg p-3 transition-all cursor-pointer ${
                      page.isSelected
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                      {/* Page Preview */}
                      {generatePagePreview(page.pageNumber)}
                      
                      {/* Page Number Label */}
                      <div className="text-center mt-2">
                        <span className={`text-sm font-medium ${
                          page.isSelected ? 'text-red-700' : 'text-gray-700'
                        }`}>
                          Page {page.pageNumber}
                        </span>
                      </div>
                      
                      {/* Selection Indicator */}
                      {page.isSelected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <FiX className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Click to select/deselect */}
                    <button
                      onClick={() => togglePageSelection(page.id)}
                      className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 transition-opacity"
                      aria-label={`${page.isSelected ? 'Deselect' : 'Select'} page ${page.pageNumber}`}
                    />
                  </div>
                ))}
              </div>
              
              {/* Selection Summary */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-800">
                      Selected: <span className="font-semibold">{selectedPages.filter(p => p.isSelected).length}</span> pages
                    </p>
                    <p className="text-sm text-blue-600">
                      Pages to delete: {selectedPages.filter(p => p.isSelected).map(p => p.pageNumber).join(', ') || 'None'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllPages}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllPages}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Options Section */}
      {document && pdfInfo && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Delete Options</h2>
          
          {/* Delete Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Deletion Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { value: 'individual', label: 'Individual Selection', desc: 'Click to select specific pages' },
                { value: 'bulk', label: 'Bulk Range', desc: 'Enter page ranges (e.g., 1-5, 7, 9-12)' }
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setDeleteMode(mode.value as any)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    deleteMode === mode.value
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{mode.label}</div>
                  <div className="text-sm text-gray-500">{mode.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mode-specific inputs */}
          {deleteMode === 'bulk' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Numbers to Delete
              </label>
              <input
                type="text"
                value={pageNumbers}
                onChange={(e) => setPageNumbers(e.target.value)}
                placeholder="e.g., 1-5, 7, 9-12"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter page numbers separated by commas. Use ranges like "5-7" for consecutive pages.
              </p>
              {pageNumbers && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Pages to delete: {parsePageNumbers(pageNumbers).join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={deleting || (deleteMode === 'individual' && selectedPages.filter(p => p.isSelected).length === 0)}
            className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Deleting Pages...
              </>
            ) : (
              <>
                <FiTrash2 className="h-4 w-4 mr-3" />
                Delete Selected Pages
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DeletePDF;
