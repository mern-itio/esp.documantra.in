import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FiUpload, FiFile, FiTrash2, FiEye, FiX } from 'react-icons/fi';
import { deletePDFService } from '../../services/deletePDFService';
import type { DeletePDFResponse, DeletePageItem } from '../../types/deletePDF';
import type { PDFInfo } from '../../types/common';
import SuccessBox from '../common/SuccessBox';
import { useLocation } from 'react-router-dom';

// Type declarations for PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface DeletePDFProps {
  onDeleteComplete?: (result: DeletePDFResponse) => void;
}



const DeletePDF: React.FC<DeletePDFProps> = ({ onDeleteComplete }) => {
  const location = useLocation();
  const isLandingRoute = location.pathname === '/delete-pages';
  const headingTitle = isLandingRoute ? 'Remove pages' : 'Delete PDF Pages';
  const headingSubtitle = isLandingRoute
    ? 'Remove specific pages from your PDF document.'
    : 'Remove specific pages from your PDF documents';
  const [document, setDocument] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'individual' | 'bulk'>('individual');
  const [selectedPages, setSelectedPages] = useState<DeletePageItem[]>([]);
  const [pageNumbers, setPageNumbers] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [showPagePreview, setShowPagePreview] = useState(true); // Default to true
  const [pdfThumbnails, setPdfThumbnails] = useState<string[]>([]);
  const [deleteResult, setDeleteResult] = useState<DeletePDFResponse | null>(null);
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

    // Get PDF info and generate thumbnails
    try {
      const [info, thumbnails] = await Promise.all([
        deletePDFService.getPDFInfo(file),
        generatePDFThumbnails(file)
      ]);
      
      setPdfInfo(info);
      setPdfThumbnails(thumbnails);
      
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
      console.error('Error processing PDF:', error);
    }
  }, [generatePDFThumbnails]);

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
    setPdfThumbnails([]);
    setDeleteResult(null);
    onDeleteComplete?.({
      success: false,
      message: 'Document removed'
    });
  };

  const resetToStart = () => {
    setDocument(null);
    setPdfInfo(null);
    setSelectedPages([]);
    setPageNumbers('');
    setPdfThumbnails([]);
    setDeleteResult(null);
    setDeleting(false);
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

      setDeleteResult(result);
      onDeleteComplete?.(result);
    } catch (error) {
      console.error('Error deleting PDF pages:', error);
      const errorResult = {
        success: false,
        error: 'Failed to delete PDF pages'
      };
      setDeleteResult(errorResult);
      onDeleteComplete?.(errorResult);
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

  // Download deleted PDF
  const handleDownload = async () => {
    if (!deleteResult?.file) {
      console.error('No deleted file available for download');
      alert('No deleted file available for download');
      return;
    }

    try {
      // Use the service method for consistent download behavior
      await deletePDFService.downloadDeletedPDF(
        deleteResult.downloadUrl || '', 
        deleteResult.file.filename
      );
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  // Generate real PDF page preview
  const generatePagePreview = (pageNumber: number) => {
    const thumbnailIndex = pageNumber - 1; // Convert to 0-based index
    const thumbnail = pdfThumbnails[thumbnailIndex];
    
    if (thumbnail) {
      return (
        <div className="w-full h-40 rounded-lg overflow-hidden border border-border bg-background">
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
      <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-semibold mb-1">Page {pageNumber}</div>
          <div className="text-xs">Loading preview...</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {isLandingRoute && (
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900">{headingTitle}</h2>
          <p className="text-gray-600 mt-2">{headingSubtitle}</p>
        </div>
      )}
      {/* Show success box only when delete is successful */}
      {deleteResult && deleteResult.success ? (
        <SuccessBox
          title={headingTitle}
          subtitle={headingSubtitle}
          message="Pages Deleted Successfully!"
          fileInfo={deleteResult.file ? {
            filename: deleteResult.file.filename,
            size: deleteResult.file.size,
            remainingPages: deleteResult.remainingPages || 0
          } : undefined}
          actions={{
            primary: {
              label: "Download Updated PDF",
              onClick: handleDownload,
              disabled: !deleteResult?.file
            },
            secondary: {
              label: "Delete More Pages",
              onClick: resetToStart
            }
          }}
        />
      ) : (
        <>
          {/* File Upload Section */}
      <div className="bg-background rounded-xl shadow-lg ">
        {/* <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload PDF Document</h2> */}
        
        {!document ? (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-border hover:border-primary'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg text-muted-foreground mb-2">
              Drag and drop your PDF here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:text-primary/80 font-medium"
              >
                browse files
              </button>
            </p>
            <p className="text-sm text-muted-foreground">Maximum file size: 2MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="bg-card rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FiFile className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-medium text-foreground">{document.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(document.size)} • {pdfInfo?.pages || 'Unknown'} pages
                  </p>
                </div>
              </div>
              <button
                onClick={removeDocument}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <FiTrash2 className="h-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Page Preview Section - Always visible when PDF is loaded */}
      {document && pdfInfo && (
        <div className="bg-background rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Page Preview & Selection</h2>
            <button
              onClick={() => setShowPagePreview(!showPagePreview)}
              className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
            >
              {showPagePreview ? <FiX className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              <span>{showPagePreview ? 'Hide' : 'Show'} Preview</span>
            </button>
          </div>

          {showPagePreview && (
            <div className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {selectedPages.map((page) => (
                  <div key={page.id} className="relative">
                    {/* Page Preview Card */}
                    <div className={`border-2 rounded-lg p-2 transition-all cursor-pointer ${
                      page.isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background hover:border-primary'
                    }`}>
                      {/* Page Preview */}
                      {generatePagePreview(page.pageNumber)}
                      
                      {/* Page Number Label */}
                      <div className="text-center mt-1">
                        <span className={`text-xs font-medium ${
                          page.isSelected ? 'text-primary' : 'text-foreground'
                        }`}>
                          Page {page.pageNumber}
                        </span>
                      </div>
                      
                      {/* Selection Indicator */}
                      {page.isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <FiX className="w-3 h-3 text-white" />
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
              <div className="mt-6 p-4 bg-background rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">
                      Selected: <span className="font-semibold">{selectedPages.filter(p => p.isSelected).length}</span> pages
                    </p>
                    <p className="text-sm text-foreground">
                      Pages to delete: {selectedPages.filter(p => p.isSelected).map(p => p.pageNumber).join(', ') || 'None'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllPages}
                      className="px-3 py-1 text-sm bg-primary text-foreground rounded-md hover:bg-primary/80 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllPages}
                      className="px-3 py-1 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
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
        <div className="bg-card rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Delete Options</h2>
          
          {/* Delete Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
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
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <div className="font-medium text-foreground">{mode.label}</div>
                  <div className="text-sm text-muted-foreground">{mode.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mode-specific inputs */}
          {deleteMode === 'bulk' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Page Numbers to Delete
              </label>
              <input
                type="text"
                value={pageNumbers}
                onChange={(e) => setPageNumbers(e.target.value)}
                placeholder="e.g., 1-5, 7, 9-12"
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Enter page numbers separated by commas. Use ranges like "5-7" for consecutive pages.
              </p>
              {pageNumbers && (
                <div className="mt-3 p-3 bg-background rounded-lg">
                  <p className="text-sm text-foreground">
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
            className="w-full bg-primary text-foreground py-4 px-6 rounded-lg font-medium text-lg hover:bg-primary/80 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {deleting ? (
              <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground mr-3"></div>
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
        </>
      )}
    </div>
  );
};

export default DeletePDF;
