import React, { useState, useCallback, useRef, useEffect } from 'react';
import { insertPDFService } from '../../services/insertPDFService';
import type { InsertPDFResponse } from '../../types/insertPDF';
import { PAGE_SIZE_OPTIONS } from '../../types/insertPDF';
import SuccessBox from '../common/SuccessBox';
import { FiUpload, FiPlus, FiX } from 'react-icons/fi';

// Type declarations for PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface InsertPDFProps {
  onInsertResult: (result: InsertPDFResponse) => void;
}

interface PDFPage {
  id: string;
  pageNumber: number;
  documentIndex: number;
  documentName: string;
  thumbnail: string;
  originalPageNumber: number;
}

const InsertPDF: React.FC<InsertPDFProps> = ({ onInsertResult }) => {
  const [pdfPages, setPdfPages] = useState<PDFPage[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [draggedPage, setDraggedPage] = useState<PDFPage | null>(null);
  const [insertResult, setInsertResult] = useState<InsertPDFResponse | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Process PDF file and generate thumbnails
  const processPDF = useCallback(async (file: File, documentIndex: number) => {
    try {
      const pdfjsLib = await loadPDFJS();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const newPages: PDFPage[] = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.3 }); // Small thumbnails
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        newPages.push({
          id: `${documentIndex}-${pageNum}-${Date.now()}`,
          pageNumber: pdfPages.length + pageNum,
          documentIndex,
          documentName: file.name,
          thumbnail: canvas.toDataURL(),
          originalPageNumber: pageNum
        });
      }
      
      return newPages;
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  }, [loadPDFJS, pdfPages.length]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file');
      return;
    }

    try {
      const documentIndex = documents.length;
      const newPages = await processPDF(file, documentIndex);
      
      setDocuments(prev => [...prev, file]);
      setPdfPages(prev => [...prev, ...newPages]);
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Failed to process PDF file');
    }
  }, [documents.length, processPDF]);

  // Handle drag and drop for files
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
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  // Handle file input
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  // Drag and drop for page reordering
  const handlePageDragStart = useCallback((e: React.DragEvent, page: PDFPage) => {
    setDraggedPage(page);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handlePageDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handlePageDrop = useCallback((e: React.DragEvent, targetPage: PDFPage) => {
    e.preventDefault();
    
    if (!draggedPage || draggedPage.id === targetPage.id) return;
    
    setPdfPages(prev => {
      const pages = [...prev];
      const draggedIndex = pages.findIndex(p => p.id === draggedPage.id);
      const targetIndex = pages.findIndex(p => p.id === targetPage.id);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [draggedItem] = pages.splice(draggedIndex, 1);
        pages.splice(targetIndex, 0, draggedItem);
        
        // Update page numbers
        return pages.map((page, index) => ({
          ...page,
          pageNumber: index + 1
        }));
      }
      
      return pages;
    });
    
    setDraggedPage(null);
  }, [draggedPage]);

  // Remove page
  const removePage = useCallback((pageId: string) => {
    setPdfPages(prev => {
      const filtered = prev.filter(p => p.id !== pageId);
      // Update page numbers for remaining pages
      return filtered.map((page, index) => ({
        ...page,
        pageNumber: index + 1
      }));
    });
  }, []);

  // Insert blank page
  const insertBlankPage = useCallback(() => {
    const newBlankPage: PDFPage = {
      id: `blank-${Date.now()}`,
      pageNumber: pdfPages.length + 1,
      documentIndex: -1, // -1 indicates it's a blank page
      documentName: 'Blank Page',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjZGRkIiBzdHJva2UtZGFzaGFycmF5PSI1LDUiLz4KPHN2ZyB4PSIxMDAiIHk9IjE0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5Ij4KQmxhbmsgUGFnZQo8L3N2Zz4KPC9zdmc+',
      originalPageNumber: pdfPages.length + 1
    };
    
    setPdfPages(prev => [...prev, newBlankPage]);
  }, [pdfPages.length]);

  // Reset to start
  const resetToStart = useCallback(() => {
    setPdfPages([]);
    setDocuments([]);
    setProcessing(false);
    setDragActive(false);
    setDraggedPage(null);
    setInsertResult(null);
  }, []);

  

  // Download processed PDF
  const handleDownload = async () => {
    if (!insertResult?.file) {
      console.error('No processed file available for download');
      alert('No processed file available for download');
      return;
    }

    try {
      if (insertResult.downloadUrl) {
        await insertPDFService.downloadInsertedPDF(insertResult.downloadUrl, insertResult.file.filename);
      } else {
        console.log('Download URL not available');
        alert('Download URL not available');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  // Process final document
  const handleProcess = useCallback(async () => {
    if (pdfPages.length === 0) return;
    
    setProcessing(true);
    try {
      let result: InsertPDFResponse;
      
      // Debug logging to see what we're working with
      console.log('Processing document:', {
        totalPages: pdfPages.length,
        documentsCount: documents.length,
        documentIndices: pdfPages.map(p => p.documentIndex),
        allFromSameDocument: pdfPages.every(page => page.documentIndex === pdfPages[0].documentIndex),
        hasBlankPages: pdfPages.some(page => page.documentIndex === -1),
        documents: documents.map(d => d.name),
        pageDetails: pdfPages.map(p => ({
          id: p.id,
          pageNumber: p.pageNumber,
          originalPageNumber: p.originalPageNumber,
          documentIndex: p.documentIndex,
          documentName: p.documentName
        }))
      });
      
      const hasBlankPages = pdfPages.some(page => page.documentIndex === -1);
      if (documents.length === 1 && !hasBlankPages) {
        console.log('Single document detected with no blank pages, using reorder endpoint');
        // Ensure we have valid page numbers and filter out any invalid ones
        const pageOrder = pdfPages
          .filter(page => page.originalPageNumber > 0 && page.originalPageNumber <= pdfPages.length)
          .map(page => page.originalPageNumber - 1);
        
        console.log('Page order for reorder:', pageOrder);
        
        // Validate page order array
        if (pageOrder.length === 0 || pageOrder.some(pageNum => pageNum < 0)) {
          console.warn('Invalid page order generated, falling back to insert approach');
          // Fallback: treat as a single document with no changes
          const insertions = pdfPages.map((page, index) => {
            if (page.documentIndex === 0) {
              return null;
            }
            return {
              type: 'import' as const,
              position: index + 1,
              sourceDocumentIndex: 0,
              sourcePageIndex: page.originalPageNumber - 1
            };
          }).filter((item): item is NonNullable<typeof item> => item !== null);
          
          const request = {
            mainDocument: documents[0],
            sourceDocuments: [],
            insertions: insertions
          };
          
          result = await insertPDFService.insertPDF(request);
        } else {
          result = await insertPDFService.reorderPDF(documents[0], pageOrder);
        }
      } else {
        const insertions = pdfPages.map((page, index) => {
          if (page.documentIndex === 0) {
            return null;
          } else if (page.documentIndex === -1) {
            return {
              type: 'blank' as const,
              position: index + 1,
              blankPageSize: PAGE_SIZE_OPTIONS.find(option => option.name === 'A4') || PAGE_SIZE_OPTIONS[0]
            };
          } else {
            const sourceDocumentIndex = page.documentIndex - 1; 
            if (sourceDocumentIndex < 0 || sourceDocumentIndex >= documents.length - 1) {
              console.error(`Invalid sourceDocumentIndex: ${sourceDocumentIndex} for page ${page.pageNumber}`);
              throw new Error(`Invalid source document index: ${sourceDocumentIndex}`);
            }

            return {
              type: 'import' as const,
              position: index + 1,
              sourceDocumentIndex: sourceDocumentIndex,
              sourcePageIndex: page.originalPageNumber - 1
            };
          }
        }).filter((item): item is NonNullable<typeof item> => item !== null);
        
        if (insertions.length === 0) {
          const mainDocPages = pdfPages.filter(page => page.documentIndex === 0);
          const pageOrder = mainDocPages.map(page => page.originalPageNumber - 1);
          result = await insertPDFService.reorderPDF(documents[0], pageOrder);
        } else {
          const request = {
            mainDocument: documents[0],
            sourceDocuments: documents.slice(1),
            insertions: insertions
          };         
          
          result = await insertPDFService.insertPDF(request);
        }
      }
      
      setInsertResult(result);
      onInsertResult(result);
    } catch (error) {
      console.error('Error processing document:', error);
      const errorResult = {
        success: false,
        error: 'Failed to process document',
        message: (error as Error).message,
      };
      setInsertResult(errorResult);
      onInsertResult(errorResult);
    } finally {
      setProcessing(false);
    }
  }, [pdfPages, documents, onInsertResult]);

  // Show success message if processing was successful
  if (insertResult && insertResult.success) {
    return (
      <SuccessBox
        title="Insert PDF"
        subtitle="Insert pages from other PDFs into your document"
        message="PDF Processed Successfully!"
        fileInfo={insertResult.file ? {
          filename: insertResult.file.filename,
          size: insertResult.file.size,
          insertions: insertResult.insertions?.length || 0
        } : undefined}
        actions={{
          primary: {
            label: "Download Processed PDF",
            onClick: handleDownload,
            disabled: !insertResult?.file
          },
          secondary: {
            label: "Process More PDFs",
            onClick: resetToStart
          }
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {pdfPages.length === 0 && (
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
            Drop your first PDF here or click to browse
          </h3>
          <p className="text-gray-600 mb-2 text-lg">
            Upload a PDF to get started
          </p>
                 <p className="text-sm text-gray-500 mb-6">Maximum file size: 2MB</p>
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

      {pdfPages.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              PDF Pages ({pdfPages.length})
            </h2>
            <div className="flex gap-3">
              <button
                onClick={insertBlankPage}
                className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                style={{cursor: 'pointer'}}
                title="Insert blank page at the end"
              >
                <FiPlus className="w-4 h-4" />
                <span className="text-sm font-medium">Blank Page</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors flex items-center justify-center"
                style={{cursor: 'pointer'}}
                title="Add more PDF files"
              >
                <FiPlus className="w-6 h-6" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Pages Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {pdfPages.map((page) => (
              <div
                key={page.id}
                className="relative group"
                draggable
                onDragStart={(e) => handlePageDragStart(e, page)}
                onDragOver={handlePageDragOver}
                onDrop={(e) => handlePageDrop(e, page)}
              >
                {/* Page Card */}
                <div className={`border-2 rounded-lg p-3 bg-white hover:border-pink-400 transition-colors cursor-move ${
                  page.documentIndex === -1 
                    ? 'border-dashed border-gray-400 bg-gray-50' 
                    : 'border-pink-300'
                }`}>
                  {/* Page Preview */}
                  <div className="relative mb-2">
                    <img
                      src={page.thumbnail}
                      alt={`Page ${page.pageNumber}`}
                      className="w-full h-auto rounded border border-gray-200"
                    />
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removePage(page.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      style={{cursor: 'pointer'}}
                      title="Remove page"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Page Number */}
                  <div className="text-center">
                    <span className={`text-lg font-bold ${
                      page.documentIndex === -1 ? 'text-gray-500' : 'text-gray-900'
                    }`}>
                      {page.pageNumber}
                    </span>
                  </div>
                  
                  {/* Document Info */}
                  <div className={`text-xs text-center mt-1 truncate ${
                    page.documentIndex === -1 ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {page.documentName}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Process Button */}
          <div className="text-center pt-6">
            <button
              onClick={handleProcess}
              disabled={processing}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg font-medium text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              style={{cursor: 'pointer'}}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3 inline-block"></div>
                  Processing...
                </>
              ) : (
                'Process Document'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default InsertPDF;
