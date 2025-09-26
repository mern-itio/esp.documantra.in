import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FiUpload,
  FiFile,
  FiScissors,
  FiX,
  FiCheck,
  FiEye,
} from 'react-icons/fi';
import { extractPDFService } from '../../services/extractPDFService';
import type { ExtractPDFResponse } from '../../types/extractPDF';
import type { PDFInfo } from '../../types/common';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SuccessBox from '../common/SuccessBox';

// Extend window interface for PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface ExtractPDFProps {
  onExtractComplete?: (result: ExtractPDFResponse) => void;
}

const ExtractPDF: React.FC<ExtractPDFProps> = ({ onExtractComplete }) => {
  const [document, setDocument] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PDFInfo | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractMode, setExtractMode] = useState<'pages' | 'range'>('pages');
  const [pageNumbers, setPageNumbers] = useState<string>('');
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);
  // const [extractResult, setExtractResult] = useState<ExtractPDFResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const [extractResult, setExtractResult] = useState<ExtractPDFResponse | null>(null);
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

  // Generate page thumbnails using PDF.js
  const generatePageThumbnails = useCallback(async (file: File, pageCount: number) => {
    setLoadingThumbnails(true);
    try {
      const pdfjsLib = await loadPDFJS();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const thumbnails: string[] = [];
      const maxPages = Math.min(pageCount, 20); // Limit to first 20 pages for performance

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.5 }); // Medium scale for previews

          const canvas = window.document.createElement('canvas');
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
          thumbnails.push(canvas.toDataURL());
        } catch (error) {
          console.warn(`Failed to generate thumbnail for page ${pageNum}:`, error);
          thumbnails.push(''); // Add empty string as placeholder
        }
      }

      setPageThumbnails(thumbnails);
    } catch (error) {
      console.error('Error generating thumbnails:', error);
    } finally {
      setLoadingThumbnails(false);
    }
  }, [loadPDFJS]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file');
      return;
    }

    setDocument(file);
    // setExtractResult(null);
    setSelectedPages(new Set());
    setPageThumbnails([]);

    // Get PDF info
    try {
      const info = await extractPDFService.getPDFInfo(file);
      setPdfInfo(info);

      // Set default range values
      if (info.pages > 0) {
        setEndPage(info.pages);
        // Generate thumbnails
        await generatePageThumbnails(file, info.pages);
      }
    } catch (error) {
      console.error('Error getting PDF info:', error);
    }
  }, [generatePageThumbnails]);

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

  // Handle page selection
  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) {
        newSet.delete(pageNumber);
      } else {
        newSet.add(pageNumber);
      }
      return newSet;
    });
  };

  // Select all pages
  const selectAllPages = () => {
    if (pdfInfo) {
      const allPages = new Set(Array.from({ length: pdfInfo.pages }, (_, i) => i + 1));
      setSelectedPages(allPages);
    }
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedPages(new Set());
  };

  // Remove document and reset to upload state
  const removeDocument = () => {
    setDocument(null);
    setPdfInfo(null);
    setExtractResult(null);
    setPageNumbers('');
    setStartPage(1);
    setEndPage(1);
    setSelectedPages(new Set());
    setPageThumbnails([]);
    setLoadingThumbnails(false);
  };

  const resetToStart = () => {
    setDocument(null);
    setPdfInfo(null);
    setExtractResult(null);
    setPageNumbers('');
    setStartPage(1);
    setEndPage(1);
    setSelectedPages(new Set());
    setPageThumbnails([]);
    setLoadingThumbnails(false);
    setExtracting(false);
  };


  // Parse page numbers string (handles ranges like "1-3,5,7-9")
  const parsePageNumbers = (input: string): number[] => {
    if (!input.trim()) return [];

    const pages: number[] = [];
    const parts = input.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        // Handle range (e.g., "1-3")
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            pages.push(i);
          }
        }
      } else {
        // Handle single page (e.g., "5")
        const page = parseInt(part);
        if (!isNaN(page)) {
          pages.push(page);
        }
      }
    }

    // Remove duplicates and sort
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  // Extract PDF
  const handleExtract = async () => {
    if (!document) return;

    setExtracting(true);
    try {
      let result: ExtractPDFResponse;

      if (extractMode === 'pages') {
        let pages: number[];
        if (selectedPages.size > 0) {
          // Use selected pages from UI
          pages = Array.from(selectedPages).sort((a, b) => a - b);
        } else {
          // Fall back to parsing page numbers input
          pages = parsePageNumbers(pageNumbers);
        }
        console.log('Pages to extract:', pages);
        if (pages.length === 0) {
          alert('Please select pages to extract');
          return;
        }
        result = await extractPDFService.extractPages({
          file: document,
          pageNumbers: pages
        });
      } else if (extractMode === 'range') {
        if (startPage > endPage) {
          alert('Start page cannot be greater than end page');
          return;
        }
        result = await extractPDFService.extractRange({
          file: document,
          startPage,
          endPage
        });
      } else {
        throw new Error('Invalid extract mode');
      }

      setExtractResult(result);
      onExtractComplete?.(result);
    } catch (error) {
      console.error('Error extracting PDF:', error);
      const errorResult = {
        success: false,
        error: 'Failed to extract PDF'
      };
      setExtractResult(errorResult);
      onExtractComplete?.(errorResult);
    } finally {
      setExtracting(false);
    }
  };

  // Download extracted PDF
  const handleDownload = async () => {
    if (!extractResult?.file) {
      console.error('No extracted file available for download');
      alert('No extracted file available for download');
      return;
    }

    try {
      await extractPDFService.downloadExtractedPDF(
        extractResult.file.filename
      );
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

 

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Show success box only when extract is successful */}
        {extractResult && extractResult.success ? (
          <SuccessBox
            title="Extract PDF"
            subtitle="Extract specific pages from your PDF documents"
            message="PDF Extracted Successfully!"
            fileInfo={extractResult.file ? {
              filename: extractResult.file.filename,
              size: extractResult.file.size,
              extractedPages: extractResult.extractedPages?.length || 0
            } : undefined}
            actions={{
              primary: {
                label: "Download Extracted PDF",
                onClick: handleDownload,
                disabled: !extractResult?.file
              },
              secondary: {
                label: "Extract Another PDF",
                onClick: resetToStart
              }
            }}
            backUrl={`/pdf-tools${location.search}`}
          />
        ) : (
          <>
            {/* Header */}
            <div className="mb-8 bg-gray">
              <div className="flex items-center space-x-4 mb-4">
                <Link
                  to={`/pdf-tools${location.search}`}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                    <FiScissors className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Extract PDF</h1>
                    <p className="text-gray-600">Extract specific pages from your PDF documents</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Section - Full Width Initially */}
        {!document && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload PDF Document</h2>

            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
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
              <p className="text-sm text-gray-500">Maximum file size: 2MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>
        )}

       

        {/* Main Content - Two Pane Layout */}
        {document && pdfInfo && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Pane - Page Previews */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiEye className="w-5 h-5 mr-2" />
                  Page Preview
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={selectAllPages}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearAllSelections}
                    className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {loadingThumbnails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading page previews...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {Array.from({ length: pdfInfo.pages }, (_, i) => i + 1).map((pageNum) => (
                    <div
                      key={pageNum}
                      className={`relative cursor-pointer rounded-lg border-2 transition-all ${selectedPages.has(pageNum)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => togglePageSelection(pageNum)}
                    >
                      <div className="aspect-[3/4] bg-white rounded-lg shadow-sm flex items-center justify-center">
                        {pageThumbnails[pageNum - 1] ? (
                          <img
                            src={pageThumbnails[pageNum - 1]}
                            alt={`Page ${pageNum}`}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="text-center text-gray-400">
                            <FiFile className="w-8 h-8 mx-auto mb-2" />
                            <span className="text-sm">Page {pageNum}</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute top-2 left-2">
                        {selectedPages.has(pageNum) && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <FiCheck className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                        <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                          {pageNum}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Pane - Extract Options */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Extract Options</h3>
                <button
                  onClick={removeDocument}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center"
                >
                  <FiX className="w-4 h-4 mr-1" />
                  Remove File
                </button>
              </div>

              {/* Extract Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Split Modes
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'range', label: 'Range', icon: '📄', desc: 'Page range' },
                    { value: 'pages', label: 'Pages', icon: '📑', desc: 'Select pages', pro: false }
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setExtractMode(mode.value as any)}
                      className={`relative p-3 rounded-lg border-2 text-center transition-all ${extractMode === mode.value
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      {mode.pro && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-xs">👑</span>
                        </div>
                      )}
                      <div className="text-2xl mb-1">{mode.icon}</div>
                      <div className="text-sm font-medium text-gray-900">{mode.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Extract Mode */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Extract mode:
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setExtractMode('pages')}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${extractMode === 'pages'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    Select pages
                  </button>
                  <button
                    onClick={() => setExtractMode('range')}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${extractMode === 'range'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    Extract all pages
                  </button>
                </div>
              </div>

              {/* Pages to Extract */}
              {extractMode === 'pages' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pages to extract:
                  </label>
                  <input
                    type="text"
                    value={Array.from(selectedPages).sort((a, b) => a - b).join(', ')}
                    onChange={(e) => setPageNumbers(e.target.value)}
                    placeholder="e.g., 1, 3, 5-7, 10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedPages.size > 0
                      ? `${selectedPages.size} page(s) selected`
                      : 'Click on page previews to select pages'
                    }
                  </p>
                </div>
              )}

              {/* Range Mode */}
              {extractMode === 'range' && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Page
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={pdfInfo.pages}
                      value={startPage}
                      onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Page
                    </label>
                    <input
                      type="number"
                      min={startPage}
                      max={pdfInfo.pages}
                      value={endPage}
                      onChange={(e) => setEndPage(parseInt(e.target.value) || startPage)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Merge Checkbox */}
              <div className="mb-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">
                    Merge extracted pages into one PDF file.
                  </span>
                </label>
              </div>

              {/* Extract Button */}
              <button
                onClick={handleExtract}
                disabled={extracting || (extractMode === 'pages' && selectedPages.size === 0)}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium text-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {extracting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Extracting...
                  </>
                ) : (
                  <>
                    <FiScissors className="h-5 w-5 mr-3" />
                    Extract PDF
                  </>
                )}
              </button>
            </div>
          </div>
        )}

            {/* Results are now handled by the modal in ExtractPDFPage */}
          </>
        )}
      </div>
    </div>
  );
};

export default ExtractPDF;
