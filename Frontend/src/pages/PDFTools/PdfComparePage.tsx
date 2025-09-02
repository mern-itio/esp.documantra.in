import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Loader2,
  XCircle,
  AlertTriangle,
  Eye,
  GitCompare,
  File,
  Info,
  Target,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { pdfCompareService } from '../../services/pdfCompareService';
import type { ComparisonResult } from '../../services/pdfCompareService';

// Type declarations for PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface PDFPreview {
  file: File;
  pages: string[];
  currentPage: number;
  scale: number;
  rotation: number;
}

const PdfComparePage: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // PDF comparison
  const [selectedFile1, setSelectedFile1] = useState<File | null>(null);
  const [selectedFile2, setSelectedFile2] = useState<File | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  
  // PDF Previews
  const [pdfPreview1, setPdfPreview1] = useState<PDFPreview | null>(null);
  const [pdfPreview2, setPdfPreview2] = useState<PDFPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showDifferences, setShowDifferences] = useState(false);
  
  const file1InputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);

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

  // Load PDF and generate preview pages
  const loadPDFPreview = useCallback(async (file: File, previewNumber: 1 | 2) => {
    try {
      setIsLoadingPreview(true);
      const pdfjsLib = await loadPDFJS();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const pages: string[] = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        pages.push(canvas.toDataURL());
      }
      
      const preview: PDFPreview = {
        file,
        pages,
        currentPage: 1,
        scale: 1.0,
        rotation: 0
      };
      
      if (previewNumber === 1) {
        setPdfPreview1(preview);
      } else {
        setPdfPreview2(preview);
      }
      
    } catch (error) {
      console.error('Error loading PDF preview:', error);
      toast.error('Failed to load PDF preview');
    } finally {
      setIsLoadingPreview(false);
    }
  }, [loadPDFJS]);

  // Render PDF page to canvas with difference highlighting
  const renderPDFPage = useCallback(async (preview: PDFPreview, canvasRef: React.RefObject<HTMLCanvasElement | null>, showDifferences = false) => {
    if (!canvasRef.current || !preview.pages[preview.currentPage - 1]) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set canvas size
      canvas.width = img.width * preview.scale;
      canvas.height = img.height * preview.scale;
      
      // Apply rotation
      if (preview.rotation !== 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((preview.rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }
      
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Add difference highlighting if comparison result exists and has differences
      if (showDifferences && comparisonResult && !comparisonResult.identical) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#fbbf24'; // Yellow highlight
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        // Add a subtle border to indicate differences
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      
      if (preview.rotation !== 0) {
        ctx.restore();
      }
    };
    
    img.src = preview.pages[preview.currentPage - 1];
  }, [comparisonResult]);

  // Update preview when page/scale/rotation changes
  useEffect(() => {
    if (pdfPreview1) {
      renderPDFPage(pdfPreview1, canvas1Ref, showDifferences);
    }
  }, [pdfPreview1, renderPDFPage, showDifferences]);

  useEffect(() => {
    if (pdfPreview2) {
      renderPDFPage(pdfPreview2, canvas2Ref, showDifferences);
    }
  }, [pdfPreview2, renderPDFPage, showDifferences]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, fileNumber: 1 | 2) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      if (fileNumber === 1) {
        setSelectedFile1(file);
        setComparisonResult(null);
        await loadPDFPreview(file, 1);
      } else if (fileNumber === 2) {
        setSelectedFile2(file);
        setComparisonResult(null);
        await loadPDFPreview(file, 2);
      }
      toast.success('PDF file selected');
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const handleComparePdfs = async () => {
    if (!selectedFile1 || !selectedFile2) {
      toast.error('Please select both PDF files for comparison');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await pdfCompareService.comparePdfs(selectedFile1, selectedFile2);
      setComparisonResult(result);
      toast.success('PDF comparison completed successfully');
    } catch (error) {
      console.error('Error comparing PDFs:', error);
      toast.error('Failed to compare PDFs: ' + ((error as Error).message || 'Network error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'minor':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'major':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'minor':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'major':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to="/pdf-tools"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PDF Compare</h1>
              <p className="mt-2 text-sm text-gray-600">
                Compare two PDF documents side-by-side with detailed difference analysis and highlighting
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload PDFs for Comparison</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PDF 1 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">First PDF</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <File className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2">
                    <label className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Upload PDF 1
                      </span>
                      <input
                        ref={file1InputRef}
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileSelect(e, 1)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {selectedFile1 && (
                    <p className="text-xs text-gray-600 mt-1">
                      {selectedFile1.name}
                    </p>
                  )}
                </div>
              </div>

              {/* PDF 2 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Second PDF</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <File className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2">
                    <label className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        Upload PDF 2
                      </span>
                      <input
                        ref={file2InputRef}
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileSelect(e, 2)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {selectedFile2 && (
                    <p className="text-xs text-gray-600 mt-1">
                      {selectedFile2.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {selectedFile1 && selectedFile2 && (
              <div className="mt-4">
                <button
                  onClick={handleComparePdfs}
                  disabled={isProcessing}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <GitCompare className="w-4 h-4 mr-2" />
                  )}
                  Compare PDFs
                </button>
              </div>
            )}
          </div>

          {/* PDF Preview Section */}
          {(pdfPreview1 || pdfPreview2) && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">PDF Preview</h3>
                  {comparisonResult && (
                    <button
                      onClick={() => setShowDifferences(!showDifferences)}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        showDifferences
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showDifferences ? 'Hide' : 'Show'} Differences
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* PDF 1 Preview */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h6 className="font-medium text-gray-900">
                        {pdfPreview1?.file.name || 'PDF 1'}
                      </h6>
                      {pdfPreview1 && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              if (pdfPreview1.currentPage > 1) {
                                setPdfPreview1({...pdfPreview1, currentPage: pdfPreview1.currentPage - 1});
                              }
                            }}
                            disabled={pdfPreview1.currentPage <= 1}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                          >
                            ←
                          </button>
                          <span className="text-sm text-gray-600">
                            {pdfPreview1.currentPage} / {pdfPreview1.pages.length}
                          </span>
                          <button
                            onClick={() => {
                              if (pdfPreview1.currentPage < pdfPreview1.pages.length) {
                                setPdfPreview1({...pdfPreview1, currentPage: pdfPreview1.currentPage + 1});
                              }
                            }}
                            disabled={pdfPreview1.currentPage >= pdfPreview1.pages.length}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                          >
                            →
                          </button>
                          {/* <button
                            onClick={() => {
                              setPdfPreview1({...pdfPreview1, scale: Math.max(0.5, pdfPreview1.scale - 0.25)});
                            }}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <ZoomOut className="w-4 h-4" />
                          </button> */}
                          {/* <button
                            onClick={() => {
                              setPdfPreview1({...pdfPreview1, scale: Math.min(2.0, pdfPreview1.scale + 0.25)});
                            }}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button> */}
                          {/* <button
                            onClick={() => {
                              setPdfPreview1({...pdfPreview1, rotation: (pdfPreview1.rotation + 90) % 360});
                            }}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button> */}
                        </div>
                      )}
                    </div>
                    <div className="rounded bg-gray-50 p-2 min-h-[400px] flex items-center justify-center">
                      {isLoadingPreview ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Loading preview...</span>
                        </div>
                      ) : pdfPreview1 ? (
                        <canvas
                          ref={canvas1Ref}
                          className="max-w-full max-h-full border shadow-sm"
                          style={{ 
                            backgroundColor: 'white'
                          }}
                        />
                      ) : (
                        <div className="text-gray-500">No PDF loaded</div>
                      )}
                    </div>
                  </div>

                  {/* PDF 2 Preview */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {pdfPreview2?.file.name || 'PDF 2'}
                      </h4>
                      {pdfPreview2 && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              if (pdfPreview2.currentPage > 1) {
                                setPdfPreview2({...pdfPreview2, currentPage: pdfPreview2.currentPage - 1});
                              }
                            }}
                            disabled={pdfPreview2.currentPage <= 1}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                          >
                            ←
                          </button>
                          <span className="text-sm text-gray-600">
                            {pdfPreview2.currentPage} / {pdfPreview2.pages.length}
                          </span>
                          <button
                            onClick={() => {
                              if (pdfPreview2.currentPage < pdfPreview2.pages.length) {
                                setPdfPreview2({...pdfPreview2, currentPage: pdfPreview2.currentPage + 1});
                              }
                            }}
                            disabled={pdfPreview2.currentPage >= pdfPreview2.pages.length}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                          >
                            →
                          </button>
                          {/* <button
                            onClick={() => {
                              setPdfPreview2({...pdfPreview2, scale: Math.max(0.5, pdfPreview2.scale - 0.25)});
                            }}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <ZoomOut className="w-4 h-4" />
                          </button> */}
                          {/* <button
                            onClick={() => {
                              setPdfPreview2({...pdfPreview2, scale: Math.min(2.0, pdfPreview2.scale + 0.25)});
                            }}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button> */}
                          {/* <button
                            onClick={() => {
                              setPdfPreview2({...pdfPreview2, rotation: (pdfPreview2.rotation + 90) % 360});
                            }}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button> */}
                        </div>
                      )}
                    </div>
                    <div className="rounded bg-gray-50 p-2 min-h-[400px] flex items-center justify-center">
                      {isLoadingPreview ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Loading preview...</span>
                        </div>
                      ) : pdfPreview2 ? (
                        <canvas
                          ref={canvas2Ref}
                          className="max-w-full max-h-full border shadow-sm"
                          style={{ 
                            backgroundColor: 'white'
                          }}
                        />
                      ) : (
                        <div className="text-gray-500">No PDF loaded</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Results */}
          {comparisonResult && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Comparison Results</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className={`text-2xl font-bold ${getScoreColor(comparisonResult.statistics.similarity)}`}>
                        {comparisonResult.statistics.similarity}%
                      </span>
                      <span className="text-sm text-gray-500">Similarity</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      comparisonResult.identical 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {comparisonResult.identical ? 'Identical' : 'Different'}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Comparison Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Structure:</span>
                      <span className="ml-2 font-medium">
                        {comparisonResult.differences.structure.length} differences
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Content:</span>
                      <span className="ml-2 font-medium">
                        {comparisonResult.differences.content.length} differences
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Metadata:</span>
                      <span className="ml-2 font-medium">
                        {comparisonResult.differences.metadata.length} differences
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Visual:</span>
                      <span className="ml-2 font-medium">
                        {comparisonResult.differences.visual.length} differences
                      </span>
                    </div>
                  </div>
                </div>

                {/* Side-by-side comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">PDF 1</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">File Size:</span>
                        <span className="font-medium">{comparisonResult.statistics.pdf1.fileSizeFormatted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pages:</span>
                        <span className="font-medium">{comparisonResult.statistics.pdf1.pageCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">PDF 2</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">File Size:</span>
                        <span className="font-medium">{comparisonResult.statistics.pdf2.fileSizeFormatted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pages:</span>
                        <span className="font-medium">{comparisonResult.statistics.pdf2.pageCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Differences */}
                {Object.entries(comparisonResult.differences).map(([type, differences]) => (
                  differences.length > 0 && (
                    <div key={type} className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2 capitalize">
                        {type} Differences ({differences.length})
                      </h4>
                      <div className="space-y-2">
                        {differences.map((diff, index) => (
                          <div key={index} className={`border rounded-lg p-3 ${getSeverityColor(diff.severity || 'info')}`}>
                            <div className="flex items-start">
                              {getSeverityIcon(diff.severity || 'info')}
                              <div className="ml-2">
                                <p className="text-sm font-medium">
                                  {type === 'metadata' && diff.field ? 
                                    `${diff.field.charAt(0).toUpperCase() + diff.field.slice(1)}: "${diff.pdf1}" → "${diff.pdf2}"` :
                                    diff.message || `${type} difference detected`
                                  }
                                </p>
                                {diff.location && (
                                  <p className="text-xs mt-1 opacity-75">Location: {diff.location}</p>
                                )}
                                {type === 'metadata' && diff.field && (
                                  <div className="mt-2 text-xs">
                                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                                      PDF 1: {diff.pdf1}
                                    </span>
                                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded">
                                      PDF 2: {diff.pdf2}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}

                {/* Highlights */}
                {comparisonResult.highlights && comparisonResult.highlights.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Highlights</h4>
                    <div className="space-y-2">
                      {comparisonResult.highlights.map((highlight, index) => (
                        <div key={index} className={`border rounded-lg p-3 ${getSeverityColor(highlight.severity || 'info')}`}>
                          <div className="flex items-start">
                            {getSeverityIcon(highlight.severity || 'info')}
                            <div className="ml-2">
                              <p className="text-sm font-medium">{highlight.message}</p>
                              <p className="text-xs mt-1 opacity-75">{highlight.location}</p>
                              {highlight.type && (
                                <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs mt-1">
                                  {highlight.type}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <GitCompare className="w-4 h-4 mr-2 text-blue-600" />
                Side-by-side comparison
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Eye className="w-4 h-4 mr-2 text-green-600" />
                Difference highlighting
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Target className="w-4 h-4 mr-2 text-purple-600" />
                Detailed analysis
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                Structure detection
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <File className="w-4 h-4 mr-2 text-indigo-600" />
                Content comparison
              </div>
            </div>
          </div>

          {/* Comparison Types */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Comparison Types</h2>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Structure:</strong> Page count, dimensions, form fields
              </div>
              <div className="text-sm text-gray-600">
                <strong>Content:</strong> File size, complexity differences
              </div>
              <div className="text-sm text-gray-600">
                <strong>Metadata:</strong> Title, author, creator, producer
              </div>
              <div className="text-sm text-gray-600">
                <strong>Visual:</strong> Content density, layout differences
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How it works:</p>
                <p>Upload two PDF files to compare them side-by-side. The system will analyze structural, content, metadata, and visual differences, then highlight them with yellow overlays when you toggle the "Show Differences" button.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfComparePage;
