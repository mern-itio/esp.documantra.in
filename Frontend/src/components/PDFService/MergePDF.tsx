import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  Download,
  X,
  GripVertical,
  Info,
  Loader2,
} from 'lucide-react';
import { mergePDFService } from '../../services/mergePDFService';
import SuccessBox from '../common/SuccessBox';

// Type declarations for PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface PDFDocument {
  id: string;
  file: File;
  name: string;
  size: number;
  pages: number;
  preview?: string;
  firstPagePreview?: string;
  isProcessing?: boolean;
  error?: string;
}

interface MergePDFProps {
  onMergeComplete?: (mergedFile: File) => void;
}

const MergePDF: React.FC<MergePDFProps> = ({ onMergeComplete }) => {
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [mergeResult, setMergeResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize PDF.js worker
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

  // Calculate totals when documents change
  React.useEffect(() => {
    const size = documents.reduce((sum, doc) => sum + doc.size, 0);
    const pages = documents.reduce((sum, doc) => sum + doc.pages, 0);
    setTotalSize(size);
    setTotalPages(pages);
  }, [documents]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateFirstPagePreview = async (file: File): Promise<string> => {
    try {
      const pdfjsLib = await loadPDFJS();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Get the first page
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 }); // Higher scale for better quality
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');
      
      // Set canvas size for high DPI displays
      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = viewport.width * devicePixelRatio;
      canvas.height = viewport.height * devicePixelRatio;
      
      // Scale the context to match the device pixel ratio
      context.scale(devicePixelRatio, devicePixelRatio);
      
      // Set the display size (CSS size)
      canvas.style.width = viewport.width + 'px';
      canvas.style.height = viewport.height + 'px';
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      return canvas.toDataURL();
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      // Fallback to a simple placeholder
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.width = 200 * devicePixelRatio;
      canvas.height = 280 * devicePixelRatio;
      
      if (ctx) {
        ctx.scale(devicePixelRatio, devicePixelRatio);
        canvas.style.width = '200px';
        canvas.style.height = '280px';
        
        // Create a simple PDF-like preview
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, 200, 280);
        
        // Add some content lines
        ctx.fillStyle = '#6c757d';
        ctx.font = '12px Arial';
        ctx.fillText('PDF Document', 20, 30);
        
        // Add some lines to simulate text
        for (let i = 0; i < 8; i++) {
          ctx.fillRect(20, 50 + i * 20, 160, 1);
        }
        
        // Add page number
        ctx.fillStyle = '#adb5bd';
        ctx.font = '10px Arial';
        ctx.fillText('Page 1', 20, canvas.height - 20);
      }
      
      return canvas.toDataURL();
    }
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    // Filter for PDF files only
    const pdfFiles = Array.from(files).filter(file =>
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length !== files.length) {
      alert('Some files were skipped. Only PDF files are supported.');
    }

    if (pdfFiles.length === 0) return;

    // Check file size limits (5MB per file, 25MB total)
    const maxFileSize = 5 * 1024 * 1024; // 5 MB

    // (optional) adjust total size if needed
    const maxTotalSize = 25 * 1024 * 1024;

    const oversizedFiles = pdfFiles.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      alert(`Some files are too large. Maximum file size is 5MB. Skipped: ${oversizedFiles.map(f => f.name).join(', ')}`);
    }

    const validFiles = pdfFiles.filter(file => file.size <= maxFileSize);
    if (validFiles.length === 0) return;

    const currentTotalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
    const newTotalSize = currentTotalSize + validFiles.reduce((sum, file) => sum + file.size, 0);

    if (newTotalSize > maxTotalSize) {
      alert('Total file size would exceed 500MB limit. Please remove some files first.');
      return;
    }

    const newDocuments: PDFDocument[] = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      name: file.name,
      size: file.size,
      pages: 0, // Will be updated when PDF is processed
      isProcessing: true
    }));

    setDocuments(prev => [...prev, ...newDocuments]);

    // Process each PDF to get actual page count, validation, and preview
    for (const doc of newDocuments) {
      try {
        const pdfInfo = await mergePDFService.getPDFInfo(doc.file);
        const validation = await mergePDFService.validatePDF(doc.file);
        const firstPagePreview = await generateFirstPagePreview(doc.file);

        setDocuments(prev => prev.map(d =>
          d.id === doc.id
            ? {
              ...d,
              pages: pdfInfo.pages,
              firstPagePreview,
              isProcessing: false,
              error: validation.isValid ? undefined : validation.error
            }
            : d
        ));
      } catch (error) {
        setDocuments(prev => prev.map(d =>
          d.id === doc.id
            ? { ...d, isProcessing: false, error: 'Failed to process PDF' }
            : d
        ));
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  const removeDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  }, []);

  const resetToStart = useCallback(() => {
    setDocuments([]);
    setMergeResult(null);
    setTotalSize(0);
    setTotalPages(0);
    setMergeProgress(0);
    setIsMerging(false);
  }, []);

  const moveDocument = useCallback((fromIndex: number, toIndex: number) => {
    setDocuments(prev => {
      const newDocs = [...prev];
      const [movedDoc] = newDocs.splice(fromIndex, 1);
      newDocs.splice(toIndex, 0, movedDoc);
      return newDocs;
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOverItem = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDropItem = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== dropIndex) {
      moveDocument(dragIndex, dropIndex);
    }
    setDragOverIndex(null);
  }, [moveDocument]);

  const handleMerge = async () => {
    if (documents.length < 2) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }

    setIsMerging(true);
    setMergeProgress(0);
    setShowWarning(false);

    try {
      // Prepare the merge request
      const orderedFilenames = documents.map(doc => doc.file.name);
      const files = documents.map(doc => doc.file);

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setMergeProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Call the merge service
      const result = await mergePDFService.mergePDFs({
        files,
        orderedFilenames,
        options: {
          addBookmarks: true,
          optimizeSize: true
        }
      });

      clearInterval(progressInterval);
      setMergeProgress(100);

      if (result.success && result.mergedFile) {
        // Create a File object from the blob for the callback
        const response = await fetch(result.mergedFile.downloadUrl);
        const blob = await response.blob();
        const mergedFile = new File([blob], result.mergedFile.filename, { type: 'application/pdf' });

        setMergeResult({
          success: true,
          mergedFile: result.mergedFile,
          totalFiles: documents.length,
          totalPages: totalPages,
          totalSize: totalSize
        });

        setTimeout(() => {
          setIsMerging(false);
          onMergeComplete?.(mergedFile);
        }, 500);
      } else {
        throw new Error(result.error || 'Failed to merge PDFs');
      }
    } catch (error: any) {
      setIsMerging(false);
      setMergeProgress(0);
      console.error('Merge error:', error);
      // You could add error handling here, like showing a toast notification
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const downloadMergedFile = async () => {
    if (!mergeResult?.mergedFile?.downloadUrl) {
      console.error('No merged file available for download');
      alert('No merged file available for download');
      return;
    }
    
    try {
      const response = await fetch(mergeResult.mergedFile.downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mergeResult.mergedFile.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download merged file: ' + (error as Error).message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Show success box only when merge is successful */}
      {mergeResult && mergeResult.success ? (
        <SuccessBox
          title="Merge PDF"
          subtitle="Combine multiple PDF files into one"
          message="PDFs Merged Successfully!"
          fileInfo={mergeResult.mergedFile ? {
            filename: mergeResult.mergedFile.filename,
            size: mergeResult.totalSize,
            totalFiles: mergeResult.totalFiles,
            totalPages: mergeResult.totalPages
          } : undefined}
          actions={{
            primary: {
              label: "Download Merged PDF",
              onClick: downloadMergedFile,
              disabled: !mergeResult?.mergedFile?.downloadUrl
            },
            secondary: {
              label: "Merge More PDFs",
              onClick: resetToStart
            }
          }}
        />
      ) : (
        <>
          {/* File Upload Area - Only show when less than 2 documents */}
      {documents.length < 2 && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {documents.length === 0 
              ? 'Drop PDF files here or click to browse'
              : 'Add more PDF files to merge'
            }
          </h3>
          <p className="text-gray-500 mb-4">
            {documents.length === 0 
              ? 'Select multiple PDF files to merge together'
              : 'Upload at least one more PDF to start merging'
            }
          </p>
          <button
            onClick={openFileDialog}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {documents.length === 0 ? 'Choose Files' : 'Add More Files'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* File Info Section - Show when 2 or more documents */}
      {documents.length >= 2 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Info className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">Ready to Merge</h3>
                <p className="text-sm text-green-700">
                  {documents.length} PDF files ready for merging
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-600 font-medium">
                {formatFileSize(totalSize)} • {totalPages} pages
              </div>
            </div>
          </div>
          
          {/* Add More Files Button */}
          <div className="flex justify-center">
            <button
              onClick={openFileDialog}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Add More Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Summary Info - Matching the image design */}
      {documents.length > 0 && (
        <div className="flex items-center justify-center">
          <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center space-x-2">
            <Info className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">
              {formatFileSize(totalSize)} - {totalPages} pages
            </span>
          </div>
        </div>
      )}

      {/* Document Cards - Matching the image layout exactly */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 text-center">Document Order</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {documents.map((doc, index) => (
              <div
                key={doc.id}
                className={`bg-white rounded-xl border border-gray-200 p-4 transition-all duration-200 hover:shadow-md ${dragOverIndex === index ? 'border-blue-400 shadow-lg' : ''
                  }`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOverItem(e, index)}
                onDrop={(e) => handleDropItem(e, index)}
              >
                <div className="relative">
                  {/* Document Preview Thumbnail */}
                  <div className="w-full h-48 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center relative overflow-hidden">
                    {doc.isProcessing ? (
                      <div className="flex flex-col items-center space-y-2">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <span className="text-xs text-gray-500">Processing...</span>
                      </div>
                    ) : doc.firstPagePreview ? (
                      <img 
                        src={doc.firstPagePreview} 
                        alt="PDF Preview" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <>
                        {/* PDF Preview Background */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-6xl text-gray-200 font-bold">D</div>
                        </div>

                        {/* Oltio Logo */}
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          Oltio
                        </div>

                        {/* Orange Highlight Circle */}
                        <div className="absolute bottom-4 right-4 w-3 h-3 bg-orange-400 rounded-full"></div>

                        {/* Left Side Lines */}
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 space-y-1">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="w-8 h-1 bg-blue-600 rounded"></div>
                          ))}
                        </div>

                        {/* Right Side Text Lines */}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 space-y-1 text-right">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="w-16 h-1 bg-gray-300 rounded"></div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Icons - Top Right */}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-600 hover:text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Document Info */}
                <div className="mt-3 text-center">
                  <h4 className="font-medium text-gray-900 text-sm truncate">
                    {doc.name}
                  </h4>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatFileSize(doc.size)} • {doc.pages} page{doc.pages !== 1 ? 's' : ''}
                  </div>
                  {doc.error && (
                    <div className="text-xs text-red-600 mt-1">{doc.error}</div>
                  )}
                </div>

                {/* Drag Handle */}
                <div className="absolute top-2 left-2">
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Message */}
      {showWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Info className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">
              Please upload at least 2 PDF files to merge
            </span>
          </div>
        </div>
      )}

      {/* Merge Button */}
      {documents.length >= 2 && documents.every(doc => !doc.error && !doc.isProcessing) && (
        <div className="text-center">
          <button
            onClick={handleMerge}
            disabled={isMerging}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
          >
            {isMerging ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Merging PDFs...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Merge PDFs</span>
              </>
            )}
          </button>

          {/* Progress Bar */}
          {isMerging && (
            <div className="mt-4 max-w-md mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${mergeProgress}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-2">{mergeProgress}% complete</div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {documents.length === 0 && (
        <div className="text-center text-gray-500">
          <p>Upload at least 2 PDF files to get started</p>
          <p className="text-sm mt-1">Drag and drop to reorder documents after upload</p>
          <div className="mt-4 text-xs text-gray-400">
            <p>• Maximum file size: 5MB per file</p>
            <p>• Maximum total size: 25MB</p>
            <p>• Only PDF files are supported</p>
          </div>
        </div>
      )}

      {/* Single File Instructions */}
      {documents.length === 1 && (
        <div className="text-center text-gray-500">
          <p>Upload one more PDF file to start merging</p>
          <p className="text-sm mt-1">Drag and drop to reorder documents after upload</p>
        </div>
      )}

          {/* Error Summary */}
          {documents.some(doc => doc.error) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">Some files have errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {documents.filter(doc => doc.error).map(doc => (
                  <li key={doc.id}>• {doc.name}: {doc.error}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MergePDF;
